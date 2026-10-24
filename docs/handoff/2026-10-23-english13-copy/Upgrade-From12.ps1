param([Parameter(Mandatory = $true)][string]$TestRoot)
. (Join-Path $PSScriptRoot 'common.ps1')
Assert-Windows
Assert-Kit
$null = Assert-SupportedNode
$root = [IO.Path]::GetFullPath($TestRoot).TrimEnd('\')
$targetState = Join-Path $root 'english13-state.json'
if (Test-Path -LiteralPath $targetState) { throw 'Candidate 13 state already exists. Preserve it and use Start/Collect; do not overwrite evidence.' }
$state = Get-Content -LiteralPath (Join-Path $root 'english12-state.json') -Raw | ConvertFrom-Json
if ($state.pluginVersion -ne '0.2.0-rc.2-openbkn.0.2.0-12') { throw 'Expected the existing accepted -12 test root.' }
# Validate the new state in memory; leave english12-state.json byte-for-byte intact.
$state.pluginVersion = '0.2.0-rc.2-openbkn.0.2.0-13'
$state = Read-TestState $root $state
Assert-Dsh $state
Assert-HostStopped $state
$packageDir = Join-Path $state.profileDir 'node_modules\@openbkn\dsh-business-context'
$installed = Get-Content -LiteralPath (Join-Path $packageDir 'package.json') -Raw | ConvertFrom-Json
if ($installed.name -ne '@openbkn/dsh-business-context' -or $installed.version -notin @('0.2.0-rc.2-openbkn.0.2.0-12','0.2.0-rc.2-openbkn.0.2.0-13')) { throw 'Unexpected installed baseline; stop and report the difference.' }
$pin = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'pins.json') -Raw | ConvertFrom-Json
$tgz = Join-Path $PSScriptRoot $pin.plugin.file
$stamp = [DateTime]::UtcNow.ToString('yyyyMMddTHHmmssfffZ')
Invoke-InTestEnvironment $state {
    Invoke-NativeLogged $state.dshCli @('plugin', '--profile', $state.profile, 'add', $tgz) (Join-Path $root "private\english13-plugin-install-$stamp.log")
}
Confirm-Installed $state (Join-Path $root "evidence\english13-package-after-install-$stamp.json")
Write-JsonFile $state $targetState
Write-Host 'Installed candidate 13 in the existing isolated -12 test profile. Original -12 state and evidence were retained.'
