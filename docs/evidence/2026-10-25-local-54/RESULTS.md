# 第54轮：-31 承接到 -32 与 rc.3 受影响 UI 最小验证

日期：2026-10-25（Asia/Taipei）。本轮完成主树承接、本地构建、包核对及隔离 **Mac npm/web + DSH 0.2.1-rc.3** 的受影响 UI 验证。不是完整双宿主/八组合验收；分类仍为 `local-development-preacceptance`，`ciRun=null`，`formalAcceptanceEligible=false`。

## 候选与代码身份

- 主树：`feat/021-localization-login`，HEAD 仍为 `933b0ab251c75461ece1ada6145a9487e7eb04d1`。本轮源码尚未提交，不能用这个 HEAD 单独代表新候选源码。
- 最终本地包：`release/local-54/final-candidate/openbkn-dsh-business-context-0.2.0-rc.2-openbkn.0.2.0-32.tgz`。
- SHA256：`46626510825fe9146aef12c27a1724acbb455aeac22aa600358add0fc8e1c9f8`；231465 bytes，82 文件。见 [身份](CANDIDATE.json) 与 [逐文件摘要](CANDIDATE-FILES.json)。
- 新运行目标仍为官方 `dsh-v0.2.1-rc.3` / `1f81c047fc48fa190a683e469daa699857e9afe8`；旧目标与构建生成器仍固定 `0.2.0-rc.2` / `639ed015397290b3745d163aafe02ffee4aa3f84`。插件版本名的 `rc.2` 前缀不代表把新版目标退回 rc.2。
- -30、-31、独立 Windows `d20a266` 交接及另一发布线均未修改。本轮没有采用远端 -11。

## 承接与最小覆盖依据

先比对冻结 -31 开发副本与主树：5 个 Client 源文件和已有焦点测试均与第49轮承接前基线逐字节相同，新 UI 测试原本不存在。因此复制这 7 个文件，没有覆盖其后的用户修改；新版 rc.3 probe 和元数据保留。[承接清单](CARRYOVER.json) 记录前后摘要。

承接包含五个历史 Reference 标签的 zh/en、本地历史诊断时效说明、眉标/登录按钮对比度、共享弹层焦点与 Escape 所有权。主树全部 68 个 `src` 文件与冻结 -31 相同。业务计算、答案转述、登录成功消费路径、runner/Job 策略没有新增修改。

与冻结 -31 tgz 比较，最终 -32 没有增删包文件，4 个文件不同：`lib/client.js`、`package.json`、两份 README。Host JavaScript、所有声明及 Remote 文件字节相同；Client 的差异仅为打包器 `//#region` 的工作目录路径注释，移除这些完整注释行后执行内容相同。原始包保持原样，不为获得相同摘要改写代码。

## 源码、构建与包验证

| 层次 | 本轮结果 | 边界 |
|---|---|---|
| 受影响源码测试 | 6 PASS / 0 FAIL | `dialog-focus.test.ts` 与 `ui-followup.test.ts`，包括五标签 zh/en/zh、ID/status/读取次数不变、历史 JSON 不变及对比度 |
| 本地构建 | PASS | Node 24.19.0；显式 pnpm 11.7.0；旧 Host 生成器、Host/Client 类型及 bundle 构建 |
| 原包审计 | PASS，82 文件 | 原 `scripts/package-bundle.mjs --check`，没有跳过断言 |
| 最终安装内容 | PASS，82/82 | 官方 rc.3 CLI 安装最终 tgz，实际 profile 中逐文件字节核对 |
| 实际 profile 闭包 | PASS | 原只读校验器：Cordis 4.0.5、Schemastery 3.18.5，Host/插件为同一物理包，无混版，插件 Zod 4.4.3 |

没有重跑已通过的完整旧测试矩阵。首次测试命令从仓库根目录误用包内相对路径，未找到文件；改为正确包目录后 6 项通过。失败命令输出保留在私有任务目录，不当作产品失败或隐藏重试。

## 实际 rc.3 UI

在第53轮官方 rc.3 runtime 的新副本和第51轮 npm-new home 的新副本中运行。复制时只在新 runtime 的 3 个根元数据文件移除私有 fixture 根依赖及其直连别名；35758 个官方/依赖文件字节保留，未安装 #105 回补，未修改现有 Host。原 runtime 与原 home 事后摘要无变化。

实际原生设置页显示 `0.2.1-rc.3`；最终插件页显示 -32、最终本地 tgz 来源、3/3 组件运行。诊断中 DSH/已加载版本依旧显示“未采集”，没有用磁盘版本补填。两类证据分别保留。

| 最小受影响项 | 结果 |
|---|---|
| 业务弹层、诊断中英文 | PASS：URL 间距、历史观测提示正确；未知字段与 `not-logged-in` 原状态保留 |
| 眉标与登录按钮颜色 | PASS：DOM 实测 `#087d72` / `#0e7490`，与已通过的正常文本对比度断言一致 |
| 三弹层 Tab / Shift+Tab / Escape | PASS：焦点循环；仅关闭自身并恢复入口焦点，底层页面或历史 Session 保留 |
| rc.3 原生 More 菜单 | PASS：Tab / Escape 仅关闭菜单；窄窗口 Session More 同样通过，未改 pin/unpin |
| 800×600、滚动与末项可达 | PASS：页面宽 800；诊断弹层边界在窗口内、内容可滚动，末项焦点可见；随后恢复 1280×720 |
| 现成历史协议 Session 溯源 | PASS：本地 completed Interaction、4 个时间线节点保留；平台读取显示需重新认证，没有发新回合 |
| 最终包重载后的英文诊断 | PASS：历史说明、未知字段、认证失败保留；重载后浏览器错误条目 0；关闭返回原入口 |

证据边界：上述中文、焦点、窄窗口及历史溯源操作最先运行在初包 `c14c50815ae1b50332aabb6a0a666e000287439fa84bbe8e8187ec9e0c8acff6`。发现 README 仍写“尚未构建”后，仅修正两份 README 并重打最终包；最终包与初包的全部执行文件、声明及配置字节相同。最终包已实际重装、82 文件核对、重启/刷新和英文诊断操作，没有把两次身份混称同一摘要。见 [逐项记录](UI-VALIDATION.json)。

当前 UI 返回 CLI 未登录，本轮没有触发重新登录、B1、业务模型或新平台 Interaction。非空平台五标签显示仅有本轮受影响源码测试及原 -31 实机证据，不冒称在 rc.3 新平台事实中复验。没有新测原生嵌套父弹层消费 Escape；原受控测试保留自己的证据范围。未重复导出、登录全路径、旧 Desktop、G6 或 Windows。

## 保护与收尾

本轮创建的浏览器任务页已关闭，临时 viewport 已恢复；只按 PID、启动时间、exe、监听端口一致性停止本轮 Host。两次 owned Host 都退出，38654 端口释放。[保护核对](PRESERVATION.json) 记录冻结交接、-31 源副本、原任务 home 和原 rc.3 runtime 的逐文件核对，以及 HEAD/索引/worktree 引用保持。

正式 OpenBKN 0.2.0 未替换，无部署或业务写入指令。没有声称本轮再次逐行审计平台数据库；已有数据/配置保护证据保留各轮原身份。没有提交、推送、CI、PR、tag、发布或远端 issue 写入。

## 上游与剩余门槛

DSH master 与上一轮相同，最新 release 仍 rc.3。Foundry 未发布 main 前进 1 个提交（29 文件）至 `743becf2325a9e65a749f91be31aea2888885d38`：区分 audit publisher 健康和查询可用性。重点审阅了聚合健康端点、请求外缓存轮询及采集覆盖元数据；内部端点依赖 ClusterIP 信任边界，不将 publisher 健康冒称完整投递证据，恢复也保留历史缺口。这是有范围的源码审阅，未部署，正式 release 仍 v0.2.0。见 [上游核对](UPSTREAM-STATE.json)。

#105 未因本次 UI 候选而修复或关闭，官方 rc.3 的 MCP SDK 仍在原适用范围。完整 Host 回补交付、安全门槛、rc.3 其他形态、真实平台/模型 G6、CE 非空原生解释、低权限负例、未确认生命周期条件、最终固定 CI 候选和人工验收仍按 [剩余项](BLOCKERS.md) 开放。Windows 仍按冻结 d20a266 的 -31 UI / -30 生命周期范围回传，不能直接转记为 -32 / rc.3。
