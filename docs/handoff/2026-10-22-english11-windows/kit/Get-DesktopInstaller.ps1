param([Parameter(Mandatory = $true)][string]$DownloadDirectory)
. (Join-Path $PSScriptRoot 'common.ps1')
Assert-Windows
Assert-Kit
$pin = (Get-Content -LiteralPath (Join-Path $PSScriptRoot 'pins.json') -Raw | ConvertFrom-Json).desktopInstaller
$dir = [IO.Path]::GetFullPath($DownloadDirectory)
$file = Join-Path $dir $pin.file
if ((Test-Path -LiteralPath $file) -or (Test-Path -LiteralPath ($file + '.partial'))) { throw 'Download already exists. Use a new directory; no file is overwritten.' }
New-Item -ItemType Directory -Force -Path $dir | Out-Null
[Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12
Invoke-WebRequest -UseBasicParsing -Uri $pin.url -OutFile ($file + '.partial')
$digest = (Get-FileHash -LiteralPath ($file + '.partial') -Algorithm SHA256).Hash.ToLowerInvariant()
if ($digest -ne $pin.sha256) { throw 'Installer digest differs. The original partial file is retained. Do not install it.' }
Move-Item -LiteralPath ($file + '.partial') -Destination $file
$signature = Get-AuthenticodeSignature -LiteralPath $file
Write-JsonFile ([ordered]@{
    capturedAt = [DateTime]::UtcNow.ToString('o'); url = $pin.url; bytes = (Get-Item -LiteralPath $file).Length
    sha256 = $digest; authenticodeStatus = $signature.Status.ToString()
    signer = $(if ($null -ne $signature.SignerCertificate) { $signature.SignerCertificate.Subject } else { $null })
    verificationNote = 'SHA256 is an observed official HTTPS download digest, not a vendor-signed archived feed digest. Review Authenticode before manual installation.'
}) ($file + '.receipt.json')
if ($signature.Status -ne 'Valid') { throw "Authenticode is $($signature.Status). Preserve the receipt; do not install until reviewed." }
Write-Host "Verified download: $file. Install manually on the designated Windows test environment; no installer was executed."
