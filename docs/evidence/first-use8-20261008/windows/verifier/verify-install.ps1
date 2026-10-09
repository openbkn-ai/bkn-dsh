# Per-file verification of the installed candidate against the fixed manifest.
# Only reads; prints the three rows and writes a JSON record to the evidence dir.
param(
    [Parameter(Mandatory = $true)][string]$InstalledPath,
    [Parameter(Mandatory = $true)][string]$Form,
    [string]$Label = 'install'
)
$ErrorActionPreference = 'Stop'
$FirstUse8FilesPath = 'C:\bkn-verify\diag6-source\docs\evidence\first-use8-20261008\candidate-files.json'
$FirstUse8FilesSHA = '31298c18cc87ac7a44039f8311e51340a56a830ecbad9fd270bd5ecf275ad257'
if ((Get-FileHash -LiteralPath $FirstUse8FilesPath -Algorithm SHA256).Hash.ToLowerInvariant() -ne $FirstUse8FilesSHA) { throw 'File manifest identity differs' }
$FirstUse8RootPath = (Resolve-Path -LiteralPath $InstalledPath).Path.TrimEnd('\')
$FirstUse8Expected = @((Get-Content -Raw -LiteralPath $FirstUse8FilesPath | ConvertFrom-Json).files)
$FirstUse8Missing = @(); $FirstUse8Diff = @(); $FirstUse8Paths = @{}
foreach ($FirstUse8File in $FirstUse8Expected) {
    if ($FirstUse8File.path -notmatch '^package/' -or $FirstUse8File.path -match '(^|/)\.\.(/|$)|\\') { throw 'Unexpected manifest path' }
    $FirstUse8Relative = $FirstUse8File.path.Substring(8)
    if ($FirstUse8Paths.ContainsKey($FirstUse8Relative)) { throw 'Duplicate manifest path' }
    $FirstUse8Paths[$FirstUse8Relative] = $true
    $FirstUse8Path = Join-Path $FirstUse8RootPath $FirstUse8Relative
    if (-not (Test-Path -LiteralPath $FirstUse8Path -PathType Leaf)) { $FirstUse8Missing += $FirstUse8Relative; continue }
    if ((Get-Item -LiteralPath $FirstUse8Path).Length -ne $FirstUse8File.sizeBytes -or
        (Get-FileHash -LiteralPath $FirstUse8Path -Algorithm SHA256).Hash.ToLowerInvariant() -ne $FirstUse8File.sha256) { $FirstUse8Diff += $FirstUse8Relative }
}
$FirstUse8Actual = @(Get-ChildItem -LiteralPath $FirstUse8RootPath -Recurse -File | ForEach-Object { $_.FullName.Substring($FirstUse8RootPath.Length + 1).Replace('\', '/') })
$FirstUse8Extra = @($FirstUse8Actual | Where-Object { -not $FirstUse8Paths.ContainsKey($_) })
$FirstUse8Package = Get-Content -Raw -LiteralPath (Join-Path $FirstUse8RootPath 'package.json') | ConvertFrom-Json
$out = [ordered]@{ form = $Form; label = $Label; installedPath = $FirstUse8RootPath; version = $FirstUse8Package.version; expectedCount = $FirstUse8Expected.Count; actualCount = $FirstUse8Actual.Count; missing = $FirstUse8Missing; differs = $FirstUse8Diff; extra = $FirstUse8Extra } | ConvertTo-Json -Depth 4
$out | Set-Content -Encoding utf8 ("C:\bkn-verify\first-use8-evidence-20261008\{0}-{1}-{2}-install-verify.json" -f $Label, $Form, (Get-Date -Format 'HHmmss'))
$out
if ($FirstUse8Package.name -ne '@openbkn/dsh-business-context' -or $FirstUse8Package.version -ne '0.2.0-rc.2-openbkn.0.2.0-8' -or
    $FirstUse8Missing.Count -ne 0 -or $FirstUse8Diff.Count -ne 0 -or $FirstUse8Extra.Count -ne 0) { throw 'Installed candidate verification failed' }
Write-Host "INSTALL VERIFY OK ($Form / $Label)"
