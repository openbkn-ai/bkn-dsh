# Shared helpers. ASCII source intentionally supports Windows PowerShell 5.1.
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Write-JsonFile($Value, [string]$Path) {
    $json = $Value | ConvertTo-Json -Depth 30
    [IO.File]::WriteAllText($Path, $json + "`n", (New-Object Text.UTF8Encoding($false)))
}

function Assert-Windows {
    if ([Environment]::OSVersion.Platform -ne [PlatformID]::Win32NT) { throw 'Run this operation on native Windows.' }
}

function Assert-SupportedNode {
    $version = (& node --version | Out-String).Trim()
    if ($LASTEXITCODE -ne 0 -or $version -notmatch '^v(\d+)\.(\d+)\.(\d+)$') { throw 'Node version could not be established.' }
    $major = [int]$Matches[1]; $minor = [int]$Matches[2]
    if (-not (($major -eq 22 -and $minor -ge 19) -or $major -ge 24)) { throw "Unsupported Node: $version. Use Node 22.19+ or 24+." }
    return $version
}

function Assert-Kit {
    & node (Join-Path $PSScriptRoot 'verify.mjs') kit $PSScriptRoot
    if ($LASTEXITCODE -ne 0) { throw 'Kit integrity verification failed.' }
}

function Read-TestState([string]$TestRoot) {
    $root = [IO.Path]::GetFullPath($TestRoot).TrimEnd('\')
    $state = Get-Content -LiteralPath (Join-Path $root 'english12-state.json') -Raw | ConvertFrom-Json
    if ($state.testRoot -ne $root -or $state.pluginVersion -ne '0.2.0-rc.2-openbkn.0.2.0-12' -or $state.dshVersion -ne '0.2.0-rc.2') { throw 'Test-root identity mismatch.' }
    if ($state.form -notin @('desktop', 'npm')) { throw 'Invalid form in test state.' }
    $profileName = if ($state.form -eq 'desktop') { 'desktop' } else { 'web' }
    if ($state.profile -ne $profileName -or $state.dshHome -ne (Join-Path $root 'dsh-home') -or $state.profileDir -ne (Join-Path $root "dsh-home\profiles\$profileName") -or $state.bknConfigDir -ne (Join-Path $root 'bkn-config') -or $state.userData -ne (Join-Path $root 'electron-user-data')) { throw 'Isolated paths/profile do not match this test root.' }
    if ($state.form -eq 'npm' -and $state.dshCli -ne (Join-Path $root 'tools\node_modules\.bin\dsh.cmd')) { throw 'npm form must use this root\s official npm CLI.' }
    return $state
}

function Assert-Dsh($State) {
    if (-not (Test-Path -LiteralPath $State.dshCli -PathType Leaf)) { throw "DSH CLI missing: $($State.dshCli)" }
    $version = (& $State.dshCli --version | Out-String).Trim()
    if ($LASTEXITCODE -ne 0 -or $version -ne '0.2.0-rc.2') { throw "Expected DSH 0.2.0-rc.2; got $version" }
    if ($State.form -eq 'npm') {
        $manifest = Get-Content -LiteralPath (Join-Path $State.testRoot 'tools\node_modules\@deepseek-ai\dsh\package.json') -Raw | ConvertFrom-Json
        if ($manifest.name -ne '@deepseek-ai/dsh' -or $manifest.version -ne '0.2.0-rc.2') { throw 'npm Host manifest mismatch.' }
    } else {
        if (-not (Test-Path -LiteralPath $State.desktopApp -PathType Leaf)) { throw 'Desktop executable missing.' }
        $expectedCli = Join-Path (Split-Path -Parent $State.desktopApp) 'resources\runtime\cli\bin\dsh.cmd'
        if ($State.dshCli -ne $expectedCli) { throw 'Desktop CLI must belong to the same installation as the application.' }
    }
}

function Assert-HostStopped($State) {
    if ($State.form -eq 'desktop') {
        $running = @(Get-CimInstance Win32_Process -Filter "Name='DeepSeek Harness.exe'" | Where-Object { $_.ExecutablePath -eq $State.desktopApp })
        if ($running.Count -gt 0) { throw 'Fully quit DeepSeek Harness (including its tray/background instance) before continuing.' }
    } else {
        $listener = @(Get-NetTCPConnection -LocalPort $State.port -State Listen -ErrorAction SilentlyContinue)
        if ($listener.Count -gt 0) { throw "Port $($State.port) is occupied. Stop the test Host or use a fresh root with a different port." }
    }
}

function Invoke-InTestEnvironment($State, [scriptblock]$Operation) {
    $oldDsh = $env:DSH_HOME; $oldBkn = $env:BKN_CONFIG_DIR
    try {
        $env:DSH_HOME = $State.dshHome
        $env:BKN_CONFIG_DIR = $State.bknConfigDir
        & $Operation
    } finally {
        $env:DSH_HOME = $oldDsh; $env:BKN_CONFIG_DIR = $oldBkn
    }
}

function Confirm-Installed($State, [string]$OutputFile) {
    $packageDir = Join-Path $State.profileDir 'node_modules\@openbkn\dsh-business-context'
    & node (Join-Path $PSScriptRoot 'verify.mjs') installed $PSScriptRoot $packageDir $OutputFile
    if ($LASTEXITCODE -ne 0) { throw 'Installed plugin differs from the candidate -12 package.' }
}

function Invoke-NativeLogged([string]$Executable, [string[]]$Arguments, [string]$Log) {
    # PowerShell 5.1 turns redirected native stderr into ErrorRecord objects.
    # Do not treat ordinary stderr progress as failure; use the actual exit code.
    $previous = $ErrorActionPreference
    try {
        $ErrorActionPreference = 'Continue'
        & $Executable @Arguments 2>&1 | Tee-Object -FilePath $Log
        $nativeExit = $LASTEXITCODE
    } finally { $ErrorActionPreference = $previous }
    if ($nativeExit -ne 0) { throw "Native command failed with exit code $nativeExit. Original log retained: $Log" }
}
