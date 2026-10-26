param(
    [Parameter(Mandatory = $true)][string]$TestRoot,
    [Parameter(Mandatory = $true)][ValidatePattern('^[A-Za-z0-9_-]+$')][string]$Phase
)
. (Join-Path $PSScriptRoot 'common.ps1')
Assert-Windows
Assert-Kit
$nodeVersion = Assert-SupportedNode
$state = Read-TestState $TestRoot
Assert-Dsh $state
$output = Join-Path $state.testRoot "evidence\$Phase-host.json"
if (Test-Path -LiteralPath $output) { throw 'Receipt already exists. Choose a new phase; original evidence is retained.' }
if ($state.form -eq 'desktop') {
    $running = @(Get-CimInstance Win32_Process -Filter "Name='DeepSeek Harness.exe'" | Where-Object {
        $_.ExecutablePath -eq $state.desktopApp -and $_.CommandLine -like "*$($state.userData)*"
    })
} else {
    $listeners = @(Get-NetTCPConnection -LocalPort $state.port -State Listen -ErrorAction SilentlyContinue)
    $owners = @($listeners | Select-Object -ExpandProperty OwningProcess -Unique)
    $running = @($owners | ForEach-Object { Get-CimInstance Win32_Process -Filter "ProcessId=$_" } | Where-Object {
        $_.CommandLine.Replace('/', '\') -like "*$($state.testRoot)\tools\*" -and $_.CommandLine -match '\bweb\b'
    })
}
if ($running.Count -eq 0) { throw 'The isolated real Host process could not be established. Do not substitute another Host.' }
$stamp = [DateTime]::UtcNow.ToString('yyyyMMddTHHmmssfffZ')
$packageReceipt = "package-$Phase-$stamp.json"
Confirm-Installed $state (Join-Path $state.testRoot "evidence\$packageReceipt")
$processes = @($running | ForEach-Object {
    [ordered]@{ pid = $_.ProcessId; executable = $_.ExecutablePath; createdAt = $_.CreationDate.ToUniversalTime().ToString('o') }
})
Write-JsonFile ([ordered]@{
    capturedAt = [DateTime]::UtcNow.ToString('o'); phase = $Phase; form = $state.form; profile = $state.profile
    dshVersion = $state.dshVersion; pluginVersion = $state.pluginVersion; nodeVersion = $nodeVersion
    os = [Environment]::OSVersion.VersionString; powershellVersion = $PSVersionTable.PSVersion.ToString()
    dshHome = $state.dshHome; dshCli = $state.dshCli; port = $state.port; processes = $processes
    dshCliSha256 = (Get-FileHash -LiteralPath $state.dshCli -Algorithm SHA256).Hash.ToLowerInvariant()
    packageReceipt = $packageReceipt; uiAcceptance = 'PENDING_MANUAL_REVIEW'
}) $output
Write-Host "Recorded $output. Package/process identity is evidence; it is not a UI pass."
