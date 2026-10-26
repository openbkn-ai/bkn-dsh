# Start one isolated official npm Host. Does not install or change global config.
param(
 [Parameter(Mandatory=$true)][string]$Runtime,
 [Parameter(Mandatory=$true)][string]$DshHome,
 [Parameter(Mandatory=$true)][string]$CliConfig,
 [Parameter(Mandatory=$true)][ValidateSet('0.2.0-rc.2','0.2.1-rc.2')][string]$HostVersion,
 [Parameter(Mandatory=$true)][string]$Evidence,
 [Parameter(Mandatory=$true)][int]$Port,
 [switch]$ReadOnlyProtocol
)
$ErrorActionPreference='Stop'
$taskKit=Split-Path -Parent $MyInvocation.MyCommand.Path
if($Port -lt 1024 -or $Port -gt 65535){throw 'Choose a task port between 1024 and 65535'}
if(Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue){throw 'Port already in use; refusing to stop another process'}
$taskNode=(Get-Command node.exe -ErrorAction Stop).Source
if((& $taskNode --version) -ne 'v24.19.0'){throw 'This handoff uses Node 24.19.0'}
$taskBin=Join-Path $Runtime 'node_modules\@deepseek-ai\dsh\lib\bin.js'
if(-not(Test-Path $taskBin)){throw 'Official runtime bin is missing'}
& $taskNode (Join-Path $taskKit 'verify-kit.mjs') --runtime $Runtime --host $HostVersion --profile (Join-Path $DshHome 'profiles\web') --installed (Join-Path $DshHome 'profiles\web\node_modules\@openbkn\dsh-business-context')
if($LASTEXITCODE -ne 0){throw 'Runtime/candidate verification failed'}
if(Test-Path $Evidence){throw 'Use a new evidence directory; do not overwrite a previous run'}
New-Item -ItemType Directory $Evidence | Out-Null
New-Item -ItemType Directory -Force $DshHome,$CliConfig | Out-Null
$taskNames=@('DSH_HOME','BKN_CONFIG_DIR','NODE_EXTRA_CA_CERTS','BKN_TOKEN','BKN_BASE_URL','BKN_USER','BKN_PROFILE','BKN_B1_LOCAL_PROTOCOL_KEY')
$taskBefore=@{}
foreach($taskName in $taskNames){$taskBefore[$taskName]=[Environment]::GetEnvironmentVariable($taskName,'Process')}
try{
 $env:DSH_HOME=(Resolve-Path $DshHome).Path
 $env:BKN_CONFIG_DIR=(Resolve-Path $CliConfig).Path
 $env:NODE_EXTRA_CA_CERTS=Join-Path $taskKit 'openbkn-local-ca.pem'
 if($ReadOnlyProtocol){$env:BKN_B1_LOCAL_PROTOCOL_KEY='nonsecret-local-fixture-key'}else{[Environment]::SetEnvironmentVariable('BKN_B1_LOCAL_PROTOCOL_KEY',$null,'Process')}
 foreach($taskName in @('BKN_TOKEN','BKN_BASE_URL','BKN_USER','BKN_PROFILE')){[Environment]::SetEnvironmentVariable($taskName,$null,'Process')}
 $taskArguments='"'+$taskBin+'" web --host 127.0.0.1 --port '+$Port+' --no-open'
 $taskProcess=Start-Process -FilePath $taskNode -ArgumentList $taskArguments -WorkingDirectory $Runtime -RedirectStandardOutput (Join-Path $Evidence 'host-stdout-private.txt') -RedirectStandardError (Join-Path $Evidence 'host-stderr-private.txt') -PassThru
 $taskProcessId=$taskProcess.Id
 $taskStarted=Get-CimInstance Win32_Process -Filter "ProcessId=$taskProcessId"
 if(-not $taskStarted){throw 'Host exited before ownership was recorded'}
 $taskRecord=[ordered]@{pid=$taskProcessId;createdUtc=([datetimeoffset]$taskStarted.CreationDate).ToUniversalTime().ToString('o');exe=$taskStarted.ExecutablePath;hostVersion=$HostVersion;listeners=@();taskOnly=$true}
 $taskDeadline=(Get-Date).AddSeconds(30)
 do{
  $taskListeners=@(Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue | Where-Object {$_.OwningProcess -eq $taskProcessId})
  if($taskListeners.Count -gt 0){break}
  if(-not(Get-Process -Id $taskProcessId -ErrorAction SilentlyContinue)){break}
  Start-Sleep -Milliseconds 250
 }while((Get-Date) -lt $taskDeadline)
 $taskRecord.listeners=@($taskListeners | ForEach-Object {@{port=$_.LocalPort;address=$_.LocalAddress}})
 $taskRecord | ConvertTo-Json -Depth 8 | Set-Content -Encoding UTF8 (Join-Path $Evidence 'owned-host.json')
 if($taskListeners.Count -eq 0){throw 'No owned listener; keep the record and inspect private logs; do not call stop helper with fabricated listeners'}
 Write-Host "Task Host started on 127.0.0.1:$Port. Bootstrap URLs stay in private logs."
}finally{
 foreach($taskName in $taskNames){[Environment]::SetEnvironmentVariable($taskName,$taskBefore[$taskName],'Process')}
}
