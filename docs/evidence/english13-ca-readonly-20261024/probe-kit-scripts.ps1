$ErrorActionPreference = 'Stop'
# 只读核对 kit 三脚本与 cliPath shim：路径、哈希、是否设置/清除 NODE_EXTRA_CA_CERTS、是否 -NoProfile、Node/CLI 入口
$files = @(
  'C:\bkn-verify\english13-kit\windows-english13-copy-v1\Start-PrivateWebConsole.ps1',
  'C:\bkn-verify\english13-kit\windows-english13-copy-v1\Start-Host.ps1',
  'C:\bkn-verify\english13-kit\windows-english13-copy-v1\common.ps1'
)
foreach ($f in $files) {
  $hash = (Get-FileHash $f -Algorithm SHA256).Hash.ToLower()
  $text = Get-Content $f -Raw
  $setsVar = [bool]($text -match 'NODE_EXTRA_CA_CERTS')
  $noProfile = [bool]($text -match '-NoProfile')
  Write-Output ("{0}`n  sha256={1}`n  mentions NODE_EXTRA_CA_CERTS={2}  noProfile={3}" -f $f, $hash, $setsVar, $noProfile)
  if ($setsVar) {
    $lines = ($text -split "`n" | Select-String 'NODE_EXTRA_CA_CERTS' | ForEach-Object { $_.Line.Trim() })
    foreach ($l in $lines) { Write-Output ("  line: " + $l) }
  }
}
