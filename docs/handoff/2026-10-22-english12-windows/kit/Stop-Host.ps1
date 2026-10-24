param(
    [Parameter(Mandatory = $true)][string]$TestRoot,
    [Parameter(Mandatory = $true)][string]$HostReceipt
)
. (Join-Path $PSScriptRoot 'common.ps1')
Assert-Windows
Assert-Kit
$state = Read-TestState $TestRoot
$receipt = Get-Content -LiteralPath $HostReceipt -Raw | ConvertFrom-Json
if ($receipt.dshHome -ne $state.dshHome -or $receipt.form -ne $state.form -or $receipt.pluginVersion -ne $state.pluginVersion) { throw 'Host receipt belongs to a different test root.' }
# Capture descendants before stopping the owned root. Never match all node/dsh processes.
$all = @(Get-CimInstance Win32_Process)
$owned = @{}
foreach ($identity in $receipt.processes) {
    $proc = $all | Where-Object { $_.ProcessId -eq $identity.pid } | Select-Object -First 1
    if ($null -eq $proc) { continue }
    if ($proc.ExecutablePath -ne $identity.executable -or $proc.CreationDate.ToUniversalTime().ToString('o') -ne $identity.createdAt) { throw 'PID identity changed; refusing to stop a reused PID.' }
    $owned[[int]$proc.ProcessId] = $proc
}
do {
    $added = $false
    foreach ($proc in $all) {
        if ($owned.ContainsKey([int]$proc.ParentProcessId) -and -not $owned.ContainsKey([int]$proc.ProcessId)) { $owned[[int]$proc.ProcessId] = $proc; $added = $true }
    }
} while ($added)
# Earlier owned snapshots let normal-exit cleanup detect a surviving orphan too.
foreach ($snapshotFile in @(Get-ChildItem -LiteralPath (Join-Path $state.testRoot 'evidence') -Filter '*-processes.json')) {
    $snapshot = Get-Content -LiteralPath $snapshotFile.FullName -Raw | ConvertFrom-Json
    if ($snapshot.dshHome -ne $state.dshHome -or $snapshot.form -ne $state.form) { throw 'Process snapshot belongs to a different root.' }
    foreach ($identity in $snapshot.processes) {
        $proc = $all | Where-Object { $_.ProcessId -eq $identity.pid } | Select-Object -First 1
        if ($null -ne $proc -and $proc.ExecutablePath -eq $identity.executable -and $proc.CreationDate.ToUniversalTime().ToString('o') -eq $identity.createdAt) { $owned[[int]$proc.ProcessId] = $proc }
    }
}
foreach ($identity in $receipt.processes) {
    if (-not $owned.ContainsKey([int]$identity.pid)) { continue }
    # Check again immediately before taskkill, including executable and creation time.
    $proc = Get-CimInstance Win32_Process -Filter "ProcessId=$($identity.pid)" -ErrorAction SilentlyContinue
    if ($null -eq $proc) { continue }
    if ($proc.ExecutablePath -ne $identity.executable -or $proc.CreationDate.ToUniversalTime().ToString('o') -ne $identity.createdAt) { throw 'PID identity changed before termination.' }
    & taskkill.exe /PID ([string]$identity.pid) /T /F
    if ($LASTEXITCODE -ne 0) { throw 'Owned test Host stop failed. Keep evidence; do not broaden the process match.' }
}
Start-Sleep -Milliseconds 700
$remaining = @()
foreach ($proc in @(Get-CimInstance Win32_Process)) {
    $old = $owned[[int]$proc.ProcessId]
    if ($null -ne $old -and $old.ExecutablePath -eq $proc.ExecutablePath -and $old.CreationDate -eq $proc.CreationDate) { $remaining += [int]$proc.ProcessId }
}
$listeners = @()
if ($state.form -eq 'npm') { $listeners = @(Get-NetTCPConnection -LocalPort $state.port -State Listen -ErrorAction SilentlyContinue | Select-Object LocalAddress, LocalPort, OwningProcess) }
$stamp = [DateTime]::UtcNow.ToString('yyyyMMddTHHmmssfffZ')
Write-JsonFile ([ordered]@{ capturedAt = [DateTime]::UtcNow.ToString('o'); form = $state.form; dshHome = $state.dshHome; stoppedRootPids = @($receipt.processes | ForEach-Object { $_.pid }); remainingOwnedPids = $remaining; port = $state.port; remainingListeners = $listeners; npmTagsChanged = $false }) (Join-Path $state.testRoot "evidence\cleanup-$stamp.json")
if ($remaining.Count -gt 0 -or $listeners.Count -gt 0) { throw 'Cleanup remains incomplete. Record it; do not kill unrelated processes.' }
Write-Host 'Owned test tree stopped and cleanup evidence saved. Profiles and original evidence are retained.'
