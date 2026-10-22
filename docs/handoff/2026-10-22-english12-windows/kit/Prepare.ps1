param(
    [Parameter(Mandatory = $true)][ValidateSet('Init', 'Install')][string]$Step,
    [Parameter(Mandatory = $true)][ValidateSet('desktop', 'npm')][string]$Form,
    [Parameter(Mandatory = $true)][string]$TestRoot,
    [string]$DesktopApp = '',
    [ValidateRange(1024, 65535)][int]$Port = 18411
)
. (Join-Path $PSScriptRoot 'common.ps1')
Assert-Windows
Assert-Kit
$nodeVersion = Assert-SupportedNode
$root = [IO.Path]::GetFullPath($TestRoot).TrimEnd('\')

if ($Step -eq 'Init') {
    if (-not [IO.Path]::IsPathRooted($TestRoot) -or (Test-Path -LiteralPath $root)) { throw 'Choose an absolute, new test root. Existing roots are never overwritten.' }
    $profileName = if ($Form -eq 'desktop') { 'desktop' } else { 'web' }
    $app = ''; $cli = Join-Path $root 'tools\node_modules\.bin\dsh.cmd'
    if ($Form -eq 'desktop') {
        if (-not [IO.Path]::IsPathRooted($DesktopApp) -or -not (Test-Path -LiteralPath $DesktopApp -PathType Leaf)) { throw 'Pass the absolute path to the official DeepSeek Harness.exe.' }
        $app = [IO.Path]::GetFullPath($DesktopApp)
        $cli = Join-Path (Split-Path -Parent $app) 'resources\runtime\cli\bin\dsh.cmd'
    }
    $state = [ordered]@{
        schema = 1; form = $Form; profile = $profileName; testRoot = $root
        pluginVersion = '0.2.0-rc.2-openbkn.0.2.0-12'; dshVersion = '0.2.0-rc.2'
        dshCli = $cli; desktopApp = $app; port = $Port; nodeAtInit = $nodeVersion
        dshHome = (Join-Path $root 'dsh-home'); profileDir = (Join-Path $root "dsh-home\profiles\$profileName")
        bknConfigDir = (Join-Path $root 'bkn-config'); userData = (Join-Path $root 'electron-user-data')
        createdAt = [DateTime]::UtcNow.ToString('o')
    }
    if ($Form -eq 'desktop') { Assert-Dsh ([pscustomobject]$state); Assert-HostStopped ([pscustomobject]$state) }
    New-Item -ItemType Directory -Path $root | Out-Null
    foreach ($dir in @('dsh-home', 'evidence', 'private', 'bkn-config', 'electron-user-data')) { New-Item -ItemType Directory -Path (Join-Path $root $dir) | Out-Null }
    Write-JsonFile $state (Join-Path $root 'english12-state.json')
    Write-Host "Initialized $Form / $profileName at $root. Follow CHECKLIST.zh.md before the Install step."
    return
}

$state = Read-TestState $root
if ($state.form -ne $Form) { throw 'Form differs from the initialized test root.' }
Assert-Dsh $state
Assert-HostStopped $state
if ($Form -eq 'desktop' -and -not (Test-Path -LiteralPath (Join-Path $state.profileDir 'package.json'))) { throw 'Bootstrap the real Desktop app once, then fully quit it, before installation.' }
$pin = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'pins.json') -Raw | ConvertFrom-Json
$tgz = Join-Path $PSScriptRoot $pin.plugin.file
Invoke-InTestEnvironment $state {
    Invoke-NativeLogged $state.dshCli @('plugin', '--profile', $state.profile, 'add', $tgz) (Join-Path $root 'private\plugin-install.log')
}
Confirm-Installed $state (Join-Path $root 'evidence\installed-package.json')
Write-Host 'Candidate -12 files verified. Start the real Host, then run every checklist case for this form.'
