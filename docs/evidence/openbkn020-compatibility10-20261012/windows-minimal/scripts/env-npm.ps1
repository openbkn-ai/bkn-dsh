# Isolated env for the cli9 npm-form Host and its preflight. Only this process tree is affected.
param([string]$Root='C:\bkn-verify\compat10-minimal\npm',[string]$Prefix,[ValidateSet('missing','prefix-on-path','no-npm','fixture')][string]$PathMode='missing',[string]$FixtureDir)
$nodeDir='C:\Users\kalia\scoop\apps\nodejs-lts\current'
$base=@('C:\Windows\system32','C:\Windows','C:\Windows\System32\Wbem','C:\Windows\System32\WindowsPowerShell\v1.0')
$p = switch($PathMode){ 'missing' { $base + $nodeDir } 'prefix-on-path' { $base + $nodeDir + (Join-Path $Root 'CLI Prefix') } 'no-npm' { $base } 'fixture' { @($FixtureDir) + $base + $nodeDir } }
$env:Path=($p -join ';')
$env:DSH_HOME=Join-Path $Root 'dsh-home'; $env:BKN_CONFIG_DIR=Join-Path $Root 'bkn-config'
$env:npm_config_prefix= if($Prefix){$Prefix}else{Join-Path $Root 'CLI Prefix'}; $env:npm_config_cache=Join-Path $Root 'npm-cache'
$env:APPDATA=Join-Path $Root 'AppData'; Remove-Item Env:PNPM_HOME -ErrorAction SilentlyContinue
$env:NODE_EXTRA_CA_CERTS='C:\bkn-verify\compat10-wt\docs\handoff\2026-10-12-compatibility10-minimal-windows\openbkn-dev-ca.pem'
foreach($v in "BKN_TOKEN","BKN_BASE_URL","BKN_USER"){ Remove-Item "Env:$v" -ErrorAction SilentlyContinue }
