param()
$ErrorActionPreference = 'Stop'
$Utf8 = New-Object Text.UTF8Encoding($false)
$ev = 'C:\bkn-verify\authentication-recovery-c91fe09-evidence'

# 1. current residual scan (post-N4/N5; host 7792 already exited)
$scan = [ordered]@{
  stamp = (Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
  note = 'post-N4/N5 scan; host 7792 (18269) was stopped by operator after N4/N5 with inline identity check (node.exe + diag6-tools cmdline + 18269 ownership) per session record; native stop output NOT archived -> historical stop recorded as insufficient-evidence'
  nodeProcs = @(Get-Process node -ErrorAction SilentlyContinue).Count
  dshApps = @(Get-Process 'DeepSeek Harness' -ErrorAction SilentlyContinue).Count
  ports = @(18267, 18268, 18269 | ForEach-Object { $p = $_; @(Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue) } | Measure-Object | Select-Object -ExpandProperty Count)
  userProfiles = @(Get-ChildItem "$env:USERPROFILE\.dsh\profiles" -Directory -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Name)
}
[IO.File]::WriteAllText((Join-Path $ev 'n45-post-residual-check.json'), (ConvertTo-Json $scan), $Utf8)
Write-Host ($scan | ConvertTo-Json -Compress)

# 2. re-take after hashes with same 37-path list; keep 16:04 original untouched
$before = Get-Content -Raw -LiteralPath (Join-Path $ev 'user-state-before.json') | ConvertFrom-Json
$after = @()
foreach ($r in $before.records) {
  if (Test-Path -LiteralPath $r.path -PathType Leaf) {
    $after += [ordered]@{ path = $r.path; sha256 = (Get-FileHash -LiteralPath $r.path -Algorithm SHA256).Hash; beforeSha = $r.sha256 }
  } else {
    $after += [ordered]@{ path = $r.path; sha256 = $null; missing = $true; beforeSha = $r.sha256 }
  }
}
$diff = @($after | Where-Object { $_.sha256 -ne $_.beforeSha })
$summary = [ordered]@{
  stamp = (Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
  note = 're-taken after N4/N5 supplementary round; original 16:04:08 n6-user-state-after.json retained unchanged as the pre-N4/N5 after'
  recordCount = $after.Count
  unchanged = $after.Count - $diff.Count
  changed = $diff.Count
  changedList = @($diff | ForEach-Object { $_.path })
}
[IO.File]::WriteAllText((Join-Path $ev 'n6-user-state-after-2.json'), (ConvertTo-Json $after -Depth 3), $Utf8)
[IO.File]::WriteAllText((Join-Path $ev 'n6-final-residual-check-2.json'), (ConvertTo-Json $summary), $Utf8)
Write-Host ($summary | ConvertTo-Json -Compress)
