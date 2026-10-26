param([Parameter(Mandatory = $true)][string]$KitRoot)
$ErrorActionPreference = 'Stop'
$scripts = @(Get-ChildItem -LiteralPath $KitRoot -Filter '*.ps1')
foreach ($script in $scripts) {
    $tokens = $null; $parseErrors = $null
    $null = [System.Management.Automation.Language.Parser]::ParseFile($script.FullName, [ref]$tokens, [ref]$parseErrors)
    if ($parseErrors.Count -ne 0) { throw ($parseErrors | Out-String) }
    if ([IO.File]::ReadAllBytes($script.FullName) | Where-Object { $_ -gt 127 }) { throw 'PowerShell source must remain ASCII for 5.1 decoding.' }
}
. (Join-Path $KitRoot 'common.ps1')
Assert-Kit
$null = Assert-SupportedNode
$taskTemp = Join-Path ([IO.Path]::GetTempPath()) ('english11-ps-' + [Guid]::NewGuid().ToString('N'))
$null = New-Item -ItemType Directory -Path $taskTemp
try {
    $beforeDsh = $env:DSH_HOME; $beforeBkn = $env:BKN_CONFIG_DIR
    $fixtureState = [pscustomobject]@{ dshHome = (Join-Path $taskTemp 'fixture-dsh'); bknConfigDir = (Join-Path $taskTemp 'fixture-bkn') }
    $caught = $false
    try { Invoke-InTestEnvironment $fixtureState { throw 'expected fixture interruption' } } catch { $caught = $_.Exception.Message -eq 'expected fixture interruption' }
    if (-not $caught -or $env:DSH_HOME -ne $beforeDsh -or $env:BKN_CONFIG_DIR -ne $beforeBkn) { throw 'Environment restoration failed.' }
    $jsonFile = Join-Path $taskTemp 'utf8.json'
    Write-JsonFile @{ value = 'fixture' } $jsonFile
    $bytes = [IO.File]::ReadAllBytes($jsonFile)
    if ($bytes[0] -eq 239 -and $bytes[1] -eq 187 -and $bytes[2] -eq 191) { throw 'UTF-8 BOM must not be emitted.' }
    $nodeExecutable = (Get-Command node).Source
    Invoke-NativeLogged $nodeExecutable @('-e', 'process.stderr.write("expected progress\n"); process.exit(0)') (Join-Path $taskTemp 'progress.log')
    $caught = $false
    try { Invoke-NativeLogged $nodeExecutable @('-e', 'process.exit(7)') (Join-Path $taskTemp 'failure.log') } catch { $caught = $_.Exception.Message -like '*exit code 7*' }
    if (-not $caught) { throw 'Nonzero native command exit must fail.' }
    Write-Output (@{ parsedScripts = $scripts.Count; helperSmoke = 'PASS'; nativeWindowsUiAcceptance = 'NOT_RUN'; runtime = $PSVersionTable.PSVersion.ToString() } | ConvertTo-Json)
} finally { Remove-Item -LiteralPath $taskTemp -Recurse -Force }
