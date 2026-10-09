param([Parameter(Mandatory=$true)][string]$Root,[Parameter(Mandatory=$true)][string]$Label,[switch]$NoCA)
$ErrorActionPreference='Stop'
$ev='C:\bkn-verify\first-use8-evidence'
$pem='C:\bkn-verify\unified7-c91fe09-authentication-recovery\windows-kit\certificates\openbkn-dev-ca.pem'
$env:DSH_HOME=Join-Path $Root 'dsh-home'; $env:BKN_CONFIG_DIR=Join-Path $Root 'bkn-config'
if(-not $NoCA){ $env:NODE_EXTRA_CA_CERTS=$pem } else { Remove-Item Env:NODE_EXTRA_CA_CERTS -ErrorAction SilentlyContinue }
$exe='C:\Users\kalia\AppData\Local\Programs\DeepSeek Harness\DeepSeek Harness.exe'
$p=Start-Process -FilePath $exe -PassThru
Start-Sleep 15
$proc=Get-CimInstance Win32_Process -Filter "ProcessId=$($p.Id)"; if(-not $proc){ throw 'host exited' }
$ticks=([datetimeoffset]$proc.CreationDate).UtcTicks
[IO.File]::WriteAllText((Join-Path $ev "$Label-host.pid"),"$($p.Id):$ticks")
$kids=@(Get-CimInstance Win32_Process -Filter "ParentProcessId=$($p.Id)")
$lines=@("label=$Label pid=$($p.Id) ticks=$ticks created=$($proc.CreationDate)","exe=$($proc.ExecutablePath)","DSH_HOME=$env:DSH_HOME","BKN_CONFIG_DIR=$env:BKN_CONFIG_DIR","NODE_EXTRA_CA_CERTS=$env:NODE_EXTRA_CA_CERTS")
foreach($k in $kids){ $lines+="  child pid=$($k.ProcessId) name=$($k.Name)" }
$lines | Tee-Object -FilePath (Join-Path $ev "$Label-host.txt")
