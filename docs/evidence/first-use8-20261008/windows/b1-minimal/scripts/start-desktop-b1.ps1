# B1 minimal reproduction: launch the real DeepSeek Harness Desktop against the isolated desktop root
# and record full identity (pid, UTC creation, exe, profile, process tree, listeners). Read-only otherwise.
param([Parameter(Mandatory=$true)][string]$Label)
$ErrorActionPreference='Stop'
$ev='C:\bkn-verify\first-use8-b1-evidence'
$root='C:\bkn-verify\first-use8-desktop'
$pem='C:\bkn-verify\unified7-c91fe09-authentication-recovery\windows-kit\certificates\openbkn-dev-ca.pem'
if((Get-FileHash $pem -Algorithm SHA256).Hash.ToLowerInvariant() -ne '89e53b4e7a09305c01c37513a9bdda63698735a33a0df71f725875ec47180453'){ throw 'CA pem hash differs' }
if(Get-Process 'DeepSeek Harness' -ErrorAction SilentlyContinue){ throw 'another DeepSeek Harness instance is running' }
$env:DSH_HOME=Join-Path $root 'dsh-home'; $env:BKN_CONFIG_DIR=Join-Path $root 'bkn-config'; $env:NODE_EXTRA_CA_CERTS=$pem
$exe='C:\Users\kalia\AppData\Local\Programs\DeepSeek Harness\DeepSeek Harness.exe'
$p=Start-Process -FilePath $exe -PassThru
Start-Sleep -Seconds 15
$proc=Get-CimInstance Win32_Process -Filter "ProcessId=$($p.Id)"; if(-not $proc){ throw 'host exited' }
$utc=([datetimeoffset]$proc.CreationDate).ToUniversalTime()
[IO.File]::WriteAllText((Join-Path $ev "$Label-host.pid"),"$($p.Id):$($utc.UtcTicks)")
$all=Get-CimInstance Win32_Process; $ids=@($p.Id); $tree=@()
do { $k=@($all | ? { $ids -contains $_.ParentProcessId -and -not ($ids -contains $_.ProcessId) }); $tree+=$k; $ids+=$k.ProcessId } while($k.Count)
$listen=@(Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | ? { $ids -contains $_.OwningProcess })
$o=[ordered]@{label=$Label; pid=$p.Id; createdUtc=$utc.ToString('o'); exe=$proc.ExecutablePath; fileVersion=(Get-Item $exe).VersionInfo.ProductVersion
  DSH_HOME=$env:DSH_HOME; BKN_CONFIG_DIR=$env:BKN_CONFIG_DIR; NODE_EXTRA_CA_CERTS=$pem; profile='desktop'
  children=@($tree | % { [ordered]@{pid=$_.ProcessId; ppid=$_.ParentProcessId; name=$_.Name; createdUtc=([datetimeoffset]$_.CreationDate).ToUniversalTime().ToString('o'); type=(([regex]::Match([string]$_.CommandLine,'--type=([\w-]+)')).Groups[1].Value)} })
  listeners=@($listen | % { [ordered]@{address=$_.LocalAddress; port=$_.LocalPort; owner=$_.OwningProcess} })}
$json=$o | ConvertTo-Json -Depth 5
[IO.File]::WriteAllText((Join-Path $ev "$Label-host.json"),$json,(New-Object Text.UTF8Encoding($false)))
$json
