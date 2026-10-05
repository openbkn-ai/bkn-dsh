# Apply one controlled fault or the healthy baseline, then start the real
# host for the chosen form and record evidence. Only mutates this test
# root's profile and package copies.
# Cases (aligned with the W0–W12 matrix in the Windows verification task):
#   W1  baseline (full config, no fault) — normal startup + panel export
#   W2  configuration fault (baseUrl removed from the user patch layer)
#   W3  business import fault (copy of the candidate with a broken top-level
#       import; the base tarball sha256 and modified hashes are recorded)
#   W4  initialization fault (copy whose apply() throws after the registry)
#   W10 diagnostics-service fault (copy with a broken diagnostics import)
# Forms: 'desktop' starts the real DeepSeek Harness application against the
# desktop profile (DSH_HOME of this test root); 'npm' starts `dsh web`.
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
$profileDir = $prepared.profileDir
$evidence = Join-Path $TestRoot "evidence\$CaseId-$Form.md"

# Reinstall the pristine candidate unless the case needs a modified copy.
$installTgz = $CandidateTgz
if ($CaseId -in @('W3', 'W4', 'W10')) {
    $variantDir = Join-Path $TestRoot "variant-$CaseId"
    if (Test-Path $variantDir) { Remove-Item -Recurse -Force $variantDir }
    New-Item -ItemType Directory -Force -Path $variantDir | Out-Null
    tar -xzf $CandidateTgz -C $variantDir
    $pkg = Join-Path $variantDir 'package'
    # Resolve each row's runtime file from the manifest exports so an entry
    # rename cannot silently turn a fault case into a healthy install.
    $manifest = Get-Content (Join-Path $pkg 'package.json') | ConvertFrom-Json
    $businessEntry = $manifest.exports.'./business'.default
    $diagnosticsEntry = $manifest.exports.'./diagnostics'.default
    $businessLib = Join-Path $pkg ($businessEntry -replace '/', '\')
    $diagnosticsLib = Join-Path $pkg ($diagnosticsEntry -replace '/', '\')
    if ($CaseId -eq 'W4') {
        $text = [IO.File]::ReadAllText($businessLib)
        $marker = 'await ctx.plugin(OpenBknWorkspaceBindingRegistry);'
        if (-not $text.Contains($marker)) { throw 'apply marker not found for W4' }
        $text = $text.Replace($marker, $marker + "`nthrow new Error('W4 controlled initialization failure');")
        [IO.File]::WriteAllText($businessLib, $text)
        $hashes = "business entry SHA256: $((Get-FileHash $businessLib -Algorithm SHA256).Hash)"
    } else {
        # W3 breaks the business entry's imports; W10 breaks the diagnostics
        # implementation. Breaking the bootstrap root is a whole-package fault
        # and must not stand in for either case.
        $target = if ($CaseId -eq 'W3') { $businessLib } else { $diagnosticsLib }
        $prefix = "import './D0_S2_CANARY_20261005.js';`n"
        [IO.File]::WriteAllText($target, $prefix + [IO.File]::ReadAllText($target))
        $hashes = "$([IO.Path]::GetFileName($target)) SHA256: $((Get-FileHash $target -Algorithm SHA256).Hash)"
    }
    $installTgz = Join-Path $TestRoot "variant-$CaseId.tgz"
    tar -czf $installTgz -C $variantDir package
    "base tgz SHA256: $((Get-FileHash $CandidateTgz -Algorithm SHA256).Hash)" | Set-Content -Encoding utf8 $evidence
    "variant tgz SHA256: $((Get-FileHash $installTgz -Algorithm SHA256).Hash)" | Add-Content -Encoding utf8 $evidence
    $hashes | Add-Content -Encoding utf8 $evidence
    "note: variant is intentionally not byte-identical to the candidate" | Add-Content -Encoding utf8 $evidence
}

# Install under the profile this form actually boots; the running host and
# the profile under test must be the same one.
$env:DSH_HOME = $prepared.dshHome
$profileName = $prepared.profile
Remove-Item -Recurse -Force (Join-Path $profileDir 'node_modules\@openbkn') -ErrorAction SilentlyContinue
& $dsh plugin --profile $profileName install $installTgz
if ($LASTEXITCODE -ne 0) { throw "install of $installTgz failed" }

# User patch layer: the healthy config or the W2 fault (baseUrl omitted).
$patch = Join-Path $profileDir 'cordis.patch.yml'
if ($CaseId -eq 'W2') {
    "- id: openbkn-business-context`n  config:`n    cliPath: $CliPath" | Set-Content -Encoding utf8 $patch
} else {
    $base = if ($PlatformBaseUrl -ne '') { $PlatformBaseUrl } else { 'https://platform.invalid.example' }
    "- id: openbkn-business-context`n  config:`n    baseUrl: $base`n    cliPath: $CliPath" | Set-Content -Encoding utf8 $patch
}

if ($Form -eq 'desktop') {
    # The ordinary desktop application is the host under test. It inherits
    # this shell's DSH_HOME, so it boots the isolated profile we installed.
    $app = $prepared.desktopAppPath
    $proc = Start-Process -FilePath $app -PassThru
    Start-Sleep -Seconds 20
    "started desktop app pid $($proc.Id) (DSH_HOME=$($prepared.dshHome), profile $profileName)" | Add-Content -Encoding utf8 $evidence
    Write-Host "Case $CaseId (desktop): the DeepSeek Harness application started (pid $($proc.Id))."
    Write-Host "Open the OpenBKN diagnostics entry inside the application, exercise the case, and export the report."
    $proc.Id | Set-Content -Encoding utf8 (Join-Path $TestRoot "evidence\$CaseId-$Form.pid")
} else {
    $log = Join-Path $TestRoot "evidence\$CaseId-$Form-web.log"
    $proc = Start-Process -FilePath $dsh -ArgumentList @('web', '--port', $Port, '--no-open') `
        -RedirectStandardOutput $log -RedirectStandardError (Join-Path $TestRoot "evidence\$CaseId-$Form-web.err.log") `
        -PassThru -WindowStyle Hidden
    Start-Sleep -Seconds 10
    "started dsh web pid $($proc.Id) on port $Port" | Add-Content -Encoding utf8 $evidence
    Get-Content $log -ErrorAction SilentlyContinue | Add-Content -Encoding utf8 $evidence
    Write-Host "Case $CaseId (npm): dsh web on http://127.0.0.1:$Port (pid $($proc.Id)). Exercise the diagnostics panel in a browser."
    $proc.Id | Set-Content -Encoding utf8 (Join-Path $TestRoot "evidence\$CaseId-$Form.pid")
}

Write-Host "Stop with: cleanup.ps1 -TestRoot $TestRoot -CandidateTgz <path> (it only stops pids recorded here)."
