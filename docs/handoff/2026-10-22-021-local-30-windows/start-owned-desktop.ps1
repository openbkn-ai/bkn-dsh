# Start a task-owned, extracted official Desktop with persistent file handles for stdout/stderr.
# No installation, auto-update request, global environment change or credential output.
param(
 [Parameter(Mandatory=$true)][string]$ApplicationExe,
 [Parameter(Mandatory=$true)][string]$DshHome,
 [Parameter(Mandatory=$true)][string]$CliConfig,
 [Parameter(Mandatory=$true)][ValidateSet('0.2.0-rc.2','0.2.1-rc.2')][string]$HostVersion,
 [Parameter(Mandatory=$true)][string]$Evidence,
 [switch]$ReadOnlyProtocol,
 [switch]$InitializeOnly
)
$ErrorActionPreference='Stop'
$taskKit=Split-Path -Parent $MyInvocation.MyCommand.Path
$taskExe=(Resolve-Path $ApplicationExe).Path
$taskRuntime=Join-Path (Split-Path -Parent $taskExe) 'resources\app.asar\dsh'
$taskProfile=Join-Path $DshHome 'profiles\desktop'
if($InitializeOnly){
 if(Test-Path (Join-Path $taskProfile 'package.json')){throw 'Profile already initialized; use a normal verified launch'}
}elseif(-not(Test-Path (Join-Path $taskProfile 'package.json'))){throw 'Use -InitializeOnly once, fully quit, then install the candidate into the task profile'}
if(Test-Path $Evidence){throw 'Use a new evidence directory; do not overwrite a previous run'}
if(Get-CimInstance Win32_Process | Where-Object {$_.ExecutablePath -eq $taskExe}){throw 'This extracted Desktop is already running; retain its evidence and stop it by ownership first'}
foreach($taskValue in @($taskExe,$Evidence,$DshHome,$CliConfig)){if($taskValue -match '["\r\n]'){throw 'Paths cannot contain quotes or line breaks'}}
$taskNames=@('DSH_HOME','BKN_CONFIG_DIR','NODE_EXTRA_CA_CERTS','BKN_TOKEN','BKN_BASE_URL','BKN_USER','BKN_PROFILE','ELECTRON_RUN_AS_NODE','BKN_B1_LOCAL_PROTOCOL_KEY')
$taskBefore=@{}
foreach($taskName in $taskNames){$taskBefore[$taskName]=[Environment]::GetEnvironmentVariable($taskName,'Process')}
try{
 New-Item -ItemType Directory $Evidence | Out-Null
 New-Item -ItemType Directory -Force $DshHome,$CliConfig | Out-Null
 $env:DSH_HOME=(Resolve-Path $DshHome).Path
 $env:BKN_CONFIG_DIR=(Resolve-Path $CliConfig).Path
 $env:NODE_EXTRA_CA_CERTS=Join-Path $taskKit 'openbkn-local-ca.pem'
 if($ReadOnlyProtocol){$env:BKN_B1_LOCAL_PROTOCOL_KEY='nonsecret-local-fixture-key'}else{[Environment]::SetEnvironmentVariable('BKN_B1_LOCAL_PROTOCOL_KEY',$null,'Process')}
 foreach($taskName in @('BKN_TOKEN','BKN_BASE_URL','BKN_USER','BKN_PROFILE')){[Environment]::SetEnvironmentVariable($taskName,$null,'Process')}
 # Electron supplies native ASAR reads. The standalone system Node cannot read app.asar/dsh.
 $env:ELECTRON_RUN_AS_NODE='1'
 $taskVerifyList=@('--expose-internals','"'+(Join-Path $taskKit 'verify-kit.mjs')+'"','--runtime','"'+$taskRuntime+'"','--host',$HostVersion)
 if(-not $InitializeOnly){$taskVerifyList+=@('--profile','"'+$taskProfile+'"','--installed','"'+(Join-Path $taskProfile 'node_modules\@openbkn\dsh-business-context')+'"')}
 $taskVerifyArgs=$taskVerifyList -join ' '
 $taskVerify=Start-Process -FilePath $taskExe -ArgumentList $taskVerifyArgs -Wait -PassThru -RedirectStandardOutput (Join-Path $Evidence 'closure-before-private.txt') -RedirectStandardError (Join-Path $Evidence 'closure-before-stderr-private.txt')
 if($taskVerify.ExitCode -ne 0){throw 'Actual Desktop/profile closure failed; inspect the retained verification log'}
 [Environment]::SetEnvironmentVariable('ELECTRON_RUN_AS_NODE',$null,'Process')
 $taskUserData=Join-Path (Resolve-Path $Evidence).Path 'electron-user-data'
 $taskProcess=Start-Process -FilePath $taskExe -ArgumentList ('--user-data-dir="'+$taskUserData+'"') -WorkingDirectory (Split-Path -Parent $taskExe) -RedirectStandardOutput (Join-Path $Evidence 'desktop-stdout-private.txt') -RedirectStandardError (Join-Path $Evidence 'desktop-stderr-private.txt') -PassThru
 $taskProcessId=$taskProcess.Id
 $taskStarted=Get-CimInstance Win32_Process -Filter "ProcessId=$taskProcessId"
 if(-not $taskStarted){throw 'Desktop exited before ownership was recorded; retain private logs'}
 $taskRecord=[ordered]@{pid=$taskProcessId;createdUtc=([datetimeoffset]$taskStarted.CreationDate).ToUniversalTime().ToString('o');exe=$taskStarted.ExecutablePath;hostVersion=$HostVersion;hostForm='desktop';initializationOnly=[bool]$InitializeOnly;listeners=@();taskOnly=$true}
 $taskRecord | ConvertTo-Json -Depth 8 | Set-Content -Encoding UTF8 (Join-Path $Evidence 'owned-host.json')
 $taskDeadline=(Get-Date).AddSeconds(45)
 do{
  $taskAll=@(Get-CimInstance Win32_Process);$taskIds=@($taskProcessId)
  do{$taskChildren=@($taskAll | Where-Object {$taskIds -contains $_.ParentProcessId -and $taskIds -notcontains $_.ProcessId});$taskIds+=@($taskChildren | ForEach-Object {$_.ProcessId})}while($taskChildren.Count -gt 0)
  $taskListeners=@(Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object {$taskIds -contains $_.OwningProcess})
  if($taskListeners.Count -gt 0){break}
  if(-not(Get-Process -Id $taskProcessId -ErrorAction SilentlyContinue)){break}
  Start-Sleep -Milliseconds 250
 }while((Get-Date) -lt $taskDeadline)
 $taskRecord.listeners=@($taskListeners | ForEach-Object {@{port=$_.LocalPort;address=$_.LocalAddress;ownerPid=$_.OwningProcess}})
 $taskRecord | ConvertTo-Json -Depth 8 | Set-Content -Encoding UTF8 (Join-Path $Evidence 'owned-host.json')
 if($taskListeners.Count -eq 0){throw 'No owned listener; retain the ownership record and logs, do not invent a port'}
 Write-Host 'Task Desktop started with durable private logs. Keep bootstrap URLs and credentials private.'
}finally{
 foreach($taskName in $taskNames){[Environment]::SetEnvironmentVariable($taskName,$taskBefore[$taskName],'Process')}
}
