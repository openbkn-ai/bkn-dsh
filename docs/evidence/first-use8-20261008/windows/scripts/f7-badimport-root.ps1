# Build one independent desktop fault root for an F7 bad-import variant.
# Variant 'business'   : exports['./business'].default    -> ./lib/business.fu8-missing.js
# Variant 'diagnostics': exports['./diagnostics'].default -> ./lib/diagnostics.fu8-missing.js
# Root bootstrap export '.' is never touched.
param([Parameter(Mandatory=$true)][ValidateSet('business','diagnostics')][string]$Variant)
$ErrorActionPreference = 'Stop'
$Utf8 = New-Object Text.UTF8Encoding($false)
$ev = 'C:\bkn-verify\first-use8-evidence'
$root = "C:\bkn-verify\first-use8-desktop-f7-$Variant"
$log = Join-Path $ev "f7-badimport-$Variant-setup.txt"
$out = New-Object System.Collections.Generic.List[string]
function Log($m){ $out.Add("$(Get-Date -Format o) $m"); Write-Host $m }
if (Test-Path $root) { throw "fault root exists: $root" }
if (Get-Process 'DeepSeek Harness' -ErrorAction SilentlyContinue) { throw 'another desktop Host is running (single instance)' }
$exe = 'C:\Users\kalia\AppData\Local\Programs\DeepSeek Harness\DeepSeek Harness.exe'
$cli = 'C:\Users\kalia\AppData\Local\Programs\DeepSeek Harness\resources\runtime\cli\bin\dsh.cmd'
$tgz = 'C:\bkn-verify\first-use8-download\openbkn-dsh-business-context-0.2.0-rc.2-openbkn.0.2.0-8.tgz'
$tgzSha = (Get-FileHash $tgz -Algorithm SHA256).Hash.ToLowerInvariant()
if ($tgzSha -ne '6a946030a6152d2899609fac95c66cd246e36cca5a8ce4e5f87ed379cbe706ea') { throw "tgz sha differs: $tgzSha" }
Log "variant=$Variant root=$root tgz=$tgzSha"
New-Item -ItemType Directory -Force -Path (Join-Path $root 'dsh-home') | Out-Null
$env:DSH_HOME = Join-Path $root 'dsh-home'
$env:BKN_CONFIG_DIR = Join-Path $root 'bkn-config'
$env:NODE_EXTRA_CA_CERTS = 'C:\bkn-verify\unified7-c91fe09-authentication-recovery\windows-kit\certificates\openbkn-dev-ca.pem'
# 1. real app initializes the profile, then exits
$p = Start-Process -FilePath $exe -PassThru
Start-Sleep -Seconds 15
try { $null = $p.CloseMainWindow() } catch { }
Start-Sleep -Seconds 8
Get-Process 'DeepSeek Harness' -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3
if (-not (Test-Path (Join-Path $env:DSH_HOME 'profiles\desktop'))) { throw 'profile init failed' }
Log "profile initialized by real app pid=$($p.Id)"
# 2. native install of the fixed candidate (separate process; capture all streams)
$inst = & powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "& '$cli' plugin --profile desktop install '$tgz' *>&1; exit `$LASTEXITCODE"
$code = $LASTEXITCODE
Log "install exit=$code"
$inst | ForEach-Object { $out.Add("  | $_") }
if ($code -ne 0) { [IO.File]::WriteAllLines($log, $out, $Utf8); throw 'install failed' }
$pkgDir = Join-Path $env:DSH_HOME 'profiles\desktop\node_modules\@openbkn\dsh-business-context'
$pkgJson = Join-Path $pkgDir 'package.json'
$basePkgSha = (Get-FileHash $pkgJson -Algorithm SHA256).Hash.ToLowerInvariant()
Log "installed package dir=$((Resolve-Path $pkgDir).Path) realpath=$((Get-Item $pkgDir).Target) package.json base sha=$basePkgSha"
[IO.File]::Copy($pkgJson, (Join-Path $ev "f7-badimport-$Variant-package.base.json"), $true)
# 3. variant edit: only the one export target; keep everything else byte-for-byte via JSON text replace
$text = [IO.File]::ReadAllText($pkgJson)
$from = if ($Variant -eq 'business') { '"default": "./lib/business.js"' } else { '"default": "./lib/diagnostics.js"' }
$to   = if ($Variant -eq 'business') { '"default": "./lib/business.fu8-missing.js"' } else { '"default": "./lib/diagnostics.fu8-missing.js"' }
if (([regex]::Matches($text, [regex]::Escape($from))).Count -ne 1) { throw "expected exactly one '$from'" }
$text = $text.Replace($from, $to)
[IO.File]::WriteAllText($pkgJson, $text, $Utf8)
$varPkgSha = (Get-FileHash $pkgJson -Algorithm SHA256).Hash.ToLowerInvariant()
[IO.File]::Copy($pkgJson, (Join-Path $ev "f7-badimport-$Variant-package.variant.json"), $true)
Log "variant edit: $from -> $to ; package.json variant sha=$varPkgSha"
$patchSha = (Get-FileHash (Join-Path $env:DSH_HOME 'profiles\desktop\cordis.patch.yml') -Algorithm SHA256).Hash.ToLowerInvariant()
Log "profile patch sha (untouched by this script)=$patchSha"
# 4. launch the fault Host
$p2 = Start-Process -FilePath $exe -PassThru
Start-Sleep -Seconds 15
$proc = Get-CimInstance Win32_Process -Filter "ProcessId=$($p2.Id)"
if (-not $proc) { throw 'fault host exited' }
$ticks = ([datetimeoffset]$proc.CreationDate).UtcTicks
[IO.File]::WriteAllText((Join-Path $ev "f7-badimport-$Variant-host.pid"), "$($p2.Id):$ticks", $Utf8)
Log "fault host pid=$($p2.Id) ticks=$ticks"
[IO.File]::WriteAllLines($log, $out, $Utf8)
