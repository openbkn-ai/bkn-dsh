# Independent device login for the probe store only (process-scoped env); output stays private.
$taskRoot='C:\bkn-verify\compat10-minimal'; $taskKit='C:\bkn-verify\compat10-wt\docs\handoff\2026-10-12-compatibility10-minimal-windows'
$env:Path=[Environment]::GetEnvironmentVariable('Path','Machine')+';'+[Environment]::GetEnvironmentVariable('Path','User')
foreach($v in 'BKN_TOKEN','BKN_BASE_URL','BKN_USER'){ Remove-Item "Env:$v" -ErrorAction SilentlyContinue }
$p=Join-Path $taskRoot 'probe'
$env:DSH_HOME=Join-Path $p 'dsh-home'; $env:BKN_CONFIG_DIR=Join-Path $p 'bkn-config'
$env:NODE_EXTRA_CA_CERTS=Join-Path $taskKit 'openbkn-dev-ca.pem'
New-Item -ItemType Directory -Force $env:DSH_HOME,$env:BKN_CONFIG_DIR | Out-Null
$taskCli=Join-Path $taskRoot 'sdk\node_modules\.bin\openbkn.cmd'
"start $((Get-Date).ToUniversalTime().ToString('o'))" | Set-Content (Join-Path $p 'private\login-meta.txt')
& $taskCli auth login https://192.168.50.28 --device *> (Join-Path $p 'private\login-private.txt')
$rc=$LASTEXITCODE
"end $((Get-Date).ToUniversalTime().ToString('o')) exit=$rc" | Add-Content (Join-Path $p 'private\login-meta.txt')
