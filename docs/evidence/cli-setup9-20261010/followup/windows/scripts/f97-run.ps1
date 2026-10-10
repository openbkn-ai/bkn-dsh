# F97: run the canonical stop-owned-host.ps1 (from the handoff checkout) in an independent child PowerShell on a given record;
# capture outer full stream + independent exit code, plus process/listener snapshots before and after.
param([Parameter(Mandatory=$true)][string]$Record,[Parameter(Mandatory=$true)][string]$Tag,[Parameter(Mandatory=$true)][int]$HostPid)
$ev='C:\bkn-verify\cli9f\evidence\f97'; New-Item -ItemType Directory -Force $ev | Out-Null
$canon='C:\bkn-verify\cli9-followup-results-wt\docs\handoff\2026-10-10-cli-setup9\stop-owned-host.ps1'
function Snap($label){ $p=Get-CimInstance Win32_Process -Filter "ProcessId=$HostPid"; $l=@(Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | ? { $_.OwningProcess -eq $HostPid -or $_.LocalPort -in 18607,19387 } | % { "$($_.LocalAddress):$($_.LocalPort)/$($_.OwningProcess)" })
  "$((Get-Date).ToUniversalTime().ToString('o')) $label hostAlive=$([bool]$p) listeners=$($l -join ',')" }
$snap=@(Snap 'before')
& powershell -NoProfile -ExecutionPolicy Bypass -File $canon -HostJson $Record -Log (Join-Path $ev "$Tag-internal-log.txt") *> (Join-Path $ev "$Tag-outer.txt")
$rc=$LASTEXITCODE; $rc | Set-Content (Join-Path $ev "$Tag-exit.txt")
$snap+=Snap 'after'
[IO.File]::WriteAllLines((Join-Path $ev "$Tag-proc-snap.txt"),$snap)
"tag=$Tag exit=$rc"; $snap
