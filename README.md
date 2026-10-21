# Windows 远程会话交接：0.2.1 开发预验 / 固定 -27

本分支只交付可直接安装的插件候选及 Windows 运行材料。它没有完整开发源码、Actions 工作流、CI 产物身份或发布标签；不能从交接 commit 重建插件，也不替代最终验收合同。开发分支和本机正式 OpenBKN 0.2.0 保持原状态。

## 取得固定输入

以下命令须等主会话确认交接分支已推送后再运行。目标目录必须不存在；不要覆盖已有工作区。

```powershell
git -c core.autocrlf=false clone --single-branch --branch handoff/windows-local27-20261022 https://github.com/openbkn-ai/bkn-dsh.git C:\bkn-verify\021-local27-kit
if($LASTEXITCODE -ne 0){throw 'Handoff clone failed'}
$taskKit='C:\bkn-verify\021-local27-kit'
git -C $taskKit rev-parse HEAD
if($LASTEXITCODE -ne 0){throw 'Cannot read handoff commit'}
```

把 `HEAD` 与主会话单独提供的**完整交接 commit**比对；确认一致后再继续。该 commit 只固定交接内容，源码基点仍为 `933b0ab251c75461ece1ada6145a9487e7eb04d1` 加本地未提交修改。插件实际身份是 `0.2.0-rc.2-openbkn.0.2.0-27`，SHA256 `5a24a54fa327f04c79884b8303d44d0b2f0bae69e844169c31d28a69af832aef`，229683 字节、82 文件。CLI 是正式 npm `@openbkn/bkn-sdk@0.2.0`；逐文件与注册表摘要由校验器验证。

在新的专用 PowerShell 窗口执行，不修改全局 PATH、用户 CA、个人 DSH 或 CLI 配置。Node 必须是 `24.19.0`，需要 Git 和系统 `tar`；如未具备，先报告缺项。

```powershell
$ErrorActionPreference='Stop'
if((node --version) -ne 'v24.19.0'){throw 'Node 24.19.0 is required'}
node (Join-Path $taskKit 'verify-kit.mjs')
if($LASTEXITCODE -ne 0){throw 'Handoff bytes or candidate verification failed'}
```

`.gitattributes` 禁止换行转换，确保 Windows checkout 不改变摘要。候选清单保持原始身份，`ciRun=null`、`formalAcceptanceEligible=false`。任何摘要不一致均停止，不能修改清单凑通过。

## 先检查 Windows 到正式平台的路径

本机平台固定为 `https://192.168.50.129`。Windows 必须位于可达该地址的网络或现成 VPN；不要改成历史平台、暴露公网或自动替换服务。当前平台保持正式 0.2.0，保留数据和配置。

```powershell
Test-NetConnection 192.168.50.129 -Port 443
$env:NODE_EXTRA_CA_CERTS=Join-Path $taskKit 'openbkn-local-ca.pem'
$taskTlsProbe=@'
import https from 'node:https';
const req=https.get('https://192.168.50.129/',res=>{
  console.log(JSON.stringify({tlsAuthorized:res.socket.authorized,status:res.statusCode}));
  res.resume();
  if(!res.socket.authorized)process.exitCode=1;
});
req.setTimeout(10000,()=>req.destroy(new Error('TLS probe timed out')));
req.on('error',err=>{console.error(err.message);process.exitCode=1;});
'@
node --input-type=module -e $taskTlsProbe
if($LASTEXITCODE -ne 0){throw 'Platform TLS is not ready; report blocked'}
```

TCP 成功仅证明端口可达；TLS 成功仅证明该进程认可服务器证书。HTTP 200/302/401 等均不能替代 CLI 登录或业务验收。随包证书只有公开 CA；不含私钥，也不允许关闭证书验证。浏览器信任未就绪时单独记录，不能把 Node 成功当成浏览器已通过。

继续前，在本窗口清空可能继承的凭据覆盖项；不读取或输出其原值。窗口关闭即结束这些进程级设置。

```powershell
foreach($taskName in @('BKN_TOKEN','BKN_BASE_URL','BKN_USER','BKN_PROFILE')){
  [Environment]::SetEnvironmentVariable($taskName,$null,'Process')
}
```

## 执行与回传

1. 阅读 [HANDOFF.md](HANDOFF.md)、[G6-BLOCKERS.md](G6-BLOCKERS.md)，按固定旧/新 Host × Desktop/npm 四组合执行。独立 home、CLI 配置和 evidence 目录必须与 checkout 分开。
2. 独立登录须通过正常浏览器流程，不复制本机管理员 token、模型 Key 或其他个人配置。记录实际安装及加载版本、插件 82 文件比对、签名/闭包和运行进程；未采集的加载版本保持未知。
3. 首轮执行登录、UI、目录选择、诊断导出等不需要业务模型/Sandbox 的项目。B1 的真实模型查询、标准交期及恢复回合，只有在 Windows 已验证完整工具目录下的执行前阻断后才可运行；本分支没有交付或验证该阻断器。
4. Function、run_code、CSV 和完整 BOM/G6 仍为 blocked；保持正式平台不替换。不能删除工具、改题、写死答案或反复重试以制造通过。
5. 复制 [RESULTS-TEMPLATE.md](RESULTS-TEMPLATE.md) 到 checkout 之外的私有结果目录逐项填写。保留原失败和前后文件摘要；只结束本轮 owned 进程。
6. 回主会话时先给去秘密、去业务明细的结果摘要、各证据 SHA、交接 commit、候选 SHA、Windows/Host/插件实际版本。原始凭据、日志及业务明细留在 Windows 私有目录；本公开分支不得提交这些材料。当前没有授权 Windows 会话推送结果、触发 CI、开 PR、打标签、发布或部署。

[WINDOWS-TASK.md](WINDOWS-TASK.md) 可作为 Windows 会话的执行任务说明。这里的本地校验通过不代表原生 PowerShell、Desktop 或完整验收已经通过。
