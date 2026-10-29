# Windows PowerShell 5.1. This is only the known dsh protocol write surface.
[CmdletBinding()]
param(
 [Parameter(Mandatory=$true)][ValidateSet('Before','After','Restore')][string]$Phase,
 [Parameter(Mandatory=$true)][string]$EvidenceRoot,
 [Parameter(Mandatory=$true)][string]$DesktopExe
)
$ErrorActionPreference = 'Stop'
if ($env:OS -ne 'Windows_NT') { throw 'Windows only; no registry access performed.' }
$EvidenceRoot = [IO.Path]::GetFullPath($EvidenceRoot)
$DesktopExe = (Get-Item -LiteralPath $DesktopExe).FullName
$regExe = Join-Path $env:SystemRoot 'System32\reg.exe'
$sid = [Security.Principal.WindowsIdentity]::GetCurrent().User.Value
$handler = 'Software\Classes\dsh'
$targets = @(
 @{ Name='handler'; SubKey=$handler; RegKey='HKCU\Software\Classes\dsh' },
 @{ Name='user-choice-guard'; SubKey='Software\Microsoft\Windows\Shell\Associations\UrlAssociations\dsh'; RegKey='HKCU\Software\Microsoft\Windows\Shell\Associations\UrlAssociations\dsh' }
)
$sites = @(@{Path=$handler;Name=''}, @{Path=$handler;Name='URL Protocol'}, @{Path=($handler+'\shell\open\command');Name=''})
$prunable = @(($handler+'\shell\open\command'), ($handler+'\shell\open'), ($handler+'\shell'), $handler)
function Get-Site($site) {
 $key = [Microsoft.Win32.Registry]::CurrentUser.OpenSubKey($site.Path,$false)
 try {
  $present = ($null -ne $key) -and (@($key.GetValueNames()) -contains $site.Name)
  $kind=$null; $value=$null
  if ($present) {
   $kind=$key.GetValueKind($site.Name).ToString()
   $value=$key.GetValue($site.Name,$null,[Microsoft.Win32.RegistryValueOptions]::DoNotExpandEnvironmentNames)
   if ($kind -eq 'Binary' -or $kind -eq 'None') { $value=[Convert]::ToBase64String([byte[]]$value) }
  }
  return [pscustomobject]@{Path=$site.Path;Name=$site.Name;Present=$present;Kind=$kind;Value=$value}
 } finally { if ($null -ne $key) { $key.Dispose() } }
}
function Capture([string]$label) {
 $dest=Join-Path $EvidenceRoot $label
 if (Test-Path -LiteralPath $dest) { throw 'Retain existing snapshot; choose a fresh evidence root.' }
 $null=New-Item -ItemType Directory -Path $dest
 $items=@()
 foreach ($target in $targets) {
  $key=[Microsoft.Win32.Registry]::CurrentUser.OpenSubKey($target.SubKey,$false)
  $exists=$null -ne $key
  if ($exists) { $key.Dispose() }
  $file=Join-Path $dest ($target.Name+'.reg');$digest=$null
  if ($exists) {
   & $regExe export $target.RegKey $file /y 2>&1 | Out-File -LiteralPath (Join-Path $dest ($target.Name+'-export.log')) -Encoding utf8
   if ($LASTEXITCODE -ne 0) { throw ('Registry export failed: '+$target.Name) }
   $digest=(Get-FileHash -LiteralPath $file -Algorithm SHA256).Hash.ToLowerInvariant()
  }
  $items += [pscustomobject]@{Name=$target.Name;RegKey=$target.RegKey;Exists=$exists;Sha256=$digest;File=([IO.Path]::GetFileName($file))}
 }
 $keys=@()
 foreach ($path in $prunable) {
  $key=[Microsoft.Win32.Registry]::CurrentUser.OpenSubKey($path,$false)
  $keys += [pscustomobject]@{Path=$path;Exists=($null -ne $key)}
  if ($null -ne $key) { $key.Dispose() }
 }
 $snapshot=[pscustomobject]@{Phase=$label;AccountSid=$sid;DesktopExe=$DesktopExe;AtUtc=[DateTime]::UtcNow.ToString('o');Exports=$items;WriteSites=@($sites | ForEach-Object { Get-Site $_ });Keys=$keys;Complete=$true}
 $snapshot | ConvertTo-Json -Depth 15 | Set-Content -LiteralPath (Join-Path $dest 'snapshot.json') -Encoding utf8
 return $snapshot
}
function Same-Exports($a,$b) {
 foreach ($name in @('handler','user-choice-guard')) {
  $x=@($a.Exports | Where-Object {$_.Name -eq $name})[0];$y=@($b.Exports | Where-Object {$_.Name -eq $name})[0]
  if ($x.Exists -ne $y.Exists -or $x.Sha256 -ne $y.Sha256) { return $false }
 }
 return $true
}
if ($Phase -eq 'Before') {
 if (Test-Path -LiteralPath $EvidenceRoot) { throw 'A new backup root is required.' }
 $null=New-Item -ItemType Directory -Path $EvidenceRoot
 $snapshot=Capture 'before'
 Write-Output 'Before backup complete: full .reg contents or explicit absence for both scoped keys.'
 exit 0
}
$before=Get-Content -LiteralPath (Join-Path $EvidenceRoot 'before\snapshot.json') -Raw | ConvertFrom-Json
if (-not $before.Complete -or $before.AccountSid -ne $sid -or $before.DesktopExe -ne $DesktopExe) { throw 'Backup identity mismatch.' }
if ($Phase -eq 'After') { $snapshot=Capture 'after';Write-Output ('After capture complete; unchanged='+(Same-Exports $before $snapshot));exit 0 }
$after=Get-Content -LiteralPath (Join-Path $EvidenceRoot 'after\snapshot.json') -Raw | ConvertFrom-Json
$current=Capture 'restore-check'
if (-not (Same-Exports $after $current)) { throw 'Registry changed since After; no restore performed.' }
$beforeChoice=@($before.Exports | Where-Object {$_.Name -eq 'user-choice-guard'})[0]
$afterChoice=@($after.Exports | Where-Object {$_.Name -eq 'user-choice-guard'})[0]
if ($beforeChoice.Exists -ne $afterChoice.Exists -or $beforeChoice.Sha256 -ne $afterChoice.Sha256) { throw 'UserChoice guard changed; do not rewrite protected hashes or permissions.' }
foreach ($item in $before.Exports) {
 if ($item.Exists) {
  $file=Join-Path (Join-Path $EvidenceRoot 'before') $item.File
  if ((Get-FileHash -LiteralPath $file -Algorithm SHA256).Hash.ToLowerInvariant() -ne $item.Sha256) { throw 'Original export digest mismatch.' }
 }
}
if (-not (Same-Exports $before $current)) {
 $command=[Microsoft.Win32.Registry]::CurrentUser.OpenSubKey(($handler+'\shell\open\command'),$false)
 try { $value=$command.GetValue('') } finally { if ($null -ne $command) { $command.Dispose() } }
 $expected=@(('"'+$DesktopExe+'" "%1"'), ($DesktopExe+' "%1"'))
 if ($expected -notcontains $value) { throw 'Current handler does not point to the verified task Desktop; no restore performed.' }
 # Restore only the three values Electron writes. Never delete an existing key/ACL.
 foreach ($site in $before.WriteSites) {
  $key=[Microsoft.Win32.Registry]::CurrentUser.OpenSubKey($site.Path,$true)
  try {
   if ($site.Present) {
    if ($null -eq $key) { throw 'A previously existing key disappeared; stop instead of recreating permissions.' }
    $kind=[Microsoft.Win32.RegistryValueKind][Enum]::Parse([Microsoft.Win32.RegistryValueKind],$site.Kind)
    $data=$site.Value
    if ($site.Kind -eq 'Binary' -or $site.Kind -eq 'None') { $data=[Convert]::FromBase64String([string]$data) }
    if ($site.Kind -eq 'MultiString') { $data=[string[]]@($data) }
    if ($site.Kind -eq 'DWord') { $data=[int]$data }
    if ($site.Kind -eq 'QWord') { $data=[long]$data }
    $key.SetValue($site.Name,$data,$kind)
   } elseif ($null -ne $key) { $key.DeleteValue($site.Name,$false) }
  } finally { if ($null -ne $key) { $key.Dispose() } }
 }
 foreach ($entry in $before.Keys) {
  if ($entry.Exists) { continue }
  $key=[Microsoft.Win32.Registry]::CurrentUser.OpenSubKey($entry.Path,$false)
  $empty=$false
  if ($null -ne $key) { try { $empty=$key.GetValueNames().Length -eq 0 -and $key.GetSubKeyNames().Length -eq 0 } finally { $key.Dispose() } }
  if ($empty) { [Microsoft.Win32.Registry]::CurrentUser.DeleteSubKey($entry.Path,$false) }
 }
}
$restored=Capture 'restored'
if (-not (Same-Exports $before $restored)) { throw 'Restored export differs; keep all originals and report the exact remaining difference.' }
Write-Output 'Scoped dsh association restore verified. UserChoice/ACL untouched.'
