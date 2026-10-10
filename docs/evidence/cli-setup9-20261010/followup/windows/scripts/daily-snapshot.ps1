# cli-setup-9: daily-state snapshot (paths + SHA / value digests only; read-only).
param([Parameter(Mandatory=$true)][string]$Label)
$ErrorActionPreference='Stop'
$ev='C:\bkn-verify\cli9f\evidence'
$paths=@((Get-Content -Raw 'C:\bkn-verify\first-use8-evidence\user-state-before.json' | ConvertFrom-Json).records | % path)
$bin='C:\Users\kalia\scoop\apps\nodejs-lts\current\bin'
$paths+=@(Join-Path $bin 'openbkn.cmd'), (Join-Path $bin 'openbkn'), (Join-Path $bin 'openbkn.ps1')
$sdk=Join-Path $bin 'node_modules\@openbkn\bkn-sdk'
if(Test-Path $sdk){ $paths+=@(Get-ChildItem $sdk -Recurse -File | % FullName) }
$rows=foreach($p in ($paths | Select-Object -Unique)){ $e=Test-Path -LiteralPath $p; [ordered]@{path=$p; exists=$e; sha256= if($e){(Get-FileHash -LiteralPath $p -Algorithm SHA256).Hash}else{$null}} }
$sha={ param($s) if($s -eq $null){$null}else{ [BitConverter]::ToString([Security.Cryptography.SHA256]::Create().ComputeHash([Text.Encoding]::UTF8.GetBytes($s))).Replace('-','') } }
$apn=Join-Path $env:APPDATA 'npm'
$o=[ordered]@{label=$Label; stampUtc=(Get-Date).ToUniversalTime().ToString('o'); uniquePaths=$rows.Count; existing=@($rows|?{$_.exists}).Count
  userPathSha256=(& $sha ([Environment]::GetEnvironmentVariable('Path','User'))); machinePathSha256=(& $sha ([Environment]::GetEnvironmentVariable('Path','Machine')))
  userEnvVarNamesSha256=(& $sha (((Get-Item 'HKCU:\Environment').Property | Sort-Object) -join ';'))
  appdataNpmListing=@(if(Test-Path $apn){ Get-ChildItem $apn | % Name } )
  dailySdkVersion=$(if(Test-Path (Join-Path $sdk 'package.json')){ (Get-Content -Raw (Join-Path $sdk 'package.json') | ConvertFrom-Json).version } else { $null })
  records=$rows}
[IO.File]::WriteAllText((Join-Path $ev "daily-$Label.json"),($o|ConvertTo-Json -Depth 4),(New-Object Text.UTF8Encoding($false)))
'unique={0} existing={1} dailySdk={2} appdataNpm=[{3}]' -f $o.uniquePaths,$o.existing,$o.dailySdkVersion,($o.appdataNpmListing -join ',')
