# Undo what run-case.ps1 did inside this test root: stop only the pids it
# recorded, restore the pristine candidate, and keep the evidence files.
# Never touches the user's real profiles, credentials, or other dsh processes.
param(
    [Parameter(Mandatory = $true)][string]$TestRoot,
    [Parameter(Mandatory = $true)][string]$CandidateTgz
)

$ErrorActionPreference = 'Stop'
$prepared = Get-Content (Join-Path $TestRoot 'evidence\prepared.json') | ConvertFrom-Json
$dsh = $prepared.dshCli
$env:DSH_HOME = $prepared.dshHome
$env:BKN_CONFIG_DIR = $prepared.bknConfigDir
if ((Get-FileHash -LiteralPath $CandidateTgz -Algorithm SHA256).Hash -ne $prepared.candidate) { throw 'Candidate differs from preparation' }

# Stop only processes this test root started, after verifying identity so a
# reused pid can never be stopped by mistake: the recorded pid must still be
# alive, carry the same creation time as at boot, and match this round's
# expected host per form. ('*.pid' must not swallow '*.children.pid'.)
Get-ChildItem (Join-Path $TestRoot 'evidence') -Filter '*.pid' -ErrorAction SilentlyContinue |
  Where-Object { $_.Name -notlike '*.children.pid' } | ForEach-Object {
    $pidRecord = (Get-Content $_.FullName -ErrorAction SilentlyContinue | Select-Object -First 1)
    if ($pidRecord -match '^(\d+):(\d+)$') {
        $stopPid = [int]$Matches[1]; $bootTicks = $Matches[2]
        $proc = Get-CimInstance Win32_Process -Filter "ProcessId=$stopPid" -ErrorAction SilentlyContinue
        if ($null -ne $proc) {
            if ("$($proc.CreationDate.Ticks)" -ne $bootTicks) {
                Write-Host "skip pid $stopPid : creation time differs (pid reused or host restarted); not this round's process"
            } else {
                $identityOk = $false
                if ($prepared.form -eq 'desktop' -and $prepared.desktopAppPath -and $proc.ExecutablePath -eq $prepared.desktopAppPath) { $identityOk = $true }
                if ($prepared.form -eq 'npm' -and $proc.CommandLine -like ("*" + $prepared.dshCli + "*")) { $identityOk = $true }
                if ($identityOk) {
                    Stop-Process -Id $proc.ProcessId -Force
                    Write-Host "stopped verified pid $($proc.ProcessId) ($($_.BaseName))"
                } else {
                    Write-Host "skip pid $stopPid : identity no longer matches this round's recorded host"
                }
            }
        }
    }
    # PS 5.1 binds a FileInfo positional argument as a bare name relative to
    # the current directory; -LiteralPath with FullName is correct everywhere.
    Remove-Item -LiteralPath $_.FullName -Force
}

# The npm `.cmd` launcher exits while its node web child keeps serving. Stop
# only child pids run-case recorded, after re-verifying five things: node.exe,
# this round's CLI tree path, ' web ', the exact recorded port with a digit
# boundary (so --port 826 cannot match --port 8260), the recorded creation
# time, and that this pid still owns the port's current listener.
$cliTree = Split-Path (Split-Path $prepared.dshCli)
Get-ChildItem (Join-Path $TestRoot 'evidence') -Filter '*.children.pid' -ErrorAction SilentlyContinue | ForEach-Object {
    $childRecord = (Get-Content $_.FullName -ErrorAction SilentlyContinue | Select-Object -First 1)
    if ($childRecord -match '^(\d+):(\d+):(\d+)$') {
        $childPid = [int]$Matches[1]; $childPort = $Matches[2]; $bootTicks = $Matches[3]
        $target = Get-CimInstance Win32_Process -Filter "ProcessId=$childPid" -ErrorAction SilentlyContinue
        $portPattern = ('--port ' + $childPort + '(\s|$)')
        $currentListener = Get-NetTCPConnection -LocalPort ([int]$childPort) -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($null -ne $target -and $target.Name -eq 'node.exe' -and
            $target.CommandLine -like ("*" + $cliTree + "*") -and
            $target.CommandLine -match ' web ' -and
            $target.CommandLine -match $portPattern -and
            "$($target.CreationDate.Ticks)" -eq $bootTicks -and
            $currentListener -and $currentListener.OwningProcess -eq $childPid) {
            Write-Host ("stopping recorded npm web child pid $childPid (port $childPort, listener verified)")
            Stop-Process -Id $childPid -Force
        } elseif ($null -ne $target) {
            Write-Host ("skipping pid $childPid : identity, creation time, or port ownership no longer matches this round's web child")
        }
        Remove-Item -LiteralPath $_.FullName -Force
    }
}

# Reinstall the pristine candidate so the next case starts clean — into the
# profile this form actually boots (desktop for the desktop app, web for npm).
$profileDir = $prepared.profileDir
$profileName = $prepared.profile
Remove-Item -Recurse -Force (Join-Path $profileDir 'node_modules\@openbkn') -ErrorAction SilentlyContinue
& $dsh plugin --profile $profileName install $CandidateTgz
if ($LASTEXITCODE -ne 0) { throw "pristine reinstall into profile $profileName failed" }

# This test root's profile used its own CLI store only if the tester logged in
# there; a real logout is out of scope for cleanup — the whole directory is
# disposable. Evidence files are intentionally kept.
Write-Host "Cleaned $TestRoot (evidence kept). Remove the whole directory when the run is accepted."
