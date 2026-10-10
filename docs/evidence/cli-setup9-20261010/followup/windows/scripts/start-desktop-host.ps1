# cli9 Desktop form: launch the official DeepSeek Harness.exe with an isolated env (env-npm.ps1, -Root desktop) and an
# isolated Electron --user-data-dir; record pid / UTC creation / exe / argv / tree listeners for the 4-item stop check.
param([Parameter(Mandatory=$true)][string]$Label,[string]$PathMode='missing',[string]$FixtureDir,[string]$Prefix,[switch]$WithPnpm)
$ErrorActionPreference='Stop'
$Root='C:\bkn-verify\cli9f\desktop'
. (Join-Path $PSScriptRoot 'env-npm.ps1') -Root $Root -Prefix $Prefix -PathMode $PathMode -FixtureDir $FixtureDir
if($WithPnpm){ $env:Path += ';C:\Users\kalia\scoop\apps\nodejs-lts\current\bin' }
$ev='C:\bkn-verify\cli9f\evidence'
$exe='C:\Users\kalia\AppData\Local\Programs\DeepSeek Harness\DeepSeek Harness.exe'
$ud=Join-Path $Root 'electron-user-data'
if(Get-Process | ? { $_.Path -eq $exe }){ throw 'a DeepSeek Harness.exe is already running' }
$argv="--user-data-dir=`"$ud`""
$p=Start-Process -FilePath $exe -ArgumentList $argv -PassThru
$l=@()
for($i=0;$i -lt 60;$i++){ Start-Sleep 1
  $all=Get-CimInstance Win32_Process; $ids=@($p.Id)
  do { $k=@($all | ? { $ids -contains $_.ParentProcessId -and -not ($ids -contains $_.ProcessId) }); $ids+=$k.ProcessId } while($k.Count)
  $l=@(Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | ? { $ids -contains $_.OwningProcess }); if($l.Count){ Start-Sleep 3; $l=@(Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | ? { $ids -contains $_.OwningProcess }); break } }
$proc=Get-CimInstance Win32_Process -Filter "ProcessId=$($p.Id)"
$o=[ordered]@{label=$Label; form='desktop'; pid=$p.Id; createdUtc=([datetimeoffset]$proc.CreationDate).ToUniversalTime().ToString('o'); exe=$proc.ExecutablePath; exeVersion=(Get-Item $exe).VersionInfo.FileVersion; argv="$exe $argv"
 listeners=@($l | % { [ordered]@{address=$_.LocalAddress; port=$_.LocalPort; owner=$_.OwningProcess} }); treePids=$ids
 PATH=$env:Path; DSH_HOME=$env:DSH_HOME; BKN_CONFIG_DIR=$env:BKN_CONFIG_DIR; npm_config_prefix=$env:npm_config_prefix; npm_config_cache=$env:npm_config_cache; APPDATA=$env:APPDATA; userDataDir=$ud; PathMode=$PathMode; FixtureDir=$FixtureDir; WithPnpm=[bool]$WithPnpm}
[IO.File]::WriteAllText((Join-Path $ev "$Label-host.json"),($o|ConvertTo-Json -Depth 4),(New-Object Text.UTF8Encoding($false)))
"pid=$($p.Id) created=$($o.createdUtc) listeners=$(($l | % { "$($_.LocalAddress):$($_.LocalPort)/$($_.OwningProcess)" }) -join ',')"
