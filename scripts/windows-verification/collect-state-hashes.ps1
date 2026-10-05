# Hash selected state files (names only, never contents) so before/after a
# case the caller can prove which files changed. Reads nothing outside
# $TestRoot and prints no file bodies.
param(
    [Parameter(Mandatory = $true)][string]$TestRoot
)

$ErrorActionPreference = 'Stop'
$homeDir = Join-Path $TestRoot 'dsh-home'
$targets = @(
    'profiles\web\package.json',
    'profiles\web\cordis.patch.yml',
    'profiles\web\pnpm-lock.yaml',
    'profiles\desktop\package.json',
    'profiles\desktop\cordis.patch.yml',
    'profiles\desktop\pnpm-lock.yaml'
)

$result = [ordered]@{}
foreach ($relative in $targets) {
    $path = Join-Path $homeDir $relative
    if (Test-Path $path) {
        $result[$relative] = (Get-FileHash $path -Algorithm SHA256).Hash
    } else {
        $result[$relative] = $null
    }
}
$result | ConvertTo-Json
