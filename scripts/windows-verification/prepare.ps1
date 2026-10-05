# Windows verification prep: isolated test root, profile, and candidate install.
# Only writes under $TestRoot. Verifies the desktop and npm CLI forms exist and
# refuses to continue when their paths or versions cannot be established.
param(
    [Parameter(Mandatory = $true)][string]$TestRoot,
    [Parameter(Mandatory = $true)][ValidateSet('desktop', 'npm')][string]$Form,
    [Parameter(Mandatory = $true)][string]$CandidateTgz
)

$ErrorActionPreference = 'Stop'

$desktopCli = Join-Path $env:LOCALAPPDATA 'Programs\DeepSeek Harness\resources\runtime\cli\bin\dsh.cmd'
$desktopCliAlt = 'C:\Program Files\DeepSeek Harness\resources\runtime\cli\bin\dsh.cmd'
$npmCli = (Get-Command dsh -ErrorAction SilentlyContinue).Source

function Resolve-DshCli([string]$form) {
    if ($form -eq 'desktop') {
        foreach ($candidate in @($desktopCliAlt, $desktopCli)) {
            if (Test-Path $candidate) { return $candidate }
        }
        throw "desktop form requested but no desktop dsh CLI found at the known locations ($desktopCliAlt / $desktopCli)"
    }
    if ($null -eq $npmCli) { throw "npm form requested but 'dsh' is not on PATH" }
    return $npmCli
}

$dsh = Resolve-DshCli $Form
$null = & $dsh --version
if ($LASTEXITCODE -ne 0) { throw "dsh --version failed for $dsh" }

New-Item -ItemType Directory -Force -Path (Join-Path $TestRoot 'dsh-home') | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $TestRoot 'evidence') | Out-Null

$env:DSH_HOME = Join-Path $TestRoot 'dsh-home'
& $dsh plugin --profile web install $CandidateTgz
if ($LASTEXITCODE -ne 0) { throw "candidate install failed" }

$state = [ordered]@{
    form       = $Form
    dshCli     = $dsh
    dshHome    = $env:DSH_HOME
    candidate  = (Get-FileHash $CandidateTgz -Algorithm SHA256).Hash
    profileDir = (Join-Path $env:DSH_HOME 'profiles\web')
}
$state | ConvertTo-Json | Set-Content -Encoding utf8 (Join-Path $TestRoot 'evidence\prepared.json')
Write-Host "Prepared $Form form under $TestRoot. Next: run-case.ps1 -CaseId W1 -Form $Form"
