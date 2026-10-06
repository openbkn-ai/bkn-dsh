# Windows verification prep: isolated test root, form-specific profile, and
# candidate install. Only writes under $TestRoot. Verifies the desktop and
# npm CLI forms exist and refuses to continue when their paths or versions
# cannot be established.
param(
    [Parameter(Mandatory = $true)][string]$TestRoot,
    [Parameter(Mandatory = $true)][ValidateSet('desktop', 'npm')][string]$Form,
    [Parameter(Mandatory = $true)][string]$CandidateTgz,
    [string]$NpmDshCli = ''
)

$ErrorActionPreference = 'Stop'
if (Test-Path $TestRoot) {
    # Windows first-boot requirement: the desktop CLI refuses to install into a
    # profile the app has never initialized, so the tester must boot the app
    # once against this test root's DSH_HOME before preparing. Accept a root
    # holding only that dsh-home; any other pre-existing content stays foreign.
    $existing = @(Get-ChildItem -LiteralPath $TestRoot -Force)
    if ($existing.Count -ne 1 -or $existing[0].Name -ne 'dsh-home') {
        throw "Choose a fresh test root: $TestRoot"
    }
}
if (-not (Test-Path -LiteralPath $CandidateTgz -PathType Leaf)) { throw 'Candidate tgz is missing' }

$desktopCli = Join-Path $env:LOCALAPPDATA 'Programs\DeepSeek Harness\resources\runtime\cli\bin\dsh.cmd'
$desktopCliAlt = 'C:\Program Files\DeepSeek Harness\resources\runtime\cli\bin\dsh.cmd'
$desktopApp = Join-Path $env:LOCALAPPDATA 'Programs\DeepSeek Harness\DeepSeek Harness.exe'
$desktopAppAlt = 'C:\Program Files\DeepSeek Harness\DeepSeek Harness.exe'
# Start-Process must use the npm .cmd shim, not a PATH .ps1 wrapper.
$npmCli = if ($NpmDshCli -ne '') { [IO.Path]::GetFullPath($NpmDshCli) } else { (Get-Command dsh.cmd -ErrorAction SilentlyContinue).Source }

function Resolve-DshCli([string]$form) {
    if ($form -eq 'desktop') {
        foreach ($candidate in @($desktopCliAlt, $desktopCli)) {
            if (Test-Path $candidate) { return $candidate }
        }
        throw "desktop form requested but no desktop dsh CLI found at the known locations ($desktopCliAlt / $desktopCli)"
    }
    if ($null -eq $npmCli -or -not (Test-Path -LiteralPath $npmCli -PathType Leaf)) { throw "npm form requested but no npm dsh.cmd found; use -NpmDshCli" }
    if ([IO.Path]::GetExtension($npmCli) -ne '.cmd') { throw 'npm form requires its .cmd shim for Start-Process' }
    if ($npmCli -in @($desktopCliAlt, $desktopCli)) { throw 'npm form resolved the desktop CLI; use -NpmDshCli' }
    return $npmCli
}

$dsh = Resolve-DshCli $Form
$dshVersion = (& $dsh --version | Out-String).Trim()
if ($LASTEXITCODE -ne 0) { throw "dsh --version failed for $dsh" }
if ($dshVersion -ne '0.2.0-rc.2') { throw "Unsupported DSH version: $dshVersion" }

# The desktop application boots its own desktop profile; the npm CLI uses the
# web profile. Keeping them apart is what makes the evidence form-specific.
$profileName = if ($Form -eq 'desktop') { 'desktop' } else { 'web' }

New-Item -ItemType Directory -Force -Path (Join-Path $TestRoot 'dsh-home') | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $TestRoot 'evidence') | Out-Null

$env:DSH_HOME = Join-Path $TestRoot 'dsh-home'
$env:BKN_CONFIG_DIR = Join-Path $TestRoot 'bkn-config'
& $dsh plugin --profile $profileName install $CandidateTgz
if ($LASTEXITCODE -ne 0) { throw "candidate install failed" }

$desktopAppPath = $null
if ($Form -eq 'desktop') {
    foreach ($candidate in @($desktopAppAlt, $desktopApp)) {
        if (Test-Path $candidate) { $desktopAppPath = $candidate; break }
    }
    if ($null -eq $desktopAppPath) { throw "desktop form requested but the DeepSeek Harness application was not found" }
}

$state = [ordered]@{
    form           = $Form
    profile        = $profileName
    dshCli         = $dsh
    dshVersion     = $dshVersion
    desktopAppPath = $desktopAppPath
    dshHome        = $env:DSH_HOME
    bknConfigDir   = $env:BKN_CONFIG_DIR
    candidate      = (Get-FileHash $CandidateTgz -Algorithm SHA256).Hash
    profileDir     = (Join-Path $env:DSH_HOME "profiles\$profileName")
}
$state | ConvertTo-Json | Set-Content -Encoding utf8 (Join-Path $TestRoot 'evidence\prepared.json')
Write-Host "Prepared $Form form (profile $profileName) under $TestRoot. Next: run-case.ps1 -CaseId W1 -Form $Form"
