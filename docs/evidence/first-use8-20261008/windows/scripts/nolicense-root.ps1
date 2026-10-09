# Exploratory (out-of--8-scope) no-license round on 192.168.50.129: fresh npm/web root, fixed tgz, 015 CA.
$ErrorActionPreference='Stop'
$ev='C:\bkn-verify\first-use8-evidence\nolicense-129'; New-Item -ItemType Directory -Force $ev | Out-Null
$root='C:\bkn-verify\first-use8-nolicense-npm'; if(Test-Path $root){ throw "root exists" }
New-Item -ItemType Directory -Force (Join-Path $root 'dsh-home'),(Join-Path $root 'private') | Out-Null
$env:DSH_HOME=Join-Path $root 'dsh-home'; $env:BKN_CONFIG_DIR=Join-Path $root 'bkn-config'
$env:NODE_EXTRA_CA_CERTS='C:\bkn-verify\platform-129\openbkn-test-015-ca.crt'
$cli='C:\bkn-verify\diag6-tools\node_modules\.bin\dsh.cmd'
$tgz='C:\bkn-verify\first-use8-download\openbkn-dsh-business-context-0.2.0-rc.2-openbkn.0.2.0-8.tgz'
if((Get-FileHash $tgz -Algorithm SHA256).Hash.ToLowerInvariant() -ne '6a946030a6152d2899609fac95c66cd246e36cca5a8ce4e5f87ed379cbe706ea'){ throw 'tgz sha' }
$inst=& powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "& '$cli' plugin --profile web install '$tgz' *>&1; exit `$LASTEXITCODE"
$code=$LASTEXITCODE; ($inst | Out-String) | Set-Content (Join-Path $ev 'install.txt'); "install exit=$code"
if($code -ne 0){ throw 'install failed' }
$port=18537; $private=Join-Path $root 'private'
Start-Process -FilePath cmd.exe -ArgumentList "/c $cli web --port $port --no-open >web.log 2>web.err.log" -WorkingDirectory $private -WindowStyle Hidden
for($i=0;$i -lt 30;$i++){ Start-Sleep 1; $l=Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue | Select -First 1 -ExpandProperty OwningProcess; if($l){break} }
if(-not $l){ throw 'no listener' }
$p=Get-CimInstance Win32_Process -Filter "ProcessId=$l"; $t=([datetimeoffset]$p.CreationDate).UtcTicks
[IO.File]::WriteAllText((Join-Path $ev 'host.pid'),"$l`:$t")
"host pid=$l port=$port CA=$env:NODE_EXTRA_CA_CERTS"
