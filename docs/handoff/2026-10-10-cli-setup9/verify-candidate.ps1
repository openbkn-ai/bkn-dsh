param(
  [Parameter(Mandatory=$true)][string]$Tarball,
  [string]$InstalledPackagePath
)
$ErrorActionPreference = 'Stop'
$taskEvidence = Join-Path $PSScriptRoot '..\..\evidence\cli-setup9-20261010'
$taskManifest = Get-Content (Join-Path $taskEvidence 'candidate-manifest.json') -Raw | ConvertFrom-Json
$taskFilesPath = Join-Path $taskEvidence 'candidate-files.json'
$taskFiles = @(Get-Content $taskFilesPath -Raw | ConvertFrom-Json)
if ((Get-FileHash $taskFilesPath -Algorithm SHA256).Hash.ToLowerInvariant() -ne $taskManifest.filesManifestSha256) { throw 'File manifest SHA mismatch' }
if ($taskFiles.Count -ne $taskManifest.files) { throw 'File count mismatch' }
$taskTarball = (Resolve-Path $Tarball).Path
$taskActualSha = (Get-FileHash $taskTarball -Algorithm SHA256).Hash.ToLowerInvariant()
if ($taskActualSha -ne $taskManifest.sha256 -or (Get-Item $taskTarball).Length -ne $taskManifest.bytes) { throw 'Tarball SHA or size mismatch' }
$taskExtraction = Join-Path ([IO.Path]::GetTempPath()) ('bkn-cli9-verify-' + [Guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory $taskExtraction | Out-Null
& tar -xf $taskTarball -C $taskExtraction
if ($LASTEXITCODE -ne 0) { throw 'tar extraction failed' }

function Test-PackageFiles([string]$Root) {
  $taskRoot = (Resolve-Path $Root).Path.TrimEnd('\','/')
  $taskMissing = @(); $taskDifferent = @(); $taskNames = @{}
  foreach ($taskFile in $taskFiles) {
    $taskNames[$taskFile.path] = $true
    $taskPath = Join-Path $taskRoot $taskFile.path
    if (-not (Test-Path $taskPath -PathType Leaf)) { $taskMissing += $taskFile.path; continue }
    if ((Get-Item $taskPath).Length -ne $taskFile.bytes -or (Get-FileHash $taskPath -Algorithm SHA256).Hash.ToLowerInvariant() -ne $taskFile.sha256) { $taskDifferent += $taskFile.path }
  }
  $taskExtra = @()
  foreach ($taskPath in (Get-ChildItem $taskRoot -Recurse -File)) {
    $taskRelative = $taskPath.FullName.Substring($taskRoot.Length + 1).Replace('\','/')
    if ($taskRelative.StartsWith('node_modules/')) { continue }
    if (-not $taskNames.ContainsKey($taskRelative)) { $taskExtra += $taskRelative }
  }
  $taskVersion = (Get-Content (Join-Path $taskRoot 'package.json') -Raw | ConvertFrom-Json).version
  $taskResult = [PSCustomObject]@{ path=$taskRoot; version=$taskVersion; expected=$taskFiles.Count; matched=($taskFiles.Count-$taskMissing.Count-$taskDifferent.Count); missing=$taskMissing; different=$taskDifferent; extra=$taskExtra }
  $taskResult | ConvertTo-Json -Depth 5
  if ($taskVersion -ne $taskManifest.version -or $taskMissing.Count -or $taskDifferent.Count -or $taskExtra.Count) { throw 'Package verification failed' }
}

[PSCustomObject]@{ sourceCommit=$taskManifest.sourceCommit; ciRun=$taskManifest.ciRun; version=$taskManifest.version; tarball=$taskTarball; sha256=$taskActualSha; bytes=(Get-Item $taskTarball).Length; extraction=$taskExtraction } | ConvertTo-Json
Test-PackageFiles (Join-Path $taskExtraction 'package')
if ($InstalledPackagePath) { Test-PackageFiles $InstalledPackagePath }
exit 0
