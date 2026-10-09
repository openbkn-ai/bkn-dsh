param([string]$Form = 'desktop')
$ErrorActionPreference = 'Stop'
$Utf8 = New-Object Text.UTF8Encoding($false)
$ev = 'C:\bkn-verify\first-use8-evidence'
$mfPath = 'C:\bkn-verify\diag6-source\docs\evidence\first-use8-20261008\candidate-files.json'
$expected = @((Get-Content -Raw -LiteralPath $mfPath | ConvertFrom-Json).files)
$root = "C:\bkn-verify\first-use8-$Form"
$prof = if ($Form -eq 'desktop') { 'desktop' } else { 'web' }
$inst = Join-Path $root "dsh-home\profiles\$prof\node_modules\@openbkn\dsh-business-context"
$rootPath = (Resolve-Path -LiteralPath $inst).Path.TrimEnd('\')
$missing = @(); $diff = @(); $paths = @{}
foreach ($f in $expected) {
  if ($f.path -notmatch '^package/' -or $f.path -match '(^|/)\.\.(/|$)|\\') { throw 'Unexpected manifest path' }
  $rel = $f.path.Substring(8)
  if ($paths.ContainsKey($rel)) { throw 'Duplicate manifest path' }
  $paths[$rel] = $true
  $p = Join-Path $rootPath ($rel -replace '/', '\')
  if (-not (Test-Path -LiteralPath $p -PathType Leaf)) { $missing += $rel; continue }
  if ((Get-Item -LiteralPath $p).Length -ne $f.sizeBytes -or (Get-FileHash -LiteralPath $p -Algorithm SHA256).Hash.ToLowerInvariant() -ne $f.sha256) { $diff += $rel }
}
$actual = @(Get-ChildItem -LiteralPath $rootPath -Recurse -File | ForEach-Object { $_.FullName.Substring($rootPath.Length + 1).Replace('\', '/') })
$extra = @($actual | Where-Object { -not $paths.ContainsKey($_) })
$pkg = Get-Content -Raw -LiteralPath (Join-Path $rootPath 'package.json') | ConvertFrom-Json
$res = [ordered]@{ installedPath = $rootPath; form = $Form; version = $pkg.version; expectedCount = $expected.Count; actualCount = $actual.Count; missing = $missing; differs = $diff; extra = $extra }
[IO.File]::WriteAllText((Join-Path $ev "fu8-verify66-$Form.json"), (ConvertTo-Json $res -Depth 4), $Utf8)
Write-Host ($res | ConvertTo-Json -Compress)
if ($pkg.name -ne '@openbkn/dsh-business-context' -or $pkg.version -ne '0.2.0-rc.2-openbkn.0.2.0-8' -or $missing.Count -or $diff.Count -or $extra.Count) { throw "verify66 failed for $Form" }
