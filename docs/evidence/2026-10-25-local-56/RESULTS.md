# 第56轮：冻结 -32 的官方 rc.3 Mac Desktop 最小补证

日期：2026-10-25（Asia/Taipei）。完成此前未执行的 **Mac Desktop / DSH 0.2.1-rc.3 / 冻结 -32** 受影响 UI 最小验证；随后恢复过期CLI认证，补齐 Desktop 和 npm/web 尚未执行的非空五Reference标签检查。没有重跑已通过的 rc.3 npm/web菜单/焦点/窄窗口或 -31 原形态。本轮不是完整兼容、业务模型或正式候选验收：`local-development-preacceptance`，`ciRun=null`，`formalAcceptanceEligible=false`。

## 固定输入与隔离

- 主树 HEAD 仍为 `933b0ab251c75461ece1ada6145a9487e7eb04d1`，保留原有未提交修改；本轮未修改产品源码、重建或重打包。
- 同一第54轮最终 -32：`46626510825fe9146aef12c27a1724acbb455aeac22aa600358add0fc8e1c9f8`，231465 bytes /82 文件；没有采用初包或其他发布线。
- 官方 rc.3 Mac arm64 zip 从官方旧签名应用的 updater 配置定位的 feed 取得。feed 为 `https://download.deepseek.com/dsh-desk/feeds/mac-arm64/nightly-mac.yml`，版本0.2.1-rc.3；zip 大小347702586 bytes，SHA256 `599a3ceef4d58f2b82bfd61ca4ef9d55c0f8e055dde60550c92f00d78d0cad2f`，SHA512与feed相同。
- 只解压到 `release/local-56/desktop`，没有覆盖日常应用或旧任务应用。代码签名 deep/strict 在运行前后均通过，Gatekeeper 接受且标记 Notarized Developer ID。Info.plist、实际“关于”和设置页均为0.2.1-rc.3；app.asar SHA256 `848f8437a990ffb88fca6772eb8e0e69af84d066c76087ac973a8d8015b459f4`。
- 从第51轮新版 Desktop 任务 home 新建副本，排除 node_modules，原81文件逐字节复制。使用该官方应用自带 CLI 只在新副本安装冻结 -32，使用新 Electron user-data；既有 Host/home 保持。

官方包及签名记录见 [安装包身份](OFFICIAL-DESKTOP-IDENTITY.json)。内置实际运行时为 Node24.21.0 / Electron44.7.0，不是修改本机 Node 安装。

## 安装、闭包与实际加载

最终安装的82文件逐项摘要与冻结tgz清单相同。原只读 profile 校验器在官方 Electron运行时中检查实际 desktop profile：Cordis4.0.5、Schemastery3.18.5 为 Host/插件共用的同一物理包，无混装；插件版本为 -32，Zod4.4.3。见 [profile结果](PROFILE-CLOSURE.json)。

实际插件详情页显示 -32、原 final-candidate tgz 来源及3 total /3 running。诊断的 Host form 为 Desktop/桌面版，但 DSH版本和插件已加载版本仍是“未采集”，没有用安装身份补填它们。两个证据来源分别保留。

## 新形态受影响 UI

| 项目 | 本轮结果 |
|---|---|
| rc.3 新增 More 菜单 | PASS：Tab到Browse other plugins，Escape仅关闭菜单并回到More，原生页面保持 |
| 业务弹层 | PASS：初始panel焦点，Tab到设置、Shift-Tab回绕刷新状态；Escape恢复OpenBKN入口，插件父页面保持；URL间距正确 |
| 诊断弹层 | PASS：中英文被动历史说明正确；Tab/Shift-Tab边界及Escape恢复入口；未知版本及loggedIn=false原观察保留 |
| 原生窗口800×600 | PASS：CUA原生角拖动后窗口截图实际800×600；诊断内容可滚动，末尾导出/重新采集控件及焦点可见；恢复原1280×820。此为原生窗口截图尺寸，未独立测量内容viewport |
| 既有历史溯源弹层 | PASS：打开复制的R40协议历史，不运行新B1；原completed Interaction与4个本地时间线节点保留，平台侧显示需重新认证；Tab回绕关闭、Shift-Tab回绕展开摘要，Escape恢复原回答溯源入口 |
| EN→ZH→EN与原绑定 | PASS：业务/诊断翻译生效，恢复English后历史会话及供应链网络绑定名称保留；不是新目录授权或绑定验收 |
| 非空平台五Reference标签 | PASS（认证恢复后的单独阶段）：Desktop和npm/web均实际zh→en→zh，Request/Trace/Receipt/Op原值及completed状态逐项相同；读取既有平台记录，没有新查询/Interaction。不声称平台读取次数为1 |
| 特定原生嵌套父弹层组合 | NOT_RUN：本轮不新造组合；第49轮受控和Windows原回传证据保留其范围 |

没有新模型回合、Host登录按钮/B1、Sandbox、Function/run_code、BOM/CSV或G6，没有重跑源码全套、构建、包审计、旧形态、导出工作流或Windows项。[结构化记录](VALIDATION.json) 保留每项范围。

## 认证恢复后只补原有非空Reference

初始阶段未登录。独立执行官方CLI `auth status` 后确认 `hasToken=true / expired=true`，按用户既有授权使用computer use和本机已有管理员凭据完成正常浏览器登录，没有重置密码或改变证书信任。原等待流程因harness误把官方 `/oauth2/device/verify` 匹配成 `/device` 而取消；明确输出URI的第二次流程在查找既有凭据/修正AX差异读取期间CLI等待过期，浏览器虽成功但CLI仍过期；最后一次使用显式URI与本次命令级timeout600完成，CLI退出0，独立读回 `expired=false`。原失败/等待日志保留，不当作默认Host登录取消/超时验收或产品缺陷。没有修改Host超时配置、输出密码或保存浏览器密码，自己的授权页已关闭。见 [认证准备](AUTH-PREPARATION.json)。

再次打开同一新建Desktop任务副本，只读现成R40历史：原生业务视图仍返回已知404，标准平台执行事实/回执读回非空。五个标签实际完成中文→英文→中文，原Request/Trace/Receipt/Op和completed逐项不变；恢复English后正常菜单退出。

另从第54轮npm/web home建立新副本（47个非依赖文件及既有依赖均复制，原home不改），复用原官方rc.3 runtime的只读代码，不重新安装包。新副本82文件和实际profile身份核对为冻结 -32；仅打开已有bounded协议历史做同一五标签检查并逐项比较原值，未重复菜单、焦点、诊断、窄窗口或登录。最后恢复English、关闭本轮任务页、按PID/启动时间/exe/端口一致性SIGTERM停止新web Host。

这些非空事实来自已存在的标准执行记录，不能关闭原生业务非空解释的CE路由缺口；更不等于重新运行历史B1或模型业务题。逐项结果见 [Reference专项](REFERENCE-VALIDATION.json)。

本轮自动化准备纠正：原生CUA不接受大写`Shift`修饰键，改用`shift+Tab`完成缺少的操作；一次AX按钮点击误报offscreen，按可见截图坐标成功；原生截图实际为JPEG，纠正了初始PNG扩展名/头部尺寸假设，以真实JPEG尺寸为准。这些是工具调用/取证适配，不认作产品失败；原操作记录保留。

## #105 与上游

这份官方 Desktop 实际含 MCP SDK2.2.0，DSH transport没有显式fetch/redirect覆盖；[只读映射](SECURITY-MAPPING.json) 保留其文件身份。本轮没有安装同源回补，没有将“UI通过”当作 #105 安全通过。此前隔离源码/SDK/服务组合补证保留，完整Host交付与对应形态验证仍缺。

DSH master仍 `22ddee3792402c3e70ec5f86a63c3e3e895a2f60`，最新release仍rc.3。Foundry未发布main从 `743becf2325a9e65a749f91be31aea2888885d38` 前进1提交/29文件至 `6fff80cd66e95c1e00b4fadb893f5d84c356e6f1`（#2481）：新增有范围的Span展示元数据和按需100条Span续页，逐页授权，raw Span要求全局权限；cursor绑定身份/权限并15分钟过期。展示截断不代表采集丢失，估计总数不当精确计数或分页终点。

定向核对了文档、handler、projection、cursor以及插件实际读路由。插件当前读取Interaction operations、business-graph和business-provenance，不调用新增technical Trace spans路由；本次上游变更没有修改这些消费路由或MCP工具目录。对未部署main只做有范围源码评审，不改冻结插件或平台，不声称完整上游审计或新增live tools/list验证。正式平台release仍v0.2.0，未部署该提交。见 [上游评审](UPSTREAM-REVIEW.json)。

## 收尾与保护

窗口恢复1280×820、语言恢复English。两次Desktop均通过原生菜单正常退出，owned PID86987/87540及58007/58881端口退出；npm PID87664/38656在任务页关闭后按身份核对停止，无本轮owned进程残留。日志EPIPE计数和覆盖范围见保护回执；这是本轮UI/Reference时段，不是长时B1证据。

原Desktop home81文件、原npm/web home47文件保持。新Desktop副本仅安装元数据变化，npm新副本原文件无变化；全局CLI正常认证续期的状态单独记录，不声称全机凭据逐字节不变，也不恢复旧登录状态。两版原Desktop ASAR保持，新的rc.3 ASAR也与启动前相同。原 -30/-31/-32、Windows d20a266输入、原source/home及HEAD/索引/worktree引用的核对见 [保护回执](PRESERVATION.json)。

没有访问业务数据库作全量行审计，没有发起新业务数据写入或改变正式0.2.0服务；平台正常认证状态变化单独披露。无提交、推送、CI、PR、tag、发布或远端issue写入。Windows仍按d20a266补证，结果回来再合并；当前无需用户登录、选择目录或提供凭据。[剩余项](BLOCKERS.md)继续开放。
