# Apply one controlled fault or the healthy baseline, then start dsh web and
# record evidence. Only mutates this test root's profile and package copies.
# Cases (aligned with the W0–W12 matrix in the Windows verification task):
#   W1  baseline (full config, no fault) — normal startup + panel export
#   W2  configuration fault (baseUrl removed from the user patch layer)
#   W3  business import fault (copy of the candidate with a broken top-level
#       import; the base tarball sha256 and modified hashes are recorded)
#   W4  initialization fault (copy whose apply() throws after the registry)
#   W10 diagnostics-service fault (copy with a broken diagnostics import)
param(
    [Parameter(Mandatory = $true)][string]$TestRoot,
    [Parameter(Mandatory = $true)][ValidateSet('W1', 'W2', 'W3', 'W4', 'W10')][string]$CaseId,
    [Parameter(Mandatory = $true)][ValidateSet('desktop', 'npm')][string]$Form,
    [Parameter(Mandatory = $true)][string]$CandidateTgz,
    [int]$Port = 8231,
    [string]$PlatformBaseUrl = '',
    [string]$CliPath = 'openbkn'
)

$ErrorActionPreference = 'Stop'
$prepared = Get-Content (Join-Path $TestRoot 'evidence\prepared.json') | ConvertFrom-Json
$dsh = $prepared.dshCli
$env:DSH_HOME = $prepared.dshHome
$profileDir = $prepared.profileDir
$installed = Join-Path $profileDir 'node_modules\@openbkn\dsh-business-context'
$evidence = Join-Path $TestRoot "evidence\$CaseId-$Form.md"

# Reinstall the pristine candidate unless the case needs a modified copy.
$installTgz = $CandidateTgz
if ($CaseId -in @('W3', 'W4', 'W10')) {
    $variantDir = Join-Path $TestRoot "variant-$CaseId"
    if (Test-Path $variantDir) { Remove-Item -Recurse -Force $variantDir }
    New-Item -ItemType Directory -Force -Path $variantDir | Out-Null
    tar -xzf $CandidateTgz -C $variantDir
    $pkg = Join-Path $variantDir 'package'
    if ($CaseId -eq 'W4') {
        $lib = Join-Path $pkg 'lib\index.js'
        $text = [IO.File]::ReadAllText($lib)
        $marker = 'await ctx.plugin(OpenBknWorkspaceBindingRegistry);'
        if (-not $text.Contains($marker)) { throw 'apply marker not found for W4' }
        $text = $text.Replace($marker, $marker + "`nthrow new Error('W4 controlled initialization failure');")
        [IO.File]::WriteAllText($lib, $text)
        $hashes = "index.js SHA256: $((Get-FileHash $lib -Algorithm SHA256).Hash)"
    } else {
        # W3 and W10 prepend a missing top-level import to the respective file.
        $lib = Join-Path $pkg ($(if ($CaseId -eq 'W3') { 'lib\index.js' } else { 'lib\diagnostics.js' }))
        $prefix = "import './w-broken.js';`n"
        [IO.File]::WriteAllText($lib, $prefix + [IO.File]::ReadAllText($lib))
        $hashes = "$lib SHA256: $((Get-FileHash $lib -Algorithm SHA256).Hash)"
    }
    $installTgz = Join-Path $TestRoot "variant-$CaseId.tgz"
    tar -czf $installTgz -C $variantDir package
    "base tgz SHA256: $((Get-FileHash $CandidateTgz -Algorithm SHA256).Hash)" | Set-Content -Encoding utf8 $evidence
    "variant tgz SHA256: $((Get-FileHash $installTgz -Algorithm SHA256).Hash)" | Add-Content -Encoding utf8 $evidence
    $hashes | Add-Content -Encoding utf8 $evidence
    "note: variant is intentionally not byte-identical to the candidate" | Add-Content -Encoding utf8 $evidence
}

Remove-Item -Recurse -Force (Join-Path $profileDir 'node_modules\@openbkn') -ErrorAction SilentlyContinue
& $dsh plugin --profile web install $installTgz
if ($LASTEXITCODE -ne 0) { throw "install of $installTgz failed" }

# User patch layer: the healthy config or the W2 fault (baseUrl omitted).
$patch = Join-Path $profileDir 'cordis.patch.yml'
if ($CaseId -eq 'W2') {
    "- id: openbkn-business-context`n  config:`n    cliPath: $CliPath" | Set-Content -Encoding utf8 $patch
} else {
    $base = if ($PlatformBaseUrl -ne '') { $PlatformBaseUrl } else { 'https://platform.invalid.example' }
    "- id: openbkn-business-context`n  config:`n    baseUrl: $base`n    cliPath: $CliPath" | Set-Content -Encoding utf8 $patch
}

# Start dsh web detached from this script's console; do not kill any other dsh.
$log = Join-Path $TestRoot "evidence\$CaseId-$Form-web.log"
$proc = Start-Process -FilePath $dsh -ArgumentList @('web', '--port', $Port, '--no-open') `
    -RedirectStandardOutput $log -RedirectStandardError (Join-Path $TestRoot "evidence\$CaseId-$Form-web.err.log") `
    -PassThru -WindowStyle Hidden
Start-Sleep -Seconds 10
"started pid $($proc.Id) on port $Port" | Add-Content -Encoding utf8 $evidence
Get-Content $log | Add-Content -Encoding utf8 $evidence

Write-Host "Case $CaseId ($Form) running on http://127.0.0.1:$Port (pid $($proc.Id))."
Write-Host "Open the UI in a browser, exercise the OpenBKN diagnostics panel, then record results."
Write-Host "Stop with: cleanup.ps1 -TestRoot $TestRoot (it only stops pids it started; check evidence\*.json)."
$proc.Id | Set-Content -Encoding utf8 (Join-Path $TestRoot "evidence\$CaseId-$Form.pid")
