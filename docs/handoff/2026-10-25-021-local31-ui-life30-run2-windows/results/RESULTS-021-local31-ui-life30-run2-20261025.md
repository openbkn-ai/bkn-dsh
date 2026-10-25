# Windows 0.2.1 最小补证结果（run2 终版，2026-10-25，含 L0/W-LIFE/U1 登录执行）

kind=local-development-preacceptance；ciRun=null；formalAcceptanceEligible=false。本轮不提交、不推送、不跑 CI、不开 PR、不打 tag、不发布；正式平台 https://192.168.50.129 / OpenBKN 0.2.0 未替换、未部署；未采用 -11/-32/rc.3；DSH/SDK/冻结包/helper 未修改。**-31 候选包含此前的焦点/Escape 行为修复（useDialogFocus 等）；相对 -30 的 delta 为纯 locale 增量——两种表述并存，不以"纯 locale、无行为改动"单独描述候选。**

## 固定输入核对

- checkout：`C:\bkn-verify\021-local31-ui-life30-20261024-235238`，detached `d20a266fa550dd854c9bd7d30bd04c088de9bbfe`（干净）；KIT-FILES `61bace60…`；ui31 tgz `22ba0e17…`；lifecycle30 tgz `6d95ff75…`；两 helper 均 `0e3466f3…` 未改。任务 Node 24.19.0。

## 逐项结论

| 子项 | 候选/Host | 结论 | 说明/证据 |
|---|---|---|---|
| L0 用户确认当前日常 Chrome | -30/-31 | **PASS（有记录偏差）** | 用户声明"已打开日常chrome"（补证指令后）→ 只读枚举得**唯一**根 PID 12416（PPID 2464/explorer，UTC 2026-10-25T05:18:00.419Z 创建，官方路径 exe）。任务书要求的第二次显式关联确认（AskUserQuestion）未获回复，判定依据改为：用户声明+唯一根+创建时间吻合+官方路径；登录授权页本身在用户浏览器完成（最终同意权在用户侧）。旧 11368 未沿用；未读命令行/历史/Cookie |
| W-LIFE L1 登录前 carrier 可观察性 | -30 | **BLOCKED（含两次登录全程实证）** | 用户批准的改口径执行：DevTools **预开**于登录前（Network 录制中）。两次登录实测（05:54 与 06:45 两次点击、授权、成功全程）**页面 DevTools 始终为空**——mux 流属于 CLI 进程与平台的连接，页面上下文在任何阶段都看不到。L1 判定维持 BLOCKED：插件页 DevTools 不是该 carrier 的观察面（流帧摘录需 CLI 侧手段，超出本轮授权） |
| W-LIFE L2 一次登录时间线 | -30 | **PASS（有覆盖限制：进程/面板时间线完整；WS 帧级摘录不可及——已实证属 CLI 侧连接）** | **登出+重登条件重建（用户授权"重新创建条件再执行"）**：任务 CLI `auth logout`（hasToken→false，`evidence\WL-A4-logout-private.txt`）→ -30 A4 Desktop（PID 28684，06:39:18.179Z，登出态启动、登录入口在）→ 采样器 WL-A4b + DevTools 预开 → 点击登录 06:45:54.090Z → **链 06:45:54.18/21Z（descOfRoot）** → **浏览器交日常根 12416（06:45:54.62-99Z chrome 子进程，无新根）** → 用户当场完成授权 → **面板"登录并同步成功"（点击后约 20 秒）** → 后续同步/状态链 06:46:04-06:46:06 全部退出 → **T0+30s runner/CLI 均未存活 → 无需延至 60 秒** → close/reopen 一次：仅短状态链（06:47:48-49），无新登录链、面板保持登录态 → 凭据落盘：state.json 14:46 本地刷新（CLI 新布局，内容未读）→ 菜单退出 1 次未生效 → 未改 stop-owned-host.ps1 四重核对收树（0 残留）。采样器：`private\timeline-WL-A4b.jsonl`（77 行）+ 脱敏摘要 `evidence\WL-A4b-timeline-redacted-summary.txt` |
| W-LIFE L3 close/reopen 与正常退出/Chrome 状态 | -30 | **PASS（有覆盖限制）** | close/reopen 一次：面板关闭→重开→"正在连接"→回到登录态网络列表（无登录按钮、无新登录链）；正常退出：菜单退出 1 次点击未生效（该实例菜单交互异常，与此前数例一致，已记录）→ 按授权用未改 stop 脚本收树；Chrome 根 12416 全程存活、创建时间不变 |
| W-LIFE L4 Job 成员/因果 | -30 | UNKNOWN/BLOCKED | 无现成可靠入口；采样器仅 IsProcessInJob(NULL) 布尔（不持有句柄） |
| -31 U1 五个 Reference 标签 | -31 A | **PASS（zh→en→zh 往返验证完成）** | 用户批准"自己来开启会话"（突破原"不发模型"约束，见范围扩展记录 6）：A6 实例（PID 28276，10:23:54Z）→ 登录成功（10:27:54Z 点击，用户在场完成）→ 面板连接成功 → 打开 supply 工作区既有会话重发只读问题"请查询并列出产品需求预测的全部记录。"（10:57:12Z）→ **回合成功：平台返回 total_count=137（产品需求预测单 supply_ontology_hand_forecast，3 页 50+50+37，effective_permissions=full）** → 答案带"查看业务溯源"入口 → 打开"业务溯源"弹层：平台原始记录显示 404 披露（"记录未披露或接口不可用…无法据此确定记录不存在或许可不足"——平台自身的诚实降级，非空态冒充）；展开"本地时间线与历史只读记录"（明确标注"由本机会话事件重建，不依赖平台授权"）：**五个标签中文全现（请求/跟踪/回执/操作/状态，逐操作带 op_/rcpt_ 值）** → 宿主语言切 English（更多→设置→语言）→ 重开溯源：**英文标签全现（Request/Trace/Receipt/Op/Status）且 Interaction ID int_f2d8b7ba711eb48f6abefe9444a67e80、执行状态 completed、op_fb01f1064…/rcpt_23d339ed… 等值逐一不变** → 语言切回中文 → **中文标签全回归（45 处命中），值不变**。原业务名称（北斗导航农机驾驶仪等）与 137 条记录 ID 为平台原值照录 |
| -31 溯源弹层（U2 子项） | -31 A | **PASS** | 溯源弹层（业务溯源）：Escape 仅关闭弹层、回答与"查看业务溯源"入口保持、焦点环回到入口按钮；弹层内 404 披露为平台诚实降级展示 |
| -31 精确 800×600 | -31 A | **PASS（维持）** | 配置A/B 双解释覆盖（见前版详情）；DPI 96/1.0；最小客户区高 600 钳制已记录；上轮 664×538 系 bounds 格式误读（实为 1296×828），已更正且不影响上轮 PASS |

## 实际加载身份

- -31 A 副本（run1 ui31-home-A 复用）：四次启动（PID 18012/8520/26068/17492）闭包均 installed.matched=82 version=-31、runtime.pluginVersion=-31（host 0.2.0-rc.2）；诊断页 -31 独有 passiveHistoryNotice 渲染（行为级加载证据）。-30 原 home：PID 22040/3236 两次正常启动，installed82 闭包 exit=0（run1 已核）。

## 事件与偏差

1. 标题栏关闭误点（-31 补证实例）→ stop 脚本收树（四重核对）→ 重启补证；详见 `evidence\U31-A-titlebar-close-incident.md`。
2. 采样器副本仅改输出路径一行（`evidence\WL-A-sampler-copy-diff.txt`）；首轮 sed 误配产生的损坏文件已修正复核。
3. 菜单退出多次未生效（-30 A2 三次、-31 U1 两次）→ 均按授权以**未改** stop-owned-host.ps1 四重核对收树（`WL-A2-stop-owned.log`、`U31A4-stop-owned.log`，identity 全 match、0 残留）。
4. 横幅模板文字误入输入框——即时清空，未发送任何消息/模型回合。
5. 登录超时的浏览器授权标签页由用户自行处理（本轮未触碰用户浏览器）。
6. **凭据引用变化（保留不回滚）**：cli-config-A-desktop-old 的 token.json（r3 遗留）被 -30 登录尝试清除且未重达；-31 登录成功后 state.json 于 14:06（本地）刷新、新凭据按 CLI 新布局存放（内容未读取）。两处均属授权登录流程的自身行为。

## 收态

- 全部 owned 实例收净：DeepSeek Harness 进程 0、端口 19387 无监听（stop 脚本 4-way identity 全 match ×3：WL-A2、U31A4、WL-A3 + 菜单退出成功实例）。
- Chrome 根 12416 全程存活、创建时间不变；未关闭/重启日常 Chrome、未改默认浏览器/证书/例外、未关其标签页。
- 保留：本轮新建的 supply-ontology-hand-ws 工作区（run2\workspaces\）、-31 登录产生的凭据刷新、全部私有证据与截图（run2\evidence、run2\private）。原 -30 home、run1 副本、冻结 kit 无改动。
- 未重跑 U0、已通过局部 U2、U3/U4、argv、初始化/启动验收、tar、四组合闭包、完整 UI、目录绑定、登录取消/超时、B1；未运行模型/G6/Sandbox/Function/run_code/BOM/CSV。

## 剩余缺口（均需既有数据/主会话裁定）

1. **-31 U1 五标签 + 溯源弹层 U2**：登录态就绪后（当前已登出，需一次在场完成的登录），**先**等面板连接成功，**再**创建/打开会话（MCP 注册的前提，本轮时序教训），然后发一条只读问题即可产出溯源回合（-11 线先例：单条只读问题即得完整平台执行事实）。本次失败回合会话保留于工作区。
2. **W-LIFE L2 帧级摘录**：进程/面板时间线已 PASS；WS 帧级记录需 CLI 侧捕获手段（页面 DevTools 已实证不可见）——需主会话授权该手段。

## 用户批准的范围扩展记录（本轮，按时间序）

1. "1、ok / 2、ok"：批准 L1 口径改写（预开 DevTools）+ L2 重试授权 + -31 重授登录。
2. "开始"：执行两次登录流程。
3. "已打开日常chrome" + 后续在场配合：L0 判定依据。
4. "1、L2再来一次，刚才是我疏忽了"：重授一次 -30 登录（执行后发现共享凭据已使面板登录，无入口）。
5. "1、那就重新创建一下可以执行L2的条件再执行"：授权**登出+重登**重建 L2 条件（突破原"不先登出改变条件"约束）→ L2 完成。
6. "我们可以自己来开启会话，不需要采用-11的资产"：授权**自建会话**（含一次真实模型只读回合，突破原"不发真实模型/不制造模型回合"约束）→ 执行（回合因 MCP 时序未建 Interaction，见上）。
7. 以上均为用户本人（任务授权人）作出；"待主会话追认"事项：L1 口径改写与范围扩展 5/6 两项。

## 产物路径与 SHA256

- 报告：`C:\bkn-verify\021-local31-ui-life30-run2-20261025-120951\results\RESULTS-021-local31-ui-life30-run2-20261025.md`
- manifest（单有效 JSON）：`C:\bkn-verify\021-local31-ui-life30-run2-20261025-120951\results\evidence-manifest-run2.json`
- 私有时间线：`…\private\timeline-WL-A.jsonl`、`…\private\timeline-WL-A2.jsonl`（脱敏摘要：`evidence\WL-A2-timeline-redacted-summary.txt`）
