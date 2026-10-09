param([Parameter(Mandatory=$true)][string]$PidFile,[Parameter(Mandatory=$true)][string]$Log)
$ErrorActionPreference='Stop'
$raw=(Get-Content -Raw -LiteralPath $PidFile).Trim(); $hostPid=[int]($raw.Split(':')[0]); $ticks=[long]($raw.Split(':')[1])
$all=Get-CimInstance Win32_Process
$h=$all | ? { $_.ProcessId -eq $hostPid }
if(-not $h){ "host $hostPid not running" | Tee-Object -FilePath $Log; exit 0 }
$actual=([datetimeoffset]$h.CreationDate).UtcTicks
if([math]::Abs($actual-$ticks) -gt 10000000){ throw "identity mismatch pid=$hostPid name=$($h.Name) ticks=$actual expected=$ticks" }
$ids=@($hostPid); $tree=@($h)
do { $kids=@($all | ? { $ids -contains $_.ParentProcessId -and -not ($ids -contains $_.ProcessId) }); $tree+=$kids; $ids+=$kids.ProcessId } while($kids.Count)
$lines=@("stop $(Get-Date -Format o) host=$hostPid ticks ok exe=$($h.ExecutablePath)")
foreach($p in $tree){ $lines+="  pid=$($p.ProcessId) ppid=$($p.ParentProcessId) name=$($p.Name) created=$($p.CreationDate)" }
[array]::Reverse($tree); foreach($p in $tree){ Stop-Process -Id $p.ProcessId -Force -ErrorAction SilentlyContinue }
Start-Sleep 2
$left=@(Get-CimInstance Win32_Process | ? { $ids -contains $_.ProcessId })
$lines+="remaining=$($left.Count)"
$lines | Tee-Object -FilePath $Log
