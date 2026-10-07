# Windows 鉴权恢复与原生回答边界复测结果

- 回传分支：docs/authentication-recovery-c91fe09-windows（本次提交，见推送输出）
- 源码 / CI / tgz：c91fe090e0aac2dc72a4ff1b3d221d72baa432ba / 37570295456 / fa168d8113e8dd43348ea4751c7e4d297049e2c1ddced9c586e6d3a1f3f0718c（165804B/65 文件）
- kit ZIP SHA/大小：E3D0E59E450F5A3D048812AB8EE65CA213CAA1791B072E71CC24C0A72CD35134 / 223708B/26 成员（下载核验通过）
- 实际版本：Desktop exe 0.2.0-rc.2（官方安装）；npm dsh 0.2.0-rc.2（diag6-tools .cmd shim）；Node v24.21.0（scoop）；OpenBKN CLI 0.1.5（真实 entry …\@openbkn\bkn-sdk\dist\cli.js，`cli-version-native.txt`）；平台 https://192.168.50.28（kit CA）
- 时间/root/profile（分时点）：初轮 2026-10-07 13:14–16:04（N0–N3/R1/N6 初采）；N4/N5 增补 16:50–16:55；18:05 补证轮（post 收态 + after-2）。roots authentication-recovery-c91fe09-desktop（desktop profile）与 …-npm4（web profile）；证据目录 C:\bkn-verify\authentication-recovery-c91fe09-evidence\；当前 Git 归档 106 文件 + 清单（初轮 91 文件，后续提交增补）

| 项 | Desktop | npm | 证据路径 / 原生输出 / 退出码 / 限制 |
|---|---|---|---|
| N0 包/加载身份（65 文件） | pass 65/65 | pass 65/65 | n0-install-identity.txt（missing/differs/extra 全 0）；verify-kit-native.txt（*>&1 全流，65 files/CI/publish=false，exit 0）；ps1-parse-check.txt 0 错 |
| N1 正常入口/诊断/真实导出 | pass | pass | 两形态均"找到 2 个网络"、单一 OpenBKN 侧栏入口、诊断七项通过、产品 UI 导出：desktop c926d0f6、npm 7959b46a（归档 OpenBKN-diagnostic-n1-*.json） |
| N2 非法 URL 拒绝与恢复 | pass | pass | `ht!tp://not a valid url with spaces` → configuration 阶段拦截 `configuration-invalid/configField=baseUrl`（desktop 0fcbd4b8、npm b70022e4）→ 恢复合法 URL 重启后 networkCount=2、无 configuration-invalid 残留（desktop 5c331485、npm fcc4e435）；npm 侧经 cleanup+run-case 独立轮 |
| N3 原生输出 fixture（8 项） | n/a | pass 8/8 | probe-prepare-native.json（probePackage=native-output-probe-20261007155100\package，与 --plugin 实参一致）；native-output-runtime.jsonl 八场景显式 passed（native-answer-no-arbitration/headerless-output/scientific-notation-structure/native-tool-error/cross-network-denied/before-start-denied/excluded-tool-denied/unbound-unaffected）；两次 node exit 0 |
| N4 原始 BOM 题 | not-run（desktop 未测） | **一级结构事实 pass；二级/全量未验证** | N45-SUMMARY.md + n4-answer-snapshot.txt：native completed 51s/1 轮 10 步/零纠错；L1=9 项与 main-only oracle 逐项一致；**二级数量 14/4/10/3 与 main-only oracle 不同（或为含替代料口径，未独立证实，见 N45-SUMMARY 修正）**；全量 507 行/408 编码未逐行独立复核；判定口径与 N45-SUMMARY.md 修正版一致（一级 pass、二级/全量待完整 oracle）；用户在隔离 Host 配置 DEEPSEEK_API_KEY 后执行 |
| N5 原始销售订单题 | not-run（desktop 未复跑） | **pass** | N45-SUMMARY.md + n5-answer-snapshot.txt：native completed 39s/零纠错/溯源 int_cc25247f；**40 条/仅已确认/SO0000001-20+SO0000501-520 无区间外/product_code 口径正确**（页面快照独立解析 40 行核对）；6 行签约≠交付如实列出 |
| N6 用户内容 SHA/终态 | pass | pass | 选定文件哈希：before 37 / after（16:04）**37/37 一致**；N4/N5 后重采 **37/37 仍一致**（n6-user-state-after-2.json，18:05）；收态（各时点）：16:04 与 18:05（n45-post-residual-check.json）均零残留——**结论限采集时点与选定清单**。owned PID 档案见 PROCESS-RECORDS-STATUS.md：8 个 pid 原件在档、R1 两形态有原生停止全流，**其余停止输出与 npm children 原件缺失 → 历史停止原生档案不足（insufficient-evidence），与"选定文件哈希/收态通过"分列** |
| R1 MCP 401 → 产品 CLI 登录 → 同 Host 恢复 | pass | pass | fixture（auth/openbkn-auth-fixture.mjs 经 shim.cmd）仅拦截 `auth token` 注入公开无效串、原 store 保留；故障报告 desktop 7c619431 / npm 13cb6741（context-loader/auth-rejected/httpStatus=401）；面板显示"使用 OpenBKN CLI 登录并同步"并完成真实 CLI 设备授权（仅真实 login exit 0 自动清 flag）；同 Host 恢复 desktop 8228b264 / npm 8f07c6a5（七项通过，recovered=true 保留历史）；故障 patch 字节备份/精确还原（r1-*-patch-sha.txt，exact=True） |
| E1 旧回传补正 | 完成 | 完成 | E1-OLD-EVIDENCE-CORRECTIONS.md：7 项逐条（dshApps=6 撤回零残留/8h ticks=启动器时区偏差未完全定责/A3 不延伸 B 批且 37/37（16:04 与 18:05 两时点）/复制 store 收窄+token 重复失效重登恢复原因未证实/B3 `*` 差异定责缺原件收窄/F01 属性 op 独立核验缺失撤回全闭环/B4 改插件边界拒绝措辞） |

## 单独列出的证据

- verifier 全流：verify-kit-native.txt（含"Kit identity verified: … 65 files, CI 37570295456, publish=false"与续行，内容非空）
- probe：prepare argv/输出（probe-prepare-native.json + probe-prepare-stderr.txt 空）、probe stderr 空、probePackage 路径匹配；**两次 exit 0 为操作者会话记录、非独立原生档案（命令脚本 n3-command-provenance.sh 已存档）→ native 退出码档案不足**；JSONL/prepare JSON 完整 SHA-256 见 REPORTS-MANIFEST.md
- 产品 JSON 原件：**11 份 / 10 个唯一 reportId**（7c619431 两份副本字节相同：r1-desktop-fault-report.json 与 OpenBKN-diagnostic-20261007T052241390Z-7c619431.json）；归档绝对路径前缀 C:\bkn-verify\authentication-recovery-c91fe09-evidence\；npm IAB 下载以 .tmp 落盘、按 reportId 归档（.tmp 原件已被浏览器下载生命周期清除，归档副本即捕获字节；逐件来源表见 REPORTS-MANIFEST.md）
- daily 文件：before 37 记录（a6c9459 清单复用，scope 语义注明）/ after 37/37 一致（内容哈希级）
- owned PID：r1-desktop-host.pid 4384、r1-npm-host.pid 19648（这两个有 r1-*-finish.txt 原生停止全流）、n1 系 22756/21048/2952、n2 系 21268/11000、n45-npm-host.pid 7792；**npm 各轮 children pid 原件已被 cleanup 消费、副本未存 → 缺失不补造**；n1/n2/n45 停止为脚本或内联身份核验（脚本原件在档），**原生停止输出未归档 → insufficient-evidence，详见 PROCESS-RECORDS-STATUS.md**；pid ticks 记录方式已修正（Win32_Process CreationDate UtcTicks）
- 受控 patch：仅 desktop/web profile 的 openbkn-business-context row（baseUrl/cliPath），原字节备份（r1-*-patch-original.yml / dn-desktop-patch-original.yml）并精确还原；未触碰日常 profile
- 执行偏差：①外层 *>&1 与 kit 内 $ErrorActionPreference='Stop' 冲突（dsh stderr "initialized profile web" 被中断）→ kit 脚本改由子进程 powershell -File 执行（kit 未改），npm/npm2/npm3 三个半成品 root 留档未删；②desktop R1 一次授权超时轮（CLI 120s 先于浏览器完成）如实保留，flag 未清即未通过，重试轮通过；③npm4 store 两次重复失效、密码重登恢复（时序与同账号他端登录相关）；归档的 auth-status 原件均为 expired=false，失效时点的 expired=true 为操作者会话观察、无时间化原件 → **原因未证实，不写"互踢实证"**；④desktop 首次 N1 patch cliPath 误写 dist\cli.js（不可执行）→ 面板"无法验证"，改 openbkn.cmd 后通过（测试配置笔误，非候选缺陷）
- 残留：N6 终态（16:04）node=0、DSH exe=0、端口 18267/18268 空；N4/N5 后（18:05）node=0、DSH=0、18267/18268/18269=0（n45-post-residual-check.json）；auth-fault 仅剩 shim.cmd（flag 均由产品真实登录自动清除）
- 补证轮新增：PROCESS-RECORDS-STATUS.md（进程档案状态）、n6-user-state-after-2.json + n6-final-residual-check-2.json（N4/N5 后重采）、n45-post-residual-check.json（18:05 收态）、remediation-scan-script.ps1（重采脚本）、REPORTS-MANIFEST.md（v2：完整 SHA-256、本地 vs Git blob、逐件来源表）

事实正确、原生 completed、fixture 通过、真实 UI 导出四类证据分列如上；N4/N5 初始因无模型凭据如实 not-run（撰写时点）；当日傍晚用户在隔离 Host 配置 DEEPSEEK_API_KEY 后 npm 形态补测 pass（N45-SUMMARY.md，增补 commit），desktop 仍未测。未修改候选/helper/main；未发布/tag/dist-tag。
