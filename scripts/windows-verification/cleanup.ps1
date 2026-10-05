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

# Stop only processes this test root started.
Get-ChildItem (Join-Path $TestRoot 'evidence') -Filter '*.pid' -ErrorAction SilentlyContinue | ForEach-Object {
    $pidText = (Get-Content $_.FullName -ErrorAction SilentlyContinue | Select-Object -First 1)
    if ($pidText -match '^\d+$') {
        $target = Get-Process -Id ([int]$pidText) -ErrorAction SilentlyContinue
        if ($null -ne $target) {
            Stop-Process -Id $target.Id -Force
            Write-Host "stopped pid $($target.Id) ($($_.BaseName))"
        }
    }
    Remove-Item $_ -Force
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
