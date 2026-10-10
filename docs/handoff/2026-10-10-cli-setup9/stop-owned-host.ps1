# Stop only a fully matched owned Host tree; retain the record and native output.
param([Parameter(Mandatory=$true)][string]$HostJson,[Parameter(Mandatory=$true)][string]$Log)
$ErrorActionPreference='Stop'
$rec=Get-Content -Raw $HostJson | ConvertFrom-Json
$lines=New-Object System.Collections.Generic.List[string]
function L($m){ $lines.Add("$((Get-Date).ToUniversalTime().ToString('o')) $m"); Write-Host $m }
$p=Get-CimInstance Win32_Process -Filter "ProcessId=$($rec.pid)"
if(-not $p){ L "host $($rec.pid) not running"; [IO.File]::WriteAllLines($Log,$lines); exit 0 }
$created=([datetimeoffset]$p.CreationDate).ToUniversalTime()
$okPid=($p.ProcessId -eq $rec.pid); $okTime=[math]::Abs(($created - [datetimeoffset]$rec.createdUtc).TotalSeconds) -lt 1
$okExe=($p.ExecutablePath -eq $rec.exe)
$all=Get-CimInstance Win32_Process; $ids=@($p.ProcessId); $tree=@($p)
do { $k=@($all | ? { $ids -contains $_.ParentProcessId -and -not ($ids -contains $_.ProcessId) }); $tree+=$k; $ids+=$k.ProcessId } while($k.Count)
$listen=@(Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | ? { $ids -contains $_.OwningProcess })
$recPorts=@($rec.listeners | % { $_.port }); $nowPorts=@($listen | % { $_.LocalPort })
$okListen=($recPorts.Count -gt 0 -and @($recPorts | ? { $nowPorts -notcontains $_ }).Count -eq 0)
L "identity pid=$($p.ProcessId) createdUtc=$($created.ToString('o')) [match=$okTime] exe=$($p.ExecutablePath) [match=$okExe] recordedPorts=$($recPorts -join ',') currentPorts=$($nowPorts -join ',') [recordedStillOwned=$okListen]"
foreach($t in $tree){ L "  tree pid=$($t.ProcessId) ppid=$($t.ParentProcessId) name=$($t.Name) createdUtc=$(([datetimeoffset]$t.CreationDate).ToUniversalTime().ToString('o'))" }
if(-not ($okPid -and $okTime -and $okExe -and $okListen)){ L 'IDENTITY MISMATCH - refusing to stop'; [IO.File]::WriteAllLines($Log,$lines); throw 'identity mismatch' }
[array]::Reverse($tree); foreach($t in $tree){ Stop-Process -Id $t.ProcessId -Force -ErrorAction SilentlyContinue }
Start-Sleep 2
$left=@(Get-CimInstance Win32_Process | ? { $ids -contains $_.ProcessId })
$leftPorts=@(Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | ? { $recPorts -contains $_.LocalPort })
L "stopped; remainingTreeProcs=$($left.Count) recordedPortsStillListening=$($leftPorts.Count)"
[IO.File]::WriteAllLines($Log,$lines)
