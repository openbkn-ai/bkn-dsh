param([Parameter(Mandatory=$true)][ValidateSet('npm','source')][string]$Form,[Parameter(Mandatory=$true)][string]$Label,[string]$FixtureRoot,[switch]$NoCA)
$ErrorActionPreference='Stop'
$ev='C:\bkn-verify\first-use8-evidence'; $root="C:\bkn-verify\first-use8-$Form"; $port= if($Form -eq 'npm'){18507}else{18408}
$env:DSH_HOME=Join-Path $root 'dsh-home'; $env:BKN_CONFIG_DIR=Join-Path $root 'bkn-config'
if($NoCA){ Remove-Item Env:NODE_EXTRA_CA_CERTS -ErrorAction SilentlyContinue } else { $env:NODE_EXTRA_CA_CERTS='C:\bkn-verify\unified7-c91fe09-authentication-recovery\windows-kit\certificates\openbkn-dev-ca.pem' }
if($FixtureRoot){ $env:BKN_AUTH_FIXTURE_CLI_ENTRY='C:\bkn-verify\diag6-tools\node_modules\@openbkn\bkn-sdk\dist\cli.js'; $env:BKN_AUTH_FIXTURE_ROOT=$FixtureRoot }
$private=Join-Path $root 'private'; New-Item -ItemType Directory -Force $private | Out-Null
$log="$Label-web.log"; $err="$Label-web.err.log"
if($Form -eq 'npm'){ $cmd="C:\bkn-verify\diag6-tools\node_modules\.bin\dsh.cmd web --port $port --no-open" } else { $cmd="node.exe D:\AI\project\app\openBKN\dsh-src\apps\cli\lib\bin.js web --port $port --no-open" }
Start-Process -FilePath cmd.exe -ArgumentList "/c $cmd >$log 2>$err" -WorkingDirectory $private -WindowStyle Hidden
for($i=0;$i -lt 30;$i++){ Start-Sleep 1; $l=Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue | Select -First 1 -ExpandProperty OwningProcess; if($l){break} }
if(-not $l){ throw "no listener on $port" }
$proc=Get-CimInstance Win32_Process -Filter "ProcessId=$l"; $ticks=([datetimeoffset]$proc.CreationDate).UtcTicks
[IO.File]::WriteAllText((Join-Path $ev "$Label-host.pid"),"$l`:$ticks")
@("label=$Label form=$Form pid=$l ppid=$($proc.ParentProcessId) ticks=$ticks created=$($proc.CreationDate) port=$port","exe=$($proc.ExecutablePath)","DSH_HOME=$env:DSH_HOME","BKN_CONFIG_DIR=$env:BKN_CONFIG_DIR","NODE_EXTRA_CA_CERTS=$env:NODE_EXTRA_CA_CERTS","BKN_AUTH_FIXTURE_ROOT=$env:BKN_AUTH_FIXTURE_ROOT","log=$private\$log") | Tee-Object -FilePath (Join-Path $ev "$Label-host.txt")
