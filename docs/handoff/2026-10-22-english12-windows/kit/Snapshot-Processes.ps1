param(
    [Parameter(Mandatory = $true)][string]$TestRoot,
    [Parameter(Mandatory = $true)][ValidatePattern('^[A-Za-z0-9_-]+$')][string]$Phase,
    [Parameter(Mandatory = $true)][string]$HostReceipt
)
. (Join-Path $PSScriptRoot 'common.ps1')
Assert-Windows
Assert-Kit
$state = Read-TestState $TestRoot
$receipt = Get-Content -LiteralPath $HostReceipt -Raw | ConvertFrom-Json
if ($receipt.dshHome -ne $state.dshHome -or $receipt.form -ne $state.form -or $receipt.pluginVersion -ne $state.pluginVersion) { throw 'Host receipt belongs to a different test root.' }
$all = @(Get-CimInstance Win32_Process)
$owned = @{}
foreach ($identity in $receipt.processes) {
    $proc = $all | Where-Object { $_.ProcessId -eq $identity.pid } | Select-Object -First 1
    if ($null -eq $proc) { continue }
    if ($proc.ExecutablePath -ne $identity.executable -or $proc.CreationDate.ToUniversalTime().ToString('o') -ne $identity.createdAt) { throw 'PID was reused. Collect a fresh Host receipt.' }
    $owned[[int]$proc.ProcessId] = $true
}
do {
    $added = $false
    foreach ($proc in $all) {
        if ($owned.ContainsKey([int]$proc.ParentProcessId) -and -not $owned.ContainsKey([int]$proc.ProcessId)) {
            $owned[[int]$proc.ProcessId] = $true; $added = $true
        }
    }
} while ($added)
$rows = @($all | Where-Object { $owned.ContainsKey([int]$_.ProcessId) } | ForEach-Object {
    [ordered]@{ pid = [int]$_.ProcessId; parentPid = [int]$_.ParentProcessId; executable = $_.ExecutablePath; createdAt = $_.CreationDate.ToUniversalTime().ToString('o') }
})
$path = Join-Path $state.testRoot "evidence\$Phase-processes.json"
if (Test-Path -LiteralPath $path) { throw 'Evidence already exists; use a new phase.' }
Write-JsonFile ([ordered]@{ capturedAt = [DateTime]::UtcNow.ToString('o'); dshHome = $state.dshHome; form = $state.form; processes = $rows; commandLinesExcluded = $true }) $path
Write-Host "Recorded $($rows.Count) owned processes without command lines: $path"
