# Exercise the real argv regression with Windows PowerShell 5.1-style JSON
# array output (one non-enumerated pipeline object). No Host is started.
param(
 [Parameter(Mandatory=$true)][string]$Regression,
 [Parameter(Mandatory=$true)][string]$Launcher,
 [Parameter(Mandatory=$true)][string]$NodeExe
)
$ErrorActionPreference='Stop'
function ConvertFrom-Json {
 [CmdletBinding()]
 param([Parameter(Mandatory=$true,ValueFromPipeline=$true)][string]$InputObject)
 process{
  $taskParsed=Microsoft.PowerShell.Utility\ConvertFrom-Json -InputObject $InputObject
  $PSCmdlet.WriteObject($taskParsed,$false)
 }
}
& $Regression -Launcher $Launcher -NodeExe $NodeExe
