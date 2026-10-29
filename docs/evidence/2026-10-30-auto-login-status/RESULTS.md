# 登录成功状态最小修复（2026-10-30）

本地针对性验证通过；Windows `0.2.1-rc.3-openbkn.0.2.1-auto.local.2` 现场复验未执行。`ciRun=null`、`formalAcceptanceEligible=false`。固定修复源码 `dbf53d329eae704e580e555f9da37f7c05a8111a`，基于bde72db文档交接与93f3e85产品实现；原源码/ea6be318归档、Windows fa6e2fb报告及其首次异常保持。

## 复现事实与未知

Windows公开报告fa6e2fbe4cf552960fa1d8b8b7ae7549990c8089的8个Git blob已核对；报告的授权、实例与目录/重启复用结果保留，但其“授权后等待文本>5分钟，重开才显示”是本轮未收敛异常。59项manifest为Windows原件摘要，本轮未取回私有原件。公开脱敏报告SHA为bcba144f4c6225fddbc59da1cfa29d4caa9fc20ed254abbd4f268b6f1a2116c3，与manifest所记私有原稿不同，不能声称两者逐字节相等。

普通完成的冻结包/官方rc.3 selector检查能直接更新，未在Mac复现Windows原现场。受控引入carrier迭代器清理延迟后，原生rc.3 ClientStreamHandle与冻结打包consumer复现：已交付verified目录，但for-await return等待iterator.return，调用方继续等待。真实句柄dispose已被调用；原打包controller/overlay配官方selector仍显示等待。此条件明确注入，不等于已证明Windows现场发生了同一原因。

## 最小修复与结果

只将一次性流改成单次next读取；缺少结果仍拒绝，finally仍调用原生dispose，取消signal及之后的auth验证不变。没有轮询、自动重试、刷新按钮代点、Host/TLS/CLI/认证或业务语义改动。修复包为 `0.2.1-rc.3-openbkn.0.2.1-auto.local.2`，259297字节、94文件，SHA `96dc62d7ef9bded5ca45861a9d8d5e0f627f30a365a38590d7cbb541a9867571`；与原包仅lib/client.js和package.json不同，92项相同。

- 新的打包consumer回归4项：旧包1 FAIL/3 PASS；修复后4 PASS。旧失败日志保留本机。
- 登录进度、取消、超时、认证拒绝/错平台及迟到结果等9项，加上述4项，共13 PASS。
- 同一官方rc.3句柄、官方selector绑定及真实打包React UI：延迟清理条件下，修复前等待、修复后成功和目录立即可渲染；未关闭或刷新面板。
- build、typecheck、package audit通过（94文件）；不重跑全套G6/既过矩阵。
- 原官方Mac rc.3 GUI在全新task profile安装该tgz，94/94匹配；官方CLI0.2.0+仅127.0.0.1合成设备授权，授权由夹具完成，当前面板直接显示成功与一个合成网络。不是新的真实账号验收；未配置模型或发业务tools/call。Host proof为PASS、类/三组件/包内MCP身份正确。
- 官方GUI正常Quit实际exit0；ASAR摘要不变、deep/strict签名有效，URL关联仅dsh时间戳变化，current==After/缓存守卫后恢复Before逐字节相同；owned进程/合成端口收净。

GUI夹具控制器stdin关闭，无法接收finish命令；GUI已正常exit0后按命令/创建身份仅终止fixture控制器。请求汇总未写出，记不可用，不重启GUI补日志；既有AX、截图、安装/proof和退出原件保留。首个探针缺react-dom、首次测试从workspace根缺tsx均为验证工具适配失败，原日志保留，未改产品/依赖来迁就。

## 边界及交接

本轮只读上游：DSH f3803c96974ad4a94195fb97e5c637e9c2a3afe3（测试仍rc.3），SDK fb6f228c7b33aac6227737425c78b60a519c6578，Foundry 7f846a1576c014131db4174e57c826e9f2107b2e（正式平台仍0.2.0）。未升级pins或部署；本轮不迁移工具契约。

Windows只补一次当前面板的真实授权自动完成、以及必要的安装身份/正常退出/关联恢复，不重跑取消、重启、G6或全UI。原5分钟异常的唯一根因仍UNKNOWN；若修复后现场仍卡住，留AX/截图/现有错误并停止，不用重开刷新改判。见[Windows交接](../../handoff/2026-10-30-auto-login-status-windows/README.md)。本次仅授权验证后独立分支推送；不建PR、不跑CI、不发布、不动latest、现有Host或正式0.2.0。
