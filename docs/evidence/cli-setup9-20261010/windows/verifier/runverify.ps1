param([string]$Script,[string]$Out,[string]$Extra='')
$env:Path=[Environment]::GetEnvironmentVariable('Path','Machine')+';'+[Environment]::GetEnvironmentVariable('Path','User')
Set-Location C:\bkn-verify\cli9-results-wt
$taskTgz='C:\bkn-verify\cli9-candidate\openbkn-dsh-business-context-0.2.0-rc.2-openbkn.0.2.0-9.tgz'
$a=@('-NoProfile','-ExecutionPolicy','Bypass','-File',$Script,'-Tarball',$taskTgz)
if($Extra){$a+=@('-InstalledPackagePath',$Extra)}
& powershell @a *> $Out
$LASTEXITCODE | Set-Content ($Out -replace '\.txt$','-exit.txt')
"exit=$LASTEXITCODE tar=$((Get-Command tar).Source)"
