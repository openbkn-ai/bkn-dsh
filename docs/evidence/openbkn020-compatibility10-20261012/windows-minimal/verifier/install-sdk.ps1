# Isolated SDK install from the fixed local source-build tgz (handoff step), plus --version; full streams + exit codes saved.
$env:Path=[Environment]::GetEnvironmentVariable('Path','Machine')+';'+[Environment]::GetEnvironmentVariable('Path','User')
$taskKit='C:\bkn-verify\compat10-wt\docs\handoff\2026-10-12-compatibility10-minimal-windows'
$taskRoot='C:\bkn-verify\compat10-minimal'
$ev=Join-Path $taskRoot 'evidence'
$env:npm_config_cache=Join-Path $taskRoot 'npm-cache'
"utc=$((Get-Date).ToUniversalTime().ToString('o')) npm=$(& npm.cmd --version) node=$(node --version) registry=$(& npm.cmd config get registry)" | Set-Content (Join-Path $ev 'sdk-install-env.txt')
& npm.cmd install --prefix (Join-Path $taskRoot 'sdk') --no-audit --no-fund (Join-Path $taskKit 'candidate\openbkn-bkn-sdk-0.2.0.tgz') *> (Join-Path $ev 'sdk-install.txt')
$rc=$LASTEXITCODE; $rc | Set-Content (Join-Path $ev 'sdk-install-exit.txt')
$taskCli=Join-Path $taskRoot 'sdk\node_modules\.bin\openbkn.cmd'
& $taskCli --version *> (Join-Path $ev 'sdk-version.txt')
$rc2=$LASTEXITCODE; $rc2 | Set-Content (Join-Path $ev 'sdk-version-exit.txt')
"install=$rc version=$rc2"
