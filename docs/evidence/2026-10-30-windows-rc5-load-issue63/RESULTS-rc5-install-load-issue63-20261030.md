# Windows rc.5 安装/实际加载 + #63 最小补证（2026-10-30）

kind=windows-rc5-install-load-issue63-supplement；ciRun=null（本轮未跑 CI）；sourcePublishRun=41041515570。
结果：**A 项 PASS；B 项用户可见行为 PASS、Remote 品牌/阶段 UNKNOWN（现成观察面无记录，按停止条件停止）。#62 未触碰。**

## 一、固定身份

- 参考提交：detached checkout `C:\bkn-verify\rc5-aa0c43f-checkout` @ `aa0c43f7e8e45249da312768d458cc9452ca05b2`（"admit newer DSH versions without an upper bound #117"），首尾 git status 干净；其 `docs/handoff/2026-10-29-auto-login-windows/system-association.ps1` SHA256 `d5c874cb…`（与历轮同字节）。
- 插件：`@openbkn/dsh-business-context@0.2.1-rc.3-openbkn.0.2.1-2`，Release v0.2.1-rc.3-openbkn.0.2.1-2 下载 tgz SHA256 `6ce96d5b…`（258478B ✓）、PUBLISHED-FILES.json SHA256 `3a8f5f47…` ✓（任务书双哈希精确一致）。
- 官方 rc.5 安装器：下载 289408544 字节（尺寸精确一致）；SHA512-base64 程序化比对与任务书 feed 身份逐字符一致；Authenticode **Valid**（Hangzhou DeepSeek Artificial Intelligence Co., Ltd.，GlobalSign GCC R45 EV CA 2020，至 2027-09-01）。7-Zip 两段解包（未运行安装器）：EXE FileVersion=**0.2.1-rc.5**（SHA256 `7ae939b5…`）、asar 602 处 `0.2.1-rc.5` 串（SHA256 `e1b6f25f…`，首尾一致）。
- 任务根：`C:\bkn-verify\rc5-load-issue63-run-20261030-1939\`（新 DSH_HOME、desktop profile、Electron user-data、空 BKN_CONFIG_DIR；真实用户环境变量保留；未复制凭据/模型配置/会话/workspace/旧 patch）。

## 二、A 项：安装与实际加载 — PASS

- **安装**：rc.5 App 自带 `resources\runtime\cli\bin\dsh.cmd`（经 App exe run-as-node + dsh-desktop-host cli.js；runtime versions.json node 24.21.0/pnpm 11.28.5）执行 `plugin --profile desktop add <固定tgz>`，**exit=0**，完整日志+peer 警告（"[WARN] Issues with peer dependencies found"）留档 private/plugin-add.log；无版本豁免、无严格检查关闭、无手工 companion。
- **94/94**：以本轮 Release 的 PUBLISHED-FILES.json 逐文件核对（sha256+bytes）安装目录：94/94 全对、无多余文件（results/verify-published-installed.json）。
- **启动**：PID 11392，CIM 创建 2026-10-30T11:44:40.045Z，EXE=任务 rc5-app 副本，文件日志重定向（results/gui-identity.txt）；欢迎页"添加 API Key→稍后配置"进入（未配置模型、未登录 OpenBKN、无模型回合）。
- **实际加载（现成只读运行时检查）**：OpenBKN 面板→诊断，被动采集报告号 **3a62f24a**（2026/10/30 19:48:36）：三组件全部 **通过/component-loaded**（host-runtime 实测）——bootstrap-entry（installation，entryPresent=true）、business-entry（component，entryPresent=true）、diagnostics-entry（diagnostics，schemaVersion=1）；插件（磁盘）=0.2.1-rc.3-openbkn.0.2.1-2；插件（已加载）版本字段=未采集（报告自身如实标注"磁盘版本不代表当前已加载版本"；结合 94/94 逐字节匹配，磁盘内容即 -2）。configuration/pending:cli 两项"未执行/configuration-required"=未配置预期态。
- **面板入口**：打开显示 F0 平台地址表单（"先填写 OpenBKN 平台地址，再使用本机 OpenBKN CLI 登录"），设置/诊断按钮可用——**无版本准入拒绝、无模块加载异常、无共享依赖冲突**（rc.5 被准入与 aa0c43f 的 #117 上限放宽一致）。本轮未登录为预期。
- 诊断报告"导出诊断报告"按钮在 A 实例点击两次均无对话框/落盘（rc.5 表现，已记录；不影响判定，证据以诊断视图截图+AX 全文留档）。

## 三、B 项：#63 证据

### 3.1 旧证据（只读复用，判定不足）

- `docs/evidence/first-use8-20261008/windows/f7-badimport-notes.md`（会话 3，2026-10-09）：F7 Variant B/D 记录了 UI 通用提示（"暂时无法验证…"）、诊断分类、恢复步骤；诊断 JSON `OpenBKN-diagnostic-20261009T064710448Z-fa344603.json`（SHA `9223fd88…`）：business-entry **fail / stage=component / code=module-resolution-failed**。
- **判定：不足以覆盖 #63 缺口**——旧原件只有诊断分类（任务明示不得当作 Remote 拒绝品牌），无 Remote 实际拒绝 code/品牌/阶段，亦无与回归测试的错误形状对照。

### 3.2 追加一次隔离故障场景（许可内，已执行）

- 正常退出 A 实例（应用菜单→退出）后：robocopy 复制已核验 -2 安装为独立故障 home（`home-fault\`），原 tgz/正常 profile/官方 Host 不动；按 `exports['./business'].default=./lib/business.js` 定位业务入口，仅在故障副本该文件头部追加一行 `import './__task_fault_missing_module__.js'`；原文件备份 private/business.js.original；SHA256 前 `14c08020…` / 后 `d060c98c…`（private/business-fault-shas.txt）；标明任务故障变体，非发布包。独立 user-data-fault 启动一次（PID 30152，创建 2026-10-30T11:56:40.407Z）；无真实凭据、未访问正式平台、无新 fixture 服务。

### 3.3 实测结果

- **UI 中性提示（用户可见行为）PASS**：面板显示"**暂时无法验证 OpenBKN 连接，当前原因尚未确定。请点击右上角"诊断"查看检查结果；若问题持续，请导出报告交给支持人员。**"+重试按钮——**不含"检查 Token"/"平台地址"猜测**，引导去诊断/导出。与 aa0c43f 回归 `openbkn-ui-controller.test.ts` 用例 "directs unavailable RPC and unknown connection failures to diagnostics without guessing credentials" 的断言一致（消息 match /诊断/、doesNotMatch /检查 Token|平台地址/）。
- **组件保留性 PASS**：诊断报告 **38bfb050**（2026-10-30T11:59:07.493Z，已导出至 evidence/OpenBKN-diagnostic-fault-38bfb050.json）：bootstrap-entry 通过、**business-entry 失败 component/module-resolution-failed**、diagnostics-entry 通过——业务失败而 bootstrap/diagnostics 保留，与 F7 fa344603 形状相同（旧证据形状得到 rc.5+-2 现场复现）。
- **Remote 实际拒绝 code/品牌及阶段：UNKNOWN**。现成观察面用尽：诊断 JSON 只含 module-resolution-failed（诊断分类）；fault-stdout.log 仅 275B 例行输出、fault-stderr.log 0B；user-data 无 crash/前端错误日志；DevTools/Node inspector 按任务禁令未开启。业务坏导入下 business 入口未加载，无 Remote 调用发生，Host 侧未产生独立 Remote 拒绝记录。
- **与回归对应**：UI 行为符合回归意图（中性引导）；实测错误形状（module-resolution-failed @ component 阶段 → 渲染层中性消息）**不在**该回归注入的三种失败（`gateway/definition-unavailable`、未分类 Error、undefined）覆盖之内——单独报告，不据此宣称原验收标准全部满足；#63 关闭与否由主会话审核。

## 四、退出、恢复与保全

- **rc.5 关闭行为新发现**：窗口 X/Alt+F4 触发"正在运行的任务不会中断，可在系统托盘中重新打开窗口"（dsh-app://shell/update-dialog.html，确认=收进托盘）——**X 不是退出**；真正退出路径为应用菜单→退出。A 实例与故障实例均经应用菜单正常退出；进程树全净（ROOT-GONE/ALL-CLEAN/NO-TASK-PORTS）；退出码未捕获=UNKNOWN。
- **注册表**：After **unchanged=False**——rc.5 GUI 运行写入了 dsh handler（与 rc.3 轮 unchanged=True 不同，为 rc.5 实测行为差异）；Restore 验证通过（"Scoped dsh association restore verified. UserChoice/ACL untouched."），四相留档。
- **故障副本恢复**：business.js 由备份还原，SHA 回到 `14c08020…`；正常与故障两处安装均重新核对 **94/94**（results/verify-published-final.txt）。
- **首尾摘要**：tgz `6ce96d5b…`、EXE `7ae939b5…`、ASAR `e1b6f25f…` 未变；checkout 40fe… 不适用（本轮 aa0c43f）干净。旧任务/旧证据全部保留；无个人状态前置快照，不声称个人目录逐字节未变。未推送/PR/CI/tag/发布/latest；#62/#93/#97/#2573 未动；豁免矩阵全部未跑。

## 五、逐项判定

| 项 | 判定 |
|---|---|
| rc.5 安装器身份（SHA512+Authenticode+两段解包+EXE/ASAR 版本） | PASS |
| -2 原生安装（exit=0、peer 警告留档、PUBLISHED-FILES 94/94） | PASS |
| 三组件实际加载（运行时诊断 3a62f24a 全 component-loaded） | PASS |
| 面板/诊断入口可用、无版本准入拒绝（未登录预期） | PASS |
| #63 旧证据复用（F7 notes + fa344603） | 完成（判定不足） |
| #63 故障场景（一次；UI 中性提示；bootstrap/diagnostics 保留） | PASS |
| Remote 实际拒绝品牌/阶段 | UNKNOWN（现成观察面无记录，按停止条件停止） |
| 正常退出/进程/端口/关联恢复/保全 | PASS（退出码 UNKNOWN；After unchanged=False 已如实记录并恢复） |

## 六、UNKNOWN 汇总

1. Remote 实际拒绝 code/品牌/阶段：UNKNOWN（现成观察面无；未开 inspector）。
2. 两次 GUI 退出码：UNKNOWN（未捕获；进程树以 CIM 核实全净）。
3. 插件（已加载）运行版本号：诊断报告自身"未采集"（component-loaded 即加载事实；磁盘 94/94=−2）。
4. A 实例诊断导出按钮无响应原因：未追查（故障实例同按钮工作正常并已导出）。

## 七、产物清单（脱敏，私有原件留任务根）

见 results/evidence-manifest.json。关键项：诊断视图截图+AX（A 实例 3a62f24a；故障实例 38bfb050 + 导出 JSON）、fault-panel 截图+AX、business-fault-shas.txt、verify-published×3、gui/fault-gui-identity、exit-sweep、authenticode.txt、prelaunch/final digests。
