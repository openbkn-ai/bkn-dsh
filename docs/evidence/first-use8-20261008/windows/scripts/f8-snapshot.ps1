# F8 hash-chain snapshot of user-owned state for one form root (paths + SHA only, no content).
param([Parameter(Mandatory=$true)][string]$Root,[Parameter(Mandatory=$true)][string]$Profile,[Parameter(Mandatory=$true)][string]$Label)
$ErrorActionPreference='Stop'
$ev='C:\bkn-verify\first-use8-evidence'
$home_=Join-Path $Root 'dsh-home'; $prof=Join-Path $home_ "profiles\$Profile"
$files=@()
$files+=Join-Path $prof 'cordis.patch.yml'
$files+=Join-Path $home_ 'storages\openbkn_workspace_bindings.json'
$files+=Join-Path $home_ 'storages\workspace.json'
if(Test-Path (Join-Path $home_ 'openbkn\session-bindings')){ $files+=@(Get-ChildItem (Join-Path $home_ 'openbkn\session-bindings') -File -Recurse | % FullName) }
if(Test-Path (Join-Path $Root 'workspaces')){ $files+=@(Get-ChildItem (Join-Path $Root 'workspaces') -File -Recurse | % FullName) }
if(Test-Path (Join-Path $Root 'bkn-config')){ $files+=@(Get-ChildItem (Join-Path $Root 'bkn-config') -File -Recurse | % FullName) }
$rows=foreach($f in $files){ if(Test-Path -LiteralPath $f){ [ordered]@{path=$f; sha256=(Get-FileHash -LiteralPath $f -Algorithm SHA256).Hash.ToLowerInvariant(); bytes=(Get-Item -LiteralPath $f).Length} } else { [ordered]@{path=$f; sha256=$null; bytes=$null} } }
$pkg=Join-Path $prof 'package.json'
$deps=(Get-Content -Raw $pkg | ConvertFrom-Json).dependencies
$plugDir=Join-Path $prof 'node_modules\@openbkn\dsh-business-context'
$pnpmOpenbkn=@(Get-ChildItem (Join-Path $prof 'node_modules\.pnpm') -Directory -ErrorAction SilentlyContinue | ? Name -like '@openbkn*' | % Name)
$out=[ordered]@{label=$Label; at=(Get-Date -Format o); root=$Root; profile=$Profile; files=$rows;
  profilePackageJsonSha=(Get-FileHash $pkg -Algorithm SHA256).Hash.ToLowerInvariant(); dependencies=$deps;
  pluginDirPresent=(Test-Path $plugDir); pnpmOpenbknEntries=$pnpmOpenbkn}
$json=$out | ConvertTo-Json -Depth 6
[IO.File]::WriteAllText((Join-Path $ev "f8-$Label.json"),$json,(New-Object Text.UTF8Encoding($false)))
$json
