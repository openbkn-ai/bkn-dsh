# Runs "dsh plugin <args>" in the isolated npm-form env (PATH mode 'missing' + scoop current\bin for pnpm, same as the install step).
param([Parameter(Mandatory=$true)][string]$OutFile,[Parameter(ValueFromRemainingArguments=$true)][string[]]$DshArgs)
. (Join-Path $PSScriptRoot 'env-npm.ps1') -PathMode missing
$env:Path = $env:Path + ';C:\Users\kalia\scoop\apps\nodejs-lts\current\bin'
$dsh='C:\bkn-verify\diag6-tools\node_modules\.bin\dsh.cmd'
$hdr = "argv: dsh.cmd $($DshArgs -join ' ')`r`nPATH (+ scoop current\bin for pnpm): $env:Path`r`nutc: $((Get-Date).ToUniversalTime().ToString('o'))`r`n"
$out = & $dsh @DshArgs 2>&1 | Out-String
$rc = $LASTEXITCODE
[IO.File]::WriteAllText($OutFile, $hdr + $out + "`r`nexit=$rc`r`n", (New-Object Text.UTF8Encoding($false)))
"exit=$rc"
