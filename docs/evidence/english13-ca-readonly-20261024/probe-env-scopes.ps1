$ErrorActionPreference = 'Stop'
# 只读：NODE_EXTRA_CA_CERTS 三作用域分列读取（仅此一个变量）
$result = [ordered]@{
    probeKind = 'env-scopes-readonly'
    atUtc = (Get-Date).ToUniversalTime().ToString('o')
    process = $null
    user = $null
    machine = $null
}
$p = [Environment]::GetEnvironmentVariable('NODE_EXTRA_CA_CERTS', 'Process')
$result.process = if ($null -eq $p) { 'UNSET' } elseif ($p -eq '') { 'EMPTY' } else { $p }
$u = [Environment]::GetEnvironmentVariable('NODE_EXTRA_CA_CERTS', 'User')
$result.user = if ($null -eq $u) { 'UNSET' } elseif ($u -eq '') { 'EMPTY' } else { $u }
$m = [Environment]::GetEnvironmentVariable('NODE_EXTRA_CA_CERTS', 'Machine')
$result.machine = if ($null -eq $m) { 'UNSET' } elseif ($m -eq '') { 'EMPTY' } else { $m }
$result | ConvertTo-Json | Write-Output
