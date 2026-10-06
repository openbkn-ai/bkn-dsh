$ErrorActionPreference = 'Stop'
$Kit = 'C:\bkn-verify\diag7-fidelity'
$NpmRoot = 'C:\bkn-verify\unified7-fidelity-npm'
$Runtime = 'C:\bkn-verify\diag6-tools\node_modules\@deepseek-ai\dsh'
$Installed = Join-Path $NpmRoot 'dsh-home\profiles\web\node_modules\@openbkn\dsh-business-context'
$Work = Join-Path $NpmRoot 'fidelity-standalone-probe'
if (Test-Path $Work) { throw "probe work exists: $Work" }
node (Join-Path $Kit 'probe\prepare-fidelity-probe.mjs') --runtime $Runtime --plugin $Installed --work $Work --files (Join-Path $Kit 'candidate\candidate-files.json')
if ($LASTEXITCODE -ne 0) { throw 'probe preparation failed' }
$out = @(node (Join-Path $Kit 'probe\tests\probes\answer-fidelity-runtime.probe.mjs') --runtime $Runtime --plugin (Join-Path $Work 'package'))
if ($LASTEXITCODE -ne 0) { throw 'controlled runtime probe failed' }
[IO.File]::WriteAllText((Join-Path $NpmRoot 'evidence\fidelity-runtime.jsonl'), ($out -join "`n") + "`n", (New-Object Text.UTF8Encoding($false)))
$rows = @(Get-Content (Join-Path $NpmRoot 'evidence\fidelity-runtime.jsonl') | ForEach-Object { $_ | ConvertFrom-Json })
$cases = @($rows | Where-Object { $_.scenario })
Write-Host ("scenario rows: " + $cases.Count)
foreach ($c in $cases) { Write-Host ($c.scenario + " -> passed=" + $c.passed) }
if ($cases.Count -ne 6 -or @($cases | Where-Object { $_.passed -ne $true }).Count -ne 0) { throw 'Expected six explicit passing scenarios' }
Write-Host 'F02 SIX SCENARIOS ALL PASS'
