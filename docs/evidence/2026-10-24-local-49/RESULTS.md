# 第49轮：独立UI修复、登录收尾补证与Windows最小方案

原-30、r3交付、主工作树生产源码与安装环境保持冻结。独立detached开发工作树为`bkn-dsh-local49-ui`，基点933b0ab加本轮开始时已有源码快照；本轮只在该副本开发未发布本地-31。没有推送、CI、Host升级或正式0.2.0替换。

## 完成与验证

- 五个历史Reference标签请求/跟踪/回执/操作/状态接入宿主locale；实际zh→en→zh受控渲染保持一条读取和平台名称、ID、completed原值。技术标识和原始JSON不改。
- 两处OPENBKN眉标及绿色主按钮文本对比度达到4.5；被动诊断明确说明历史观察、采集报告不会主动验证当前登录/连接。保留原报告状态、时间和JSON。
- Escape已在真实浏览器DOM中先复现再修：固定新版原生useModalLayer和原-30 Hook组合先关闭原生父层再关闭插件层；修正把监听放到自己panel，插件层关闭、父层保持。相同focus Hook用于溯源，已有消费事件/输入法/修饰键得到保留。此处React effect/ref通过小型seam驱动，DOM事件真实；不是完整Desktop或Windows验收。
- 原/新依赖基线各618项：617 pass、1 Windows专属skip、0 fail；两版类型检查通过；82文件包审计通过。针对实际打包client再运行3项UI断言全部通过。未重做G6、B1、安装/启动矩阵或无关仓库全套检查。
- 两版source baseline使用相同改动源码与各自既有固定依赖目录，不安装/升级DSH、SDK或生成器。新版clone首次缺少root scripts导致环境用例失败，补齐相同根输入后618项通过；原失败日志保留。早期脚本cwd/输出目录适配错误也保留，不当作产品失败。

## 独立候选身份

- 版本0.2.0-rc.2-openbkn.0.2.0-31，231535 bytes /82文件，SHA256 `22ba0e17235ccb3c93d585f2811604f5221375ac9e3496e92e6d8c1756196e4a`。
- 相对原-30仅lib/client.js、lib/types/client/locales.d.ts、package.json三个文件改变；所有Host JS与typert Remote文件相同，无新增/删除文件。详见[candidate-manifest.json](candidate-manifest.json)与[candidate-files.json](candidate-files.json)。
- 这是独立本地开发包，ciRun=null、formalAcceptanceEligible=false，未安装到既有Mac/Windows验收profile，不是新的正式CI候选。原-30的通过项不重做；后续只按差异复验受影响UI。
- [本轮单独补丁](local49-only.patch)、[源码差异](source-delta.json)、[开发源文件身份](development-source-identity.json)与[308 key/28文件文案清单](locale-inventory-31.json)留档；基点提交本身不代表完整未提交源码。

## 登录生命周期：进一步分开成功与关闭

没有修改生产登录流/SDK/Host/Job策略。使用原-30打包consumer、原始UI controller、两版官方ASAR boot/Connection/Gateway与固定源码common/Windows owner/runner，新增4组close/reopen边界检查通过：

1. UI成功时其operation signal未abort；成功首结果消费仍可在server active时发送cancel并触达注入的terminateJob。
2. 服务端已自然end/remove时，首结果消费者的迟到cancel被忽略，注入的非空Job仍让runner等待。
3. 后续close会abort UI保留的operation，但已dispose/remove的流没有额外wire cancel；reopen为idle，不再调用登录或状态。

这是对第48轮缺少真实UI controller的定向补证，不重跑旧完整矩阵。Windows API、Job状态、直接退出结果仍注入，无真实CLI/凭据/模型/平台；实际Job成员及浏览器关闭因果继续未知，不声称runner已修。数据见[ui-close-lifecycle.json](ui-close-lifecycle.json)。可用任务Node加原插件tsx loader运行[导出的探针](ui-close-lifecycle-probe.mjs)，输出目录必须全新。

## 其他UI观察分诊

[ui-triage.json](ui-triage.json)逐项记录：高级设置会检查可用CLI并把解析路径填入表单草稿，保存与安装仍需各自显式操作；未发现这条代码路径自动修改全局配置，Windows历史路径来源未独立核对。plain Node不能区分npm与Desktop后端，hostForm保留unknown并解释，不能从磁盘路径补造形态。通用nextAction仍是有界指导；新增历史观察说明不把被动pass变成当前认证结论。

## Windows只补变动和未知

[WINDOWS-MINIMAL-PLAN.md](WINDOWS-MINIMAL-PLAN.md)分开：W-UI未来收到-31后只验受影响标签/Escape/焦点/对比度/诊断说明；W-LIFE使用冻结-30，一个现有Desktop、用户确认日常Chrome的条件下，只补现成DevTools carrier/cancel与owned进程时间线。先无登录预检可采集性，缺入口即blocked。不开模型/G6/B1，不重跑argv、系统tar、原helper启动验收、四组合闭包或整套UI。

当前固定runner没有向外公开已核验Job成员接口；不复制/持有句柄、不启用新调试服务、不注入Host/runner、不强杀Job。无现成只读来源时Job成员继续UNKNOWN/BLOCKED，不编造脚本。Microsoft的成员结构/查询合同链接在方案内，只有只读方案设计，没有Windows执行。没有新交接分支或远端取件提交，当前无需用户操作。

## 逐项关单

#94按自身字典、状态、渲染和边界条件完成本地验证，可以独立关闭；Mac/Windows两形态实机与英文可读性总验收仍归#99，不把本地包当最终候选。#95保留Windows生命周期具体未知项；#93/#96/#97原生目标缺口、#98未确认历史条件与#99整体合同各自继续开放。已更新#94自身完成清单，发表英文证据评论并关闭；[关单回执](issue94-closure-receipt.json)记录CLOSED/时间/评论身份。#92/#93/#95–#99仍OPEN，见[当前状态](issues-current.json)。

## 上游与保留

两上游只读刷新：DSH master22ddee37、最新dsh-v0.2.1-rc.3与上轮相同，不升级pins；Foundry正式仍v0.2.0，未发布main新增一提交8fd261a8（48文件），涉及bkn-trace授权分页/内容过滤截断及schema版本迁移。定向审阅分页/读取文档与业务合同差异，不部署或套用到当前正式0.2.0；本轮没有刷新实平台tools/list或作新平台兼容声明。

主工作树原源码/包、所有原kit和验收profile保持；仅新增本轮证据/独立开发副本并更新状态入口。既有数据/配置/凭据未操作，未启动完整Host，不访问平台、不运行模型。索引/原HEAD保持，无commit/push/CI/tag/发布；受控浏览器只用任务IAB页，未触碰日常Chrome。原始测试日志在release/local-49，脱敏检查与输入保持见最终preservation/manifest。
