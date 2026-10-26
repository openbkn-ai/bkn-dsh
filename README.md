# Windows frozen -32：真实业务 profile 加载与官方 rc.3 GUI 最小补证

r2独立交接，来源为冻结5e55d09。唯一代码变化：在controller原baseEnv白名单补传OS。PS/守卫、GUI/业务逻辑、冻结-32与rc.3 payload全部不变。使用本次主会话给出的新完整commit/KIT摘要，不可沿用旧5e55d09身份。

仅一个官方Windows `0.2.1-rc.3` GUI实例：新空profile内的冻结-32真实业务Service自行挂载profile层MCP，核对已挂载实例身份；观察官方窗口并正常菜单退出。合成127.0.0.1连接，不做重定向对照或工具执行。`local-development-preacceptance; ciRun=null; formalAcceptanceEligible=false`。

用户已授权主会话把本材料推到**新的独立交接分支**。该授权不包含Windows结果推送、CI、PR、tag、发布、现有Host/平台变更。固定提交和KIT摘要以主会话给出的完整值为准。

## 最小范围与原证据

- 冻结-32 tgz SHA256：`46626510825fe9146aef12c27a1724acbb455aeac22aa600358add0fc8e1c9f8`，231465字节/82文件。
- 唯一rc.3 payload：`48694ca37f889edbc7c41ed8edd3c08e3dc8c0d9cf87c6c118d96de44556d3e0`，12文件；保护入口 `b3cd7156c0b8639656ce117530fec4d006b74cafdc9a78ac426fec084e62972c`。
- 复用Windows前轮验证的官方rc.3解包目录，不运行安装器、不修改EXE/ASAR。EXE SHA256 `fd7d298f4ba03ee9bab1719a892afeaef5c09bf50c574a592a64c85f64574c0c`；原生Node24.21.0/Electron44.7.0，Cordis4.0.5/Schemastery3.18.5。安装根MCP必须仍为stock `758d8fc473b700b5d351158d06ce9f9e92c16e8b25497b08bb7bd2122a87f5dd`。
- 只从既有任务profile读取Zod4.4.3包目录，按字节复制这一项依赖；不复制home、账号、模型配置、会话、workspace、旧patch或完整运行时。新profile直接解开冻结包，非官方CLI安装复验。
- Windows前轮 `8f94288fd92ab04938decc8ad561aaac2696f2e7` 的8/8 native factory/ToolRuntime对照已经通过，不重跑。Mac第64轮已验证两后端真实业务挂载及原官方rc.3 GUI，此次只补Windows差异。

## 启动前备份与收尾恢复

官方Electron44.7.0的 [SetAsDefaultProtocolClient](https://github.com/electron/electron/blob/v44.7.0/shell/browser/browser_win.cc#L474) 写入当前用户 `HKCU\Software\Classes\dsh` 的默认值、`URL Protocol` 与 `shell\open\command` 默认值。原DSH rc.3 packaged主入口会调用该方法。

`system-association.ps1` 在**GUI启动之前**导出以下两棵小范围注册表树，或明确记录其不存在，并保存当前账号SID、三个写点的原值/类型及相关key存在状态：

1. `HKCU\Software\Classes\dsh`：完整 `.reg` 原内容和SHA256；这是实际写入项。
2. `HKCU\Software\Microsoft\Windows\Shell\Associations\UrlAssociations\dsh`：完整 `.reg` 或不存在状态，仅作只读UserChoice对照。

备份失败即禁止启动；不更改执行策略、权限或UserChoice。正常退出后先保存After，再仅恢复Electron上述三个确定写点；原先不存在且现在为空的相关key可移除，**不删除任何原有key或改ACL**。先核对当前仍等于After快照、handler仍指向本轮已核验EXE、原备份摘要及账号身份；守卫不通过即停止恢复并报告。UserChoice变化绝不强写或绕过Hash。恢复后再次导出，必须与Before相等。所有 `.reg`、账号信息和完整日志只留Windows私有证据目录。

这是一项必要的本轮保全，不是通用注册表备份/迁移工具；不导出全机、HKLM或其他协议。现有Host代码、配置及日常Chrome不动。

## 执行（仅一次GUI启动）

前轮c0fa28d8的输入、资源与profile准备已经通过；其controller漏OS导致GUI前受阻，GUI/真实业务加载/正常退出/After/Restore均未执行。不要重复诊断A/B、prepare或inspect专项、8/8矩阵等已过项。使用全新taskRoot，保留controller流程内必要的输入/准备与保全检查，然后只补原来未执行的短链路。旧taskroot-1和诊断证据不覆盖。

1. 新独立干净checkout固定提交，运行 `node kit/verify-inputs.mjs`；输出放checkout外。不得改冻结kit。
2. 在前轮 `C:\bkn-verify\021-host32-mcp-nongui-20261025-run\` 及其私有记录中定位已有官方rc.3 EXE和Zod4.4.3目录，复用任务Node24.19.0。缺资源或无法区分日常/任务路径时BLOCKED，不下载/升级/重建发行。
3. 选择不存在的新taskRoot，保持controller在后台/持续执行会话里存活，然后运行下面命令。脚本自动校验输入、建立新profile、启动前备份系统关联，再启动一次原官方GUI。stdout/stderr也写到任务外的本轮私有controller日志。

```powershell
# $taskNode: existing task Node 24.19.0; $checkout: this detached clean checkout
# $officialRc3Exe / $existingZod443: paths from the previous verified task records
# $taskRoot: new absolute path, outside checkout; must not exist
& $taskNode (Join-Path $checkout 'kit\run-gui-proof.mjs') --exe $officialRc3Exe --zod-dir $existingZod443 --task-root $taskRoot
```

4. `official-gui-started` 后，立即记录该PID的**实际UTC创建时间、EXE、子进程和相关监听**；不要把launchRequestedUtc当成真实创建时间。computer use只绑定这一个任务窗口，保留一份窗口可见记录。正常应停在欢迎页；不点击登录、API Key、模型、业务问题或设置。
5. `real-business-autoload-result` 应为PASS：三个组件active；冻结Service类身份一致；一次公开配置让其自己的MCP manager建立合成连接；随后才导入解析结果作观察，registry已有实例与manager fiber.runtime相等；物理路径位于该profile，SHA为b3cd7156。仅路径/文件存在、手动import或手动mount不足以PASS。
6. 通过原官方菜单**退出一次**，记录实际操作。controller等退出0（最多5分钟，允许正常后端收尾），随后自动保存After、受限恢复关联并逐项核对原ASAR、EXE、82/12文件和Zod。对照本轮PID/创建时间/EXE/子树/监听确认无owned残留。禁止按进程名批量结束。若正常退出失败，先记FAIL，核对身份后清理本轮树；不能把强制清理充当正常退出通过。
7. 用模板聊天回传脱敏结果与公开证据摘要，私有原件留本机；不推送结果。`summary-private.json` 不自动等于人工GUI通过，必须附窗口/菜单与owned收态观察。

如果controller中断或正常退出失败，先保留失败并按上述身份清理；仍需保存After及受限Restore时，可手工运行同一脚本 `-Phase After` / `-Phase Restore -EvidenceRoot <taskRoot\evidence\system-association> -DesktopExe <same exe>`。已有快照不覆盖、不重复Phase；有并发变化/备份缺失/守卫失败则保留UNKNOWN/BLOCKED，不猜测修复。

## 明确不增加的工作

不重跑stock/protected矩阵、重定向向量、argv/tar/闭包测试、完整UI/语言/800×600、目录、真实登录/取消/超时、B1、W-LIFE、RDP或旧报告重写。不运行真实模型、平台/MCP、G6、Function、run_code、Sandbox、BOM/CSV。正式 `192.168.50.129` 保持原样0.2.0，本轮不访问；不采用50.28或远端-11。

不构建或分发独立GUI，不加appId、签名、公证、更新服务器、安装器、迁移或账号系统。冻结-30/-31/-32、既有Host/ASAR、个人配置与数据保持。输入缺失或脚本失败留证报受阻，不擅改候选/Host/kit、不扩测或重试到偶然通过。

r2代码与第67轮本地已测修正版相同，复用5项Node子进程环境回归；没有重跑已过套件。前轮完整环境诊断仅证明Before成功，不代表After/Restore通过。r2 controller驱动的Windows备份→业务加载→GUI退出→恢复链仍待实测，必须先成功备份才允许GUI启动。保护范围仅冻结业务路径，不声称全局SDK/OAuth、旧Mac GUI、完整rc.3或最终CI候选已通过。
