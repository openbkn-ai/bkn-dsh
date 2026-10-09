# Independent npm-form (dsh.cmd web) fault root for an F7 bad-import variant. Root bootstrap "." untouched.
param([Parameter(Mandatory=$true)][ValidateSet('business','diagnostics')][string]$Variant,[int]$Port=18517)
$ErrorActionPreference='Stop'
$Utf8=New-Object Text.UTF8Encoding($false)
$ev='C:\bkn-verify\first-use8-evidence'
$root="C:\bkn-verify\first-use8-npm-f7-$Variant"
$log=Join-Path $ev "f7-badimport-npm-$Variant-setup.txt"
$out=New-Object System.Collections.Generic.List[string]
function Log($m){ $out.Add("$(Get-Date -Format o) $m"); Write-Host $m }
if(Test-Path $root){ throw "fault root exists: $root" }
$cli='C:\bkn-verify\diag6-tools\node_modules\.bin\dsh.cmd'
$tgz='C:\bkn-verify\first-use8-download\openbkn-dsh-business-context-0.2.0-rc.2-openbkn.0.2.0-8.tgz'
$tgzSha=(Get-FileHash $tgz -Algorithm SHA256).Hash.ToLowerInvariant()
if($tgzSha -ne '6a946030a6152d2899609fac95c66cd246e36cca5a8ce4e5f87ed379cbe706ea'){ throw "tgz sha differs: $tgzSha" }
New-Item -ItemType Directory -Force (Join-Path $root 'dsh-home'),(Join-Path $root 'private') | Out-Null
$env:DSH_HOME=Join-Path $root 'dsh-home'; $env:BKN_CONFIG_DIR=Join-Path $root 'bkn-config'
$env:NODE_EXTRA_CA_CERTS='C:\bkn-verify\unified7-c91fe09-authentication-recovery\windows-kit\certificates\openbkn-dev-ca.pem'
Log "variant=$Variant root=$root tgz=$tgzSha cli=$cli"
$inst=& powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "& '$cli' plugin --profile web install '$tgz' *>&1; exit `$LASTEXITCODE"
$code=$LASTEXITCODE; Log "install exit=$code"; $inst | % { $out.Add("  | $_") }
if($code -ne 0){ [IO.File]::WriteAllLines($log,$out,$Utf8); throw 'install failed' }
$pkgDir=Join-Path $env:DSH_HOME 'profiles\web\node_modules\@openbkn\dsh-business-context'
$pkgJson=Join-Path $pkgDir 'package.json'
$base=(Get-FileHash $pkgJson -Algorithm SHA256).Hash.ToLowerInvariant()
Log "installed dir=$pkgDir linkType=$((Get-Item $pkgDir).LinkType) package.json base sha=$base"
[IO.File]::Copy($pkgJson,(Join-Path $ev "f7-badimport-npm-$Variant-package.base.json"),$true)
$text=[IO.File]::ReadAllText($pkgJson)
$from= if($Variant -eq 'business'){'"default": "./lib/business.js"'}else{'"default": "./lib/diagnostics.js"'}
$to=   if($Variant -eq 'business'){'"default": "./lib/business.fu8-missing.js"'}else{'"default": "./lib/diagnostics.fu8-missing.js"'}
if(([regex]::Matches($text,[regex]::Escape($from))).Count -ne 1){ throw "expected exactly one $from" }
[IO.File]::WriteAllText($pkgJson,$text.Replace($from,$to),$Utf8)
Log "variant edit: $from -> $to ; variant sha=$((Get-FileHash $pkgJson -Algorithm SHA256).Hash.ToLowerInvariant())"
$private=Join-Path $root 'private'
Start-Process -FilePath cmd.exe -ArgumentList "/c $cli web --port $Port --no-open >web.log 2>web.err.log" -WorkingDirectory $private -WindowStyle Hidden
for($i=0;$i -lt 30;$i++){ Start-Sleep 1; $l=Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue | Select -First 1 -ExpandProperty OwningProcess; if($l){break} }
if(-not $l){ [IO.File]::WriteAllLines($log,$out,$Utf8); throw "no listener on $Port" }
$proc=Get-CimInstance Win32_Process -Filter "ProcessId=$l"; $ticks=([datetimeoffset]$proc.CreationDate).UtcTicks
[IO.File]::WriteAllText((Join-Path $ev "f7-badimport-npm-$Variant-host.pid"),"$l`:$ticks")
Log "fault host pid=$l port=$Port ticks=$ticks"
[IO.File]::WriteAllLines($log,$out,$Utf8)
