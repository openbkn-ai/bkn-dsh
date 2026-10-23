# Run on Windows PowerShell 5.1 or task-local PowerShell on macOS.
# Evaluates only the launcher's argument-construction assignments, then checks
# the argv observed by a real Node process. No Host or platform is started.
param(
 [Parameter(Mandatory=$true)][string]$Launcher,
 [Parameter(Mandatory=$true)][string]$NodeExe
)
$ErrorActionPreference='Stop'
$taskTokens=$null
$taskErrors=$null
$taskAst=[System.Management.Automation.Language.Parser]::ParseFile((Resolve-Path $Launcher).Path,[ref]$taskTokens,[ref]$taskErrors)
if($taskErrors.Count -gt 0){throw 'Launcher has PowerShell parse errors'}
$taskAssignments=@($taskAst.FindAll({param($taskNode) $taskNode -is [System.Management.Automation.Language.AssignmentStatementAst]},$true))
$taskBase=@($taskAssignments | Where-Object {$_.Left.Extent.Text -eq '$taskVerifyList' -and $_.Operator -eq 'Equals'})
$taskProfileArgs=@($taskAssignments | Where-Object {$_.Left.Extent.Text -eq '$taskVerifyList' -and $_.Operator -eq 'PlusEquals'})
$taskJoin=@($taskAssignments | Where-Object {$_.Left.Extent.Text -eq '$taskVerifyArgs'})
if($taskBase.Count -ne 1 -or $taskProfileArgs.Count -ne 1 -or $taskJoin.Count -ne 1){throw 'Expected one base/profile/join argument boundary'}
$taskScratch=Join-Path ([IO.Path]::GetTempPath()) ('openbkn argv space '+[guid]::NewGuid().ToString('N'))
try{
 New-Item -ItemType Directory $taskScratch | Out-Null
 $taskKit=Join-Path $taskScratch 'kit with spaces'
 $taskRuntime=Join-Path $taskScratch 'Host runtime/resources/app.asar/dsh'
 $taskProfile=Join-Path $taskScratch 'task home/profiles/desktop'
 $HostVersion='0.2.0-rc.2'
 New-Item -ItemType Directory $taskKit | Out-Null
 $taskSink=Join-Path $taskKit 'verify-kit.mjs'
 [IO.File]::WriteAllText($taskSink,'console.log(JSON.stringify(process.argv.slice(1)))',([Text.UTF8Encoding]::new($false)))
 $taskCases=@()
 foreach($taskInitialize in @($true,$false)){
  Invoke-Expression $taskBase[0].Extent.Text
  if(-not $taskInitialize){Invoke-Expression $taskProfileArgs[0].Extent.Text}
  Invoke-Expression $taskJoin[0].Extent.Text
  $taskExpected=@('--expose-internals',('"'+$taskSink+'"'),'--runtime',('"'+$taskRuntime+'"'),'--host',$HostVersion)
  $taskExpectedArgv=@($taskSink,'--runtime',$taskRuntime,'--host',$HostVersion)
  if(-not $taskInitialize){
   $taskInstalled=Join-Path $taskProfile 'node_modules\@openbkn\dsh-business-context'
   $taskExpected+=@('--profile',('"'+$taskProfile+'"'),'--installed',('"'+$taskInstalled+'"'))
   $taskExpectedArgv+=@('--profile',$taskProfile,'--installed',$taskInstalled)
  }
  if($taskVerifyList.Count -ne $taskExpected.Count){throw 'Argument element count differs'}
  for($taskIndex=0;$taskIndex -lt $taskExpected.Count;$taskIndex++){
   if($taskVerifyList[$taskIndex] -cne $taskExpected[$taskIndex]){throw ('Argument element mismatch at index '+$taskIndex+'; initialize='+$taskInitialize)}
  }
  $taskStdout=Join-Path $taskScratch ('argv-'+$taskInitialize+'.json')
  $taskStderr=Join-Path $taskScratch ('argv-'+$taskInitialize+'.stderr')
  $taskChild=Start-Process -FilePath $NodeExe -ArgumentList $taskVerifyArgs -RedirectStandardOutput $taskStdout -RedirectStandardError $taskStderr -Wait -PassThru
  if($taskChild.ExitCode -ne 0){throw 'Real Node argv sink failed'}
  $taskActualArgv=@(Get-Content -Raw $taskStdout | ConvertFrom-Json)
  if($taskActualArgv.Count -ne $taskExpectedArgv.Count){throw 'Native argv element count differs'}
  for($taskIndex=0;$taskIndex -lt $taskExpectedArgv.Count;$taskIndex++){
   if($taskActualArgv[$taskIndex] -cne $taskExpectedArgv[$taskIndex]){throw ('Native argv mismatch at index '+$taskIndex)}
  }
  $taskCases+=@{initializeOnly=$taskInitialize;argumentElements=$taskVerifyList.Count;nativeArgvMatched=$true}
 }
 @{powershell=$PSVersionTable.PSVersion.ToString();cases=$taskCases;hostStarted=$false;platformAccessed=$false} | ConvertTo-Json -Depth 5
}finally{
 if(Test-Path $taskScratch){Remove-Item -Recurse -Force $taskScratch}
}
