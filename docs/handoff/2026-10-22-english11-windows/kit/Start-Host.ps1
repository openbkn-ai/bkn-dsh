param(
    [Parameter(Mandatory = $true)][string]$TestRoot,
    [switch]$BootstrapDesktop
)
. (Join-Path $PSScriptRoot 'common.ps1')
Assert-Windows
Assert-Kit
$null = Assert-SupportedNode
$state = Read-TestState $TestRoot
Assert-Dsh $state
Assert-HostStopped $state
if ($BootstrapDesktop -and $state.form -ne 'desktop') { throw 'BootstrapDesktop is only for native Desktop initialization.' }
$stamp = [DateTime]::UtcNow.ToString('yyyyMMddTHHmmssfffZ')
if (-not $BootstrapDesktop) { Confirm-Installed $state (Join-Path $state.testRoot "evidence\package-before-start-$stamp.json") }
$start = [ordered]@{
    startedAt = [DateTime]::UtcNow.ToString('o'); form = $state.form; profile = $state.profile
    dshCli = $state.dshCli; dshCliSha256 = (Get-FileHash -LiteralPath $state.dshCli -Algorithm SHA256).Hash.ToLowerInvariant()
    dshHome = $state.dshHome; bootstrap = [bool]$BootstrapDesktop; port = $state.port
}
Invoke-InTestEnvironment $state {
    if ($state.form -eq 'desktop') {
        $proc = Start-Process -FilePath $state.desktopApp -ArgumentList @("--user-data-dir=`"$($state.userData)`"") -PassThru
        $start['launcherPid'] = $proc.Id
        $start['desktopApp'] = $state.desktopApp
        $start['desktopAppSha256'] = (Get-FileHash -LiteralPath $state.desktopApp -Algorithm SHA256).Hash.ToLowerInvariant()
        Write-JsonFile $start (Join-Path $state.testRoot "evidence\launch-$stamp.json")
        Write-Host 'Real Desktop launched. Fully quit through the app menu before installing or restarting.'
    } else {
        $start['launcherPid'] = $PID
        Write-JsonFile $start (Join-Path $state.testRoot "evidence\launch-$stamp.json")
        Write-Host 'The startup URL contains a local access token. Use it locally; do not share the URL or this private log.'
        Write-Host 'Keep this terminal running. Use a second PowerShell for Collect-Receipt.ps1. Stop this Host with Ctrl+C.'
        Invoke-NativeLogged $state.dshCli @('web', '--port', [string]$state.port, '--no-open') (Join-Path $state.testRoot "private\web-$stamp.log")
    }
}
