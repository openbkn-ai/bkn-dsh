# V3-V5 native boundary probe exactly per handoff (process-scoped env), full stream private, exit code saved.
$taskRoot='C:\bkn-verify\compat10-minimal'; $taskKit='C:\bkn-verify\compat10-wt\docs\handoff\2026-10-12-compatibility10-minimal-windows'
$env:Path=[Environment]::GetEnvironmentVariable('Path','Machine')+';'+[Environment]::GetEnvironmentVariable('Path','User')
foreach($v in 'BKN_TOKEN','BKN_BASE_URL','BKN_USER'){ Remove-Item "Env:$v" -ErrorAction SilentlyContinue }
$taskRuntime='C:\bkn-verify\diag6-tools'
$taskProbe=Join-Path $taskRoot 'probe'
$env:DSH_HOME=Join-Path $taskProbe 'dsh-home'; $env:BKN_CONFIG_DIR=Join-Path $taskProbe 'bkn-config'
$env:NODE_EXTRA_CA_CERTS=Join-Path $taskKit 'openbkn-dev-ca.pem'
$taskCli=Join-Path $taskRoot 'sdk\node_modules\.bin\openbkn.cmd'
$taskTgz=Join-Path $taskRoot 'candidate\openbkn-dsh-business-context-0.2.0-rc.2-openbkn.0.2.0-10.tgz'
$taskUnpack=Join-Path $taskProbe 'candidate'
New-Item -ItemType Directory -Force $taskUnpack | Out-Null
tar -xf $taskTgz -C $taskUnpack
if ($LASTEXITCODE -ne 0) { throw 'Candidate extraction failed' }
$taskPackage=Join-Path $taskUnpack 'package'
if(-not (Test-Path (Join-Path $taskPackage 'node_modules'))){ New-Item -ItemType Junction -Path (Join-Path $taskPackage 'node_modules') -Target (Join-Path $taskRuntime 'node_modules') | Out-Null }
$meta=Join-Path $taskProbe 'probe-meta.txt'
"start=$((Get-Date).ToUniversalTime().ToString('o')) node=$(node --version) tar=$((Get-Command tar).Source) runtime=$taskRuntime dshVersion=$((Get-Content -Raw (Join-Path $taskRuntime 'node_modules\@deepseek-ai\dsh\package.json') | ConvertFrom-Json).version)" | Set-Content $meta
"argv=node $taskKit\minimal-native.probe.mjs --runtime $taskRuntime --plugin $taskPackage --cli $taskCli --live https://192.168.50.28 --kn supply_ontology_hand" | Add-Content $meta
node (Join-Path $taskKit 'minimal-native.probe.mjs') --runtime $taskRuntime --plugin $taskPackage --cli $taskCli --live https://192.168.50.28 --kn supply_ontology_hand > (Join-Path $taskProbe 'native-private.txt') 2>&1
$taskProbeExit=$LASTEXITCODE
"end=$((Get-Date).ToUniversalTime().ToString('o')) exit=$taskProbeExit" | Add-Content $meta
"exit=$taskProbeExit"
