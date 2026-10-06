# Offline identity and completeness check. This does not start DSH or log in.
param([string]$KitRoot = $PSScriptRoot)
$ErrorActionPreference = 'Stop'
$DiagRoot = [IO.Path]::GetFullPath($KitRoot)
$DiagManifest = Get-Content -Raw -LiteralPath (Join-Path $DiagRoot 'candidate-manifest.json') | ConvertFrom-Json
if ($DiagManifest.template -ne $false) { throw 'Template manifest is not executable input' }
if ($DiagManifest.candidate.version -ne '0.2.0-rc.2-openbkn.0.2.0-7') { throw 'Unexpected candidate version' }
if ($DiagManifest.candidate.sourceCommit -ne '3414bdec3c956cc0d580aebd959ac6f3439bb352') { throw 'Unexpected source commit' }
if ($DiagManifest.candidate.build.publish -ne $false -or $DiagManifest.candidate.build.runId -ne 37478119730) { throw 'Unexpected build-only CI identity' }

function Resolve-KitFile([string]$Relative) {
    if ([IO.Path]::IsPathRooted($Relative)) { throw "Kit path must be relative: $Relative" }
    $DiagPath = [IO.Path]::GetFullPath((Join-Path $DiagRoot $Relative))
    $DiagPrefix = $DiagRoot.TrimEnd([IO.Path]::DirectorySeparatorChar) + [IO.Path]::DirectorySeparatorChar
    if (-not $DiagPath.StartsWith($DiagPrefix, [StringComparison]::OrdinalIgnoreCase)) { throw "Path escapes kit: $Relative" }
    if (-not (Test-Path -LiteralPath $DiagPath -PathType Leaf)) { throw "Kit file missing: $Relative" }
    return $DiagPath
}

$DiagAssets = Get-Content -Raw -LiteralPath (Resolve-KitFile 'kit-files.json') | ConvertFrom-Json
foreach ($DiagAsset in $DiagAssets.files) {
    $DiagFile = Resolve-KitFile $DiagAsset.path
    if ((Get-FileHash -LiteralPath $DiagFile -Algorithm SHA256).Hash -ne $DiagAsset.sha256) { throw "Kit hash differs: $($DiagAsset.path)" }
}
$DiagTgz = Resolve-KitFile $DiagManifest.candidate.artifact.path
if ((Get-FileHash -LiteralPath $DiagTgz -Algorithm SHA256).Hash -ne $DiagManifest.candidate.artifact.sha256) { throw 'Candidate tgz SHA-256 differs' }
$DiagFiles = Get-Content -Raw -LiteralPath (Resolve-KitFile $DiagManifest.candidate.artifact.fileManifestJsonPath) | ConvertFrom-Json
if ($DiagFiles.files.Count -ne $DiagManifest.candidate.artifact.fileCount) { throw 'Candidate file count differs' }

$DiagScratch = Join-Path ([IO.Path]::GetTempPath()) ('bkn-kit-verify-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $DiagScratch | Out-Null
try {
    $DiagTarPaths = @(& tar -tzf $DiagTgz)
    if ($LASTEXITCODE -ne 0) { throw 'Cannot read candidate tarball' }
    foreach ($DiagTarPath in $DiagTarPaths) {
        if ($DiagTarPath -notmatch '^package/' -or $DiagTarPath -match '(^|[\\/])\.\.([\\/]|$)') { throw 'Unexpected tarball path' }
    }
    & tar -xzf $DiagTgz -C $DiagScratch
    if ($LASTEXITCODE -ne 0) { throw 'Cannot extract candidate tarball' }
    foreach ($DiagExpected in $DiagFiles.files) {
        $DiagFile = Join-Path $DiagScratch $DiagExpected.path
        if (-not (Test-Path -LiteralPath $DiagFile -PathType Leaf)) { throw "Missing tarball file: $($DiagExpected.path)" }
        if ((Get-FileHash -LiteralPath $DiagFile -Algorithm SHA256).Hash -ne $DiagExpected.sha256) { throw "Tarball file differs: $($DiagExpected.path)" }
    }
    $DiagActualCount = @(Get-ChildItem -LiteralPath (Join-Path $DiagScratch 'package') -Recurse -File).Count
    if ($DiagActualCount -ne $DiagFiles.files.Count) { throw 'Unexpected additional tarball files' }
    $DiagPackage = Get-Content -Raw -LiteralPath (Join-Path $DiagScratch 'package/package.json') | ConvertFrom-Json
    if ($DiagPackage.version -ne $DiagManifest.candidate.version) { throw 'Packed package version differs' }
    foreach ($DiagHelper in @('prepare.ps1', 'run-case.ps1', 'collect-state-hashes.ps1', 'cleanup.ps1')) {
        $DiagTokens = $null; $DiagErrors = $null
        [System.Management.Automation.Language.Parser]::ParseFile((Resolve-KitFile ('windows/' + $DiagHelper)), [ref]$DiagTokens, [ref]$DiagErrors) | Out-Null
        if ($DiagErrors.Count -gt 0) { throw "PowerShell parse failed: $DiagHelper" }
    }
} finally {
    Remove-Item -LiteralPath $DiagScratch -Recurse -Force
}
Write-Host "Kit identity verified: $($DiagManifest.candidate.version), $($DiagFiles.files.Count) files, CI $($DiagManifest.candidate.build.runId), publish=false."
Write-Host 'This is a static kit check; unified -7 native Windows affected retest remains required.'
