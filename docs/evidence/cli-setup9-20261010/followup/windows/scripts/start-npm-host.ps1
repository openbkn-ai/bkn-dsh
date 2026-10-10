param([string]$Root='C:\bkn-verify\cli9f\npm',[Parameter(Mandatory=$true)][string]$Label,[string]$PathMode='missing',[string]$FixtureDir,[string]$Prefix,[int]$Port=18607)
$ErrorActionPreference='Stop'
. (Join-Path $PSScriptRoot 'env-npm.ps1') -Root $Root -Prefix $Prefix -PathMode $PathMode -FixtureDir $FixtureDir
$ev='C:\bkn-verify\cli9f\evidence'; $private=Join-Path $Root 'private'
if(Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue){ throw "port $Port busy" }
$node='C:\Users\kalia\scoop\apps\nodejs-lts\current\node.exe'; $bin='C:\bkn-verify\diag6-tools\node_modules\@deepseek-ai\dsh\lib\bin.js'
$argv="`"$bin`" web --port $Port --no-open"
$p=Start-Process -FilePath $node -ArgumentList $argv -WorkingDirectory $private -WindowStyle Hidden -RedirectStandardOutput (Join-Path $private "$Label.log") -RedirectStandardError (Join-Path $private "$Label.err.log") -PassThru
for($i=0;$i -lt 40;$i++){ Start-Sleep 1; $l=Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue | Select -First 1; if($l){break} }
if(-not $l){ throw "no listener on $Port" }
$proc=Get-CimInstance Win32_Process -Filter "ProcessId=$($p.Id)"
$o=[ordered]@{label=$Label; form='npm'; pid=$p.Id; createdUtc=([datetimeoffset]$proc.CreationDate).ToUniversalTime().ToString('o'); exe=$proc.ExecutablePath; argv="$node $argv"; listenerOwner=$l.OwningProcess
 listeners=@([ordered]@{address=$l.LocalAddress; port=$l.LocalPort; owner=$l.OwningProcess}); PATH=$env:Path; DSH_HOME=$env:DSH_HOME; BKN_CONFIG_DIR=$env:BKN_CONFIG_DIR; npm_config_prefix=$env:npm_config_prefix; npm_config_cache=$env:npm_config_cache; APPDATA=$env:APPDATA; PathMode=$PathMode; FixtureDir=$FixtureDir}
[IO.File]::WriteAllText((Join-Path $ev "$Label-host.json"),($o|ConvertTo-Json -Depth 4),(New-Object Text.UTF8Encoding($false)))
"pid=$($p.Id) created=$($o.createdUtc) listener=$($l.LocalAddress):$($l.LocalPort) owner=$($l.OwningProcess)"
