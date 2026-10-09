# -8 首次使用改动：开发与候选验证

日期：2026-10-08。范围仅为 [首次使用计划](../../plans/2026-10-08-plugin-first-use-quick-fix.md) 第一批 A0–A5。未发布；本文件按证据阶段更新。

## 源码与检查

- 基线 main：`4995109330a800060c523509cdaca8403744cd86`；分支 `fix/plugin-first-use-8`；插件版本 `0.2.0-rc.2-openbkn.0.2.0-8`。
- 维持 DSH `dsh-v0.2.0-rc.2`、三个组件条目与 bootstrap 零导入；无 Runtime 发布、无新配置存储、无平台算法或答案纠错。
- 未设置地址时业务条目正常启用，但不创建认证/MCP/业务服务。独立诊断将连接类检查记为 `not-run/configuration-required`。
- 通过独立配置 Remote 调用当前 profile 的 DSH 原生 `configEditor.edit`，仅改 `baseUrl`/`cliPath`，保留高级配置。有效地址保存与实际连接成功分开。
- 普通界面采用 CLI 登录；历史内部 `configureToken` 方法保留，完整无 CLI 模式仍暂缓。
- 配置重载释放旧业务所有者的策略/客户端；变更平台清除旧检查，同平台恢复保留历史。取消、旧地址与已销毁所有者的迟到结果不覆盖新检查。
- 业务回合和短绑定落盘阻止设置修改；设置保存期间阻止新的绑定写入。已有会话平台/网络不改绑，新实例只使用当前平台经 CLI 验证的 Token。

本地检查：typecheck exit 0；插件 381 项（380 pass / 0 fail / 1 skip）；仓库 suites 60/60；package audit 66 files；diff-check exit 0。原生输出随本目录归档。skip 为既有有条件平台用例，不能视为通过。

## A0 官方 npm Host 原生预验

证据：[native-config-editor-preflight.json](native-config-editor-preflight.json)。环境为官方 npm DSH `0.2.0-rc.2`、隔离 home/profile、无 inspector。使用本地构建包，**只证明原生配置链可用，不是固定 CI 候选的 UI/登录/发布验收**。

首次无地址三组件正常启用，连接检查未执行。非法 `file:///tmp/invalid` 提交返回 `openbkn/configuration-invalid/configField=baseUrl`，profile patch 哈希不变。合法地址与非默认 CLI 路径经原生编辑器写入、重载后可读回；独立配置接口和诊断继续存活。没有把组件加载 pass 当作连接成功。

## 审核收尾与候选状态

首轮 build-only run `37723949454` 在 `f6bc2228154d1ddf388468b73ab2f131c04ee7b0` 通过。随后新增原生 Context 回归并修复配置重载期间既有工作区关联恢复的 admission 边界，以及 fork 绑定落盘窗口；该首轮包不再作为最终验收包。重新构建最终候选。独立评审后补充历史溯源无已验证 CLI Token 的鉴权降级、会话销毁后父所有者 effect 解绑，以及复用线性的地址归一化函数；新增真实调用链/原生 effect 回归。配置层继承核对正常，见 configuration-layer-preflight.json；设置/诊断读取 ACTIVE fiber 的原生解析值，修复已有 !!js 配置的误判，不新增表达式解析。

本地界面预验（官方 npm DSH、全新无地址 profile）：单侧栏入口 → 地址表单 → 空值/非法地址就地提示 → 诊断明确未执行 → 通过表单保存合法地址及不存在的 CLI 路径 → 保存成功与缺 CLI 指引分别显示。未取得该预验浏览器的导出下载文件，不把点击导出记作下载通过；最终 CI 候选仍需实测。

平台实际容器镜像已重新只读采集，见 `platform-images.json`。旧隔离 CLI 凭据本地状态已过期；其失败不推断平台根因，后续使用正常授权验证。

## 固定候选验收与待完成项

固定候选：source `23ac2daa6d3538235f33a9627a8178a48f3e1ebf` → build-only run `37725960498`（success，publish=false）→ tgz `6a946030a6152d2899609fac95c66cd246e36cca5a8ce4e5f87ed379cbe706ea`，175800 字节、66 文件，见 candidate-manifest.json / candidate-files.json。源码独立评审 APPROVED、CodeQL 通过；当前未发布。Windows Desktop/npm 及用户源码构建 web 的受影响矩阵使用同一固定候选，单独 handoff；旧 -7 的实机证据不替代 -8。

既有受限账号未测、平台超时/落库、Token 重复拒绝根因、原故障机器根因沿用既定开放范围。后续完善项不进入本轮。


## 最终包的已执行验证

- 两个 Mac 隔离 profile 安装后均 66/66 字节匹配（missing/different/extra 全空），见 `mac-host-api/*installed-identity.json`。包版本/磁盘身份核验与真实界面验收分别判断。
- 官方 npm Host API：待配置时三条目 active；五个连接/配置检查 not-run；四种非法提交无写入；合法地址/非默认 CLI 路径经原生编辑器保存，重启可读回；三个高级字段保留；ACTIVE fiber 的 native expression 值正确识别；home 高层覆盖拒绝且 profile patch SHA 不变。原件见 `mac-host-api/`，属于实际 Host API，不能算点击 UI/授权通过。
- 官方 CLI remove/reinstall 预验：已停止的隔离 Host 上，profile/home 两个选定配置文件在卸载前、立即卸载后、重装后 SHA 完全相同，范围见 `cli-uninstall-preservation.json`。后续管理器 UI 与真实绑定 F8 单独列在下文，不追溯扩大本预验范围。
- 最终包 + 官方核心库受控运行：原生回答/工具结果保留及 guard 八场景 8/8；所有者生命周期 6 条记录全部 pass（含身份、重载移除旧贡献、同会话重挂、会话释放父注册），见 `controlled-runtime/`。初次 lifecycle helper 的传递依赖查找失败发生在任何候选场景前，修正 helper 解析后通过；保留 attempt-1 原件。此证据不是实时平台/模型或完整 Desktop UI。
- 日常 profile 选定的 8 个 JSON/YAML 文件同清单内容哈希均未改变；不延伸到全部日常用户数据，见 `daily-selected-content-check.json`。
- 固定包 + 官方 npm ToolRuntime + 本轮独立真实 CLI 授权：live catalogue 28 个工具，前轮 catalogue 无增减/schema 变化；24 个已管理 kn_id 契约与 fixture 一致，默认排除的 execute_skill 仍独立列出。真实平台 guard 16/16、原生退出 0，实际 Interaction 的操作清单仅有允许的 search_capabilities，拒绝调用未落平台。prepare 的 probePackage 与执行 --plugin 路径相同，结束后 66/66 仍一致，见 `live-platform/`。这是无模型的真实平台边界验证，不替代问答或 UI。
- S2/S4 故障隔离：分别只改 exports 对应的 business.js / diagnostics.js，其他 65 文件不变。API 轮见 `mac-isolation-api/`。随后在独立 root 用 Chrome 实际打开面板：S2 诊断报告 98b95ece 显示业务坏导入、bootstrap/diagnostics 存活；S4 诊断入口明确降级，无导出按钮。S4 配置服务也属于失败 owner，空地址时不能在此故障状态保存设置；仅为验证已配置业务回退，向隔离原生 patch 写入合法地址/CLI 路径，实际业务面板仍显示 CLI 登录入口，测试后 patch 精确还原。未在 S4 故障 root 授权或问答；见 `mac-isolation-ui/`，不宣称完整业务链通过。

## Mac 产品界面与当前验收边界

固定候选用于两形态，用户分别在隔离 npm 和 Desktop Host 配置有效模型。以下判定只对应实际执行步骤，不把 API、fixture 或旧 -7 结果当成本轮 UI 通过。

| 项 | Desktop | npm(web) | 证据与范围 |
| --- | --- | --- | --- |
| F0/F1 | 已测 | 已测 | 单入口、待配置表单、设置/诊断；四种非法输入就地拒绝、输入保留、patch 不变。 |
| F2 | 已测 | 已测 | 合法地址与非默认 CLI 路径保存、重启回读；保存成功与连接成功分开。 |
| F3 | 首次登录、同 Host reader 401 重登恢复已测 | 首次授权、同 Host reader 401 重登恢复已测 | 两形态受控失败边界均为 platform-network-list，真实 CLI 重登后 recovered=true；不把历史 context-loader pass 当成 MCP 401 被触发。 |
| F4 | 无 CA 的 TLS 失败与新 Host 恢复已测 | 无 CA 的 TLS 失败与新 Host 恢复已测 | Desktop 恢复报告 3d002ea9 的 context-loader/list pass，但当时 login-state fail；不能称全绿。npm 恢复导出 8ca4405a 十项 pass。受控网络失败为 Host API；真实 403 产品 UI 未测。 |
| F5 | 延迟读取期间关闭、不迟到重开已测 | 真实登录等待期间关闭、不迟到重开已测 | npm 关闭轮的浏览器授权不证明 CLI 完成，该轮不计恢复；恢复属于随后保持面板打开的独立登录轮。所有者/旧平台结果围栏另有原生调用链检查。 |
| F6 | 地址变更/恢复已测 | 地址变更/恢复与真实业务回合设置围栏已测 | npm 正在问答时设置禁用，生产 RPC configuration-busy、patch 不变；回合结束后恢复可编辑。 |
| F7 | 用户选目录后，实际 UI 绑定、标准问答、所选来源、重启续问已测 | 标准问答/所选来源；重启后本地过期指引、真实重登、原会话续问已测 | Desktop 同会话绑定重启前后字节一致；npm 绑定准备为生产 RPC，未宣称系统 picker UI 通过。两形态续问均返回产品订单 40 张/已确认，并与独立 oracle 对照。 |
| F8 | 原生管理器卸载/固定包重装已测 | 原生管理器卸载/固定包重装已测 | 组件/侧栏消失后恢复、66/66；选定用户文件紧邻卸载哈希保存范围见下文。 |

Desktop 第一轮 F8 的六个选定用户文件哈希一致，当轮尚无业务绑定，历史范围保留。完成真实绑定后又通过原生管理器卸载/重装固定包：包括会话绑定、工作区绑定、patch、工作区索引及 CLI store 的七个选定用户文件，在卸载前、立即卸载后、重新启用后三时点字节/哈希全部一致；三条目 v-8 恢复运行，列网 2 与既有工作区关联恢复，见 `mac-ui/desktop-f8-bound/`。Host 自动生成的 cordis.yml 单独记录，不计入七个用户文件不变承诺。npm F8 的七个选定配置/绑定/工作区/CLI-store 文件三个时点也一致。Desktop CLI 重装被官方 CLI 拒绝的原件保留；最终使用产品管理器，未绕开限制。两形态最终安装件均 66/66，见 `mac-processes/final-installed-identities.json`。

十三份真实产品导出原件（Desktop 八份、npm 五份）在 `mac-ui/report-provenance.json` 逐件列出实际下载路径、报告 ID、完整 SHA 与归档字节一致性。Desktop 经原生保存对话框、npm 四份经 IAB 下载及一份经 Chrome 下载；API 报告单列，不计入产品下载。`3d002ea9` 如实保留“传输恢复但登录检查仍失败”的采集时点，后续重新登录成功不追溯改写该报告。

归档前重新读取十三份下载原件，与仓库归档字节/SHA/大小/reportId 逐一核对均一致，见 `evidence-validation.json`；暂存 Git blob 对照见 `product-git-consistency.json`。全部当前证据的文件/字节/SHA 清单在 `EVIDENCE-FILES.json`（明确排除清单自身，避免自引用）。凭据形状扫描、JSON/JSONL 解析、Python helper 语法与 Markdown 本地链接检查通过；扫描只覆盖本证据目录及列明的模式，不声称整个私密 home 或历史 Git 对象无敏感数据。

CLI 生成的两个 oracle CSV 保留 CRLF 原字节，不为了 diff 检查修改数据原件；证据提交的 whitespace 检查明确使用 `git -c core.whitespace=blank-at-eol,blank-at-eof,space-before-tab,cr-at-eol diff --cached --check`。派生 Markdown 多余文件尾空行已移除。

Chrome 开启“下载前询问每个文件的保存位置”时，用户手动点击也没有下载文件或新的下载记录；临时安装目录探针的延迟 blob/data URL 对照未解决。探针已还原、66/66 一致，未改候选源码。经用户明确授权，临时关闭该选项后使用原 CI 候选实际下载 875041b4（2436 字节，七项 pass），随后立即恢复开启并在 Chrome 原生界面核对。该对照将问题定位到浏览器保存询问/窗口路径，准确的 Chrome/OS/操作通道根因仍未知；不能宣称开启该选项的原异常已修复，也没有证据据此修改插件序列化或导出处理。见 `mac-download-triage/`。

Desktop AX 与视觉绘制曾不同步；重启及窗口刷新可恢复操作，背景窗口需原生 Raise 才能接收输入。用户确认入口能打开，未将操作通道失效定责为插件。原生系统目录选择器由宿主 osascript 子进程启动，不在现有 CUA 应用接口中；用户完成目录选择，真实绝对路径 `/private/tmp/bkn-firstuse8-mac-desktop/workspace-supply`。

Desktop 标准模式先完成全网销售订单题（31 秒：800 张，784 已确认/16 执行中），以作答后的独立 CLI 三查询核对；这是全网口径，不冒充原 G6 产品题。重启后同会话续问产品 382-000005（17 秒：40 张/全已确认），与产品 oracle 一致。实际打开执行/图/回执三个来源视图，选定 metric 的 operation/Interaction/receipt 又经真实 CLI 核对；只证明该对象链，不泛化到全部 26 图元素，见 `mac-ui/desktop-f7/`。

npm 重启后发现 CLI 凭据的本地 expiresAt 早于重启时点，诊断正确显示 not-logged-in，第一轮续问没有业务数据。真实产品 CLI 重新登录后恢复列网 2、原绑定和原会话，后续标准问答返回产品订单 40 张/已确认。首次授权等待轮超时/关闭与随后及时完成的登录轮分列；不把浏览器授权成功等同 CLI exit 0，不推断跨设备 Token 撤销或平台 rotation。见 `mac-ui/npm-f7/`、`npm-f7-local-expiry.json`。

## 真实模型与平台验证

npm 标准模式完成七个原生回合，全 BOM 用量库存题在测试器 300 秒截止后取消。按现有 G6 判定为 **6/8**，不是完整通过：missing-object 虽明确目标不存在，却附其他对象非零数值，不符合原判定；全 BOM 库存题没有最终交付。采购题既有主要判定通过，但额外给出的不同子编码 406 与独立 oracle 的 407 有差异。未加输出裁决/纠错、未改变原评分口径，详情和原生终态在 `mac-g6/`。

六次 `run_code` 工具超时为 20013–20034 ms。源码确认插件将既有 `toolCallTimeoutMs` 默认 20000 ms 传给官方 McpClient，本 profile 无覆盖；这识别了配置截止时间，不足以断言慢查询仅属平台根因或增大阈值必然恢复。测试器 300 秒取消、工具 20 秒超时、平台查询耗时分列；CLI 批量 oracle 的路径不同。该既有问题没有扩展为 -8 的业务算法修改。

订单明细 40 行 × 11 字段独立核对一致，成品仓九条记录及 534 汇总一致，交期与指定 BOM 一级/分支事实核对通过；前后 oracle 所检查的数据稳定。首批 30 检查项通过；追加 18 项中 17 通过（差异为采购题附加编码数）。物理 BOM 的 507 行/6 层与 main_only 的 313 行/272 编码/5 层分开，未宣称全物理 BOM 逐行核对。模型异常三题未测；无受限账号维持用户决定。真实 live catalogue/guard 的 16/16 与模型评分分别判断。

npm 成品仓回答的产品溯源实际打开执行、图、回执三个视图；选定库存对象的 operation/receipt/Interaction 对应关系再经真实 CLI receipt 查询核验。限定为所选对象链路，不宣称图中全部元素都独立闭环，也不将 UI 中显示的失败/pending 操作改成成功。

## 网络、用户状态与进程

最初 CLI、独立 CLI 与 Chrome 对同地址均连接重置，路由经 utun4。用户授权并亲自执行临时 lo0 alias 192.168.50.28/32 后，原 HTTPS 地址直连返回 302、证书校验 0；仅在测试 Host 子进程增加 NO_PROXY。浏览器自签证书警告由用户处理，后续正常授权已完成。未改变宿主、包或系统证书信任，未确定代理/VPN 内部根因。alias 按用户要求保留，重启不持久化；撤销命令 `sudo /sbin/ifconfig lo0 -alias 192.168.50.28`。

验收后最终 Desktop PID82181、npm PID94333，以及补验 S2/S4 PID88522/89745 均按创建时间、命令与相应 listener 核对后停止；原生停止记录与各轮历史在 `mac-processes/`。最终记录的自有进程树 PID 均不存在、18320–18324 无 listener；不泛化为整台机器所有进程为零。隔离 home、绑定、模型配置和 CLI store 保留供复测，不复制私密原件入库。用户授权的模型配置/重新登录不延伸 F8 独立采集窗口的哈希承诺。

日常 profile 选定八个 JSON/YAML 文件同清单哈希未改变，最终再次核对见 daily-selected-content-check-3.json；不覆盖全部日常文件。一次隔离 helper 的 help 命令未传测试环境，新增日常 web 空日志 `/Users/kalias/.dsh/profiles/web/.plugin-manager/logs/operation-WN3DUX/pnpm.log`（0 字节，SHA-256 e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855），未安装或启动日常 Host。日志保留，不删除来制造零触碰。

## 发布门槛

Windows 固定交接已推送：文档提交 `59ac630784ac3a6d8cfce3eecc47e5f283cd1882`。尚未收到 -8 Desktop/npm/用户源码 web 回传；旧 -7 不能替代。Mac 已完成上述核心首次配置、授权、绑定、标准问答、重启、来源和管理器卸载/重装步骤；真实 403/受限账号、三道模型异常题未测，不冒充完整全矩阵或全 G6 通过。

发布前仍需新 HEAD 审核、Windows 回传、合入 main 后同源包一致性核验，以及与用户确认本轮异常/已知限制的处理口径：G6 两项未通过、采购题附加编码数偏差、Chrome 开启保存询问的通道异常。源码/候选未为这些观察添加跨界答案裁决或平台算法。未 tag、npm publish 或更新 dist-tag；受限账号、历史 Token 拒绝根因、平台落库、原故障机器根因等既定开放项未扩入本轮。
