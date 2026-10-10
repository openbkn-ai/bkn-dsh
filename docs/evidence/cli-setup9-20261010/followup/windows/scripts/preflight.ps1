param([string]$Root,[string]$Label,[string]$PathMode='missing')
. (Join-Path $PSScriptRoot 'env-npm.ps1') -Root $Root -PathMode $PathMode
$out=New-Object System.Collections.Generic.List[string]
$out.Add("label=$Label utc=$((Get-Date).ToUniversalTime().ToString('o')) PATH=$env:Path")
$out.Add("npm_config_prefix=$env:npm_config_prefix npm_config_cache=$env:npm_config_cache APPDATA=$env:APPDATA")
foreach($c in @(@('node','--version'),@('npm','--version'),@('npm','prefix','--global'),@('npm','config','get','registry'),@('where.exe','openbkn'),@('where.exe','npm'),@('where.exe','node'))){
  $o = & $c[0] $c[1..($c.Count-1)] 2>&1 | Out-String; $e=$LASTEXITCODE
  $out.Add("> $($c -join ' ')  exit=$e"); $out.Add(($o.TrimEnd() -replace '(//[^/@\s]*:)[^@\s]*@','$1<redacted>@'))
}
$out.Add("prefix contents: " + ((Get-ChildItem -Force -Recurse $env:npm_config_prefix -ErrorAction SilentlyContinue | % FullName) -join ', '))
$out -join "`n"
