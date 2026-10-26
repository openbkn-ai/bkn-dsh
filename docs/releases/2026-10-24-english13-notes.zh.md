# -13 英文版发布说明

版本：`@openbkn/dsh-business-context@0.2.0-rc.2-openbkn.0.2.0-13`。支持与实测范围固定为官方 DSH `0.2.0-rc.2`、OpenBKN `0.2.0`，覆盖 macOS 和原生 Windows 的 Desktop、npm/Web。

插件跟随 DSH 的中英文语言设置，覆盖入口、网络目录、设置与 CLI 安装、诊断、上下文卡片、会话建议及已有溯源页签。平台事实、网络名称、原始 ID 和模型回答保留原文。

本版合并 -11 的英文资源、已验收 -12 的浮层状态恢复及 -13 的中文说明收尾。Desktop 关闭浮层去切换宿主语言后，草稿、校验错误、目录状态、诊断报告和溯源视图可恢复；进行中的 CLI 登录继续完成并同步。最后一处“平台执行事实”说明已完整使用中文，英文原句保持不变。

## 验收与包身份

- 已验收源码：`91b2297b3070277ce0cba25a986bcaec35256f05`。
- 候选 CI：[39968315495](https://github.com/openbkn-ai/bkn-dsh/actions/runs/39968315495)，`publish=false`。
- 候选 tgz SHA-256：`8290a0b89d9af5118b0aeabc09499c5085114047f469fe631835b808f52d3675`，共 74 文件。
- macOS 两种形态的精确候选已验收；Windows 两种形态的完整中英文目标句及 Host/package/cleanup 回执已独立复核。未受影响行为沿用 -11/-12 的对应基线。
- 正式构建与验收候选的逐文件比对见[发布准备记录](../evidence/2026-10-24-english13-release-preparation/RESULTS.md)。内容一致可复用验收；内容变化时只复核受影响范围。

## 保留的已知问题与边界

- Windows 登录命令的承载进程可能常驻到宿主退出；Ctrl+C 可能无法停止 npm/Web 宿主。需要时仅按身份停止自己的测试进程树。
- Desktop 浮层仍为模态，切宿主语言需要先关闭浮层，再重开。
- 当前数据没有覆盖带条数的时间线摘要和非空图选择，相关实时分支继续 BLOCKED；本版不声称新增全量业务或模型 G6 验收。
- Web 诊断可能无法识别宿主形态或加载版本，原始 null/unknown 保留。
- 固定 DSH 的 MCP 依赖栈使用 `@modelcontextprotocol/client@2.0.0`，存在上游 [OAuth 签发者绑定](https://github.com/advisories/GHSA-6qxp-vccf-f47h)和[跨源重定向](https://github.com/advisories/GHSA-6prh-2h8m-c8cw)安全提示。SDK 由宿主提供，没有打入插件包；插件使用显式 Bearer 头，没有配置 SDK OAuth provider，但不能据此宣称 HTTP 重定向风险已修复。宿主/SDK 安全更新需单独评审兼容性，不在本次已验收包中静默升级。
- 自签平台需要将正确签发 CA 配给 Node，并新启动宿主。保留证书校验；设备授权须在平台给定的有效期内完成。Windows 本次 TLS 问题通过修正本机 CA 集合解决，没有为此修改插件或关闭校验。
- A7 指定的重复 start 事件属于已有交互未结束时的预期守卫拒绝，保留原 error 和 dispatch=unknown。历史未保留的响应、进程环境继续记为未知。

六个 Host/Remote JavaScript 文件、依赖及 DSH pins 与 -11 一致。开发分支的 0.2.1 兼容、原生溯源和 CSV 导出不在本版范围内。

## 发布顺序

本文是发布准备说明，不表示 -13 已发布到 npm。获得明确发布授权后，先按现有流程发布到 rc；核对注册表正式包与已验收正式构建逐文件等价后，再单独提升 latest。本次准备不改任何 npm 标签。
