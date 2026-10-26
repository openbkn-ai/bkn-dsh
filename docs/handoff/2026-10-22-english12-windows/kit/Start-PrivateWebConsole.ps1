param([Parameter(Mandatory = $true)][string]$TestRoot)
. (Join-Path $PSScriptRoot 'common.ps1')
Assert-Windows
Assert-Kit
$state = Read-TestState $TestRoot
if ($state.form -ne 'npm') { throw 'Use this private console launcher only for the npm/Web form.' }
Assert-Dsh $state
Assert-HostStopped $state
$executableName = if ($PSVersionTable.PSEdition -eq 'Core') { 'pwsh.exe' } else { 'powershell.exe' }
$executable = Join-Path $PSHOME $executableName
$script = Join-Path $PSScriptRoot 'Start-Host.ps1'
# Keep native Host stdout (including its local URL token) out of agent tool output.
# This is a separate visible console, not a redirected or Tee-Object pipeline.
$arguments = @('-NoLogo', '-NoProfile', '-NoExit', '-File', ('"' + $script + '"'), '-TestRoot', ('"' + $state.testRoot + '"'))
$proc = Start-Process -FilePath $executable -ArgumentList $arguments -WorkingDirectory $PSScriptRoot -WindowStyle Normal -PassThru
$stamp = [DateTime]::UtcNow.ToString('yyyyMMddTHHmmssfffZ')
Write-JsonFile ([ordered]@{
    capturedAt = [DateTime]::UtcNow.ToString('o'); form = 'npm'; dshHome = $state.dshHome
    privateConsolePid = $proc.Id; executable = $executable; createdAt = $proc.StartTime.ToUniversalTime().ToString('o')
    startupUrlRecorded = $false; hostReceiptStillRequired = $true
}) (Join-Path $state.testRoot "evidence\private-console-$stamp.json")
Write-Host "Opened private test console PID $($proc.Id). This is not a Host-ready or UI-pass receipt."
Write-Host 'Open the startup URL locally from that console. Do not inspect/capture its contents through an agent tool, screenshot, transcript, or shared log.'
Write-Host 'Collect the real Host receipt from this separate terminal. After stopping the Host, close only the recorded test console.'
