# Proves the fixture npm.cmd/node.cmd resolve first, pass non-target commands to the real tools, and intercept only targets.
. (Join-Path $PSScriptRoot 'env-npm.ps1') -Root 'C:\bkn-verify\cli9\npm' -Prefix 'C:\bkn-verify\cli9\npm\Validate Prefix' -PathMode fixture -FixtureDir 'C:\bkn-verify\cli9\fixtures\bin'
$fx='C:\bkn-verify\cli9\fixtures'
function Mode($f,$v){ [IO.File]::WriteAllText((Join-Path $fx $f),$v) }
function Run($label,[scriptblock]$b){ $o = & $b 2>&1 | Out-String; "> $label exit=$LASTEXITCODE"; $o.TrimEnd() }
"PATH=$env:Path"
Run 'where npm' { where.exe npm }
Run 'where node' { where.exe node }
Mode 'npm-mode.txt' 'eacces'; Mode 'node-mode.txt' 'v23'
Run 'npm --version (mode eacces, passthrough expected)' { cmd /c npm --version }
Run 'npm install x (mode eacces, intercept expected)' { cmd /c npm install --global left-pad --prefix "C:\bkn-verify\cli9\npm\Validate Prefix" }
Run 'node --version (mode v23, intercept expected)' { cmd /c node --version }
Run 'node -e (mode v23, real expected)' { cmd /c node -e "console.log(process.version)" }
Run 'real npm-cli via node.exe (bypasses fixture)' { & 'C:\Users\kalia\scoop\apps\nodejs-lts\current\node.exe' 'C:\Users\kalia\scoop\apps\nodejs-lts\current\node_modules\npm\bin\npm-cli.js' --version }
Mode 'npm-mode.txt' 'real'; Mode 'node-mode.txt' 'real'
"Validate Prefix exists: $(Test-Path 'C:\bkn-verify\cli9\npm\Validate Prefix')"
