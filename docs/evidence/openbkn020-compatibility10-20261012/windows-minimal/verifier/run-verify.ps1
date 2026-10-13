# Native verifier run in an independent PowerShell child: node verify-candidate.mjs, full stream to file, exit code saved separately.
param([Parameter(Mandatory=$true)][string]$Out,[string]$Installed='')
$env:Path=[Environment]::GetEnvironmentVariable('Path','Machine')+';'+[Environment]::GetEnvironmentVariable('Path','User')
$taskKit='C:\bkn-verify\compat10-wt\docs\handoff\2026-10-12-compatibility10-minimal-windows'
$taskTgz='C:\bkn-verify\compat10-minimal\candidate\openbkn-dsh-business-context-0.2.0-rc.2-openbkn.0.2.0-10.tgz'
$a=@((Join-Path $taskKit 'verify-candidate.mjs'),'--tarball',$taskTgz)
if($Installed){ $a+=@('--installed',$Installed) }
& node @a > $Out 2>&1
$rc=$LASTEXITCODE; $rc | Set-Content ($Out -replace '\.txt$','-exit.txt')
"exit=$rc node=$(node --version)"
