# 无副作用继承探针：新 PowerShell(-NoProfile -NonInteractive) → 新 Node
# 仅输出两个子进程实际读到的 NODE_EXTRA_CA_CERTS、Node 版本与可执行路径、进程身份
$ErrorActionPreference = 'Stop'
$result = [ordered]@{
  probeKind = 'child-chain-inheritance'
  atUtc = (Get-Date).ToUniversalTime().ToString('o')
  powershellPid = $PID
  powershellExe = [System.Diagnostics.Process]::GetCurrentProcess().MainModule.FileName
  psNodeExtraCaCerts = if ($null -eq $env:NODE_EXTRA_CA_CERTS) { 'UNSET' } elseif ($env:NODE_EXTRA_CA_CERTS -eq '') { 'EMPTY' } else { $env:NODE_EXTRA_CA_CERTS }
}
$nodeJson = & node -e "const o={nodePid:process.pid,nodeVersion:process.version,nodeExe:process.execPath,nodeExtraCaCerts:(process.env.NODE_EXTRA_CA_CERTS===undefined?'UNSET':(process.env.NODE_EXTRA_CA_CERTS===''?'EMPTY':process.env.NODE_EXTRA_CA_CERTS))};process.stdout.write(JSON.stringify(o))"
$result.node = ($nodeJson | ConvertFrom-Json)
$result | ConvertTo-Json -Depth 4 | Write-Output
