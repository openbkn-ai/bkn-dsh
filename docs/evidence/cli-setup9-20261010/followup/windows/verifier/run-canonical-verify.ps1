# Runs the canonical handoff verifier from the native CRLF checkout in an independent child PowerShell; full stream + exit code saved separately.
param([string]$Out,[string]$Installed='')
$env:Path=[Environment]::GetEnvironmentVariable('Path','Machine')+';'+[Environment]::GetEnvironmentVariable('Path','User')
Set-Location C:\bkn-verify\cli9-followup-results-wt
$taskTgz='C:\bkn-verify\cli9-followup-candidate\openbkn-dsh-business-context-0.2.0-rc.2-openbkn.0.2.0-9.tgz'
$a=@('-NoProfile','-ExecutionPolicy','Bypass','-File','.\docs\handoff\2026-10-10-cli-setup9\verify-candidate.ps1','-Tarball',$taskTgz)
if($Installed){ $a+=@('-InstalledPackagePath',$Installed) }
& powershell @a *> $Out
$taskVerifyExit=$LASTEXITCODE
$taskVerifyExit | Set-Content ($Out -replace '\.txt$','-exit.txt')
"exit=$taskVerifyExit psv=$($PSVersionTable.PSVersion) tar=$((Get-Command tar).Source)"
