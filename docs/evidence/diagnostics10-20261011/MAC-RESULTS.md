# -10 Mac 验收结果

本轮只修改诊断基础信息的显示。Mac 官方 npm 和桌面 Host 的正常、业务坏导入、产品导出均通过。B1 短时原生 CLI/MCP 边界探针未复现，根因仍未知，未修改鉴权或 MCP 生命周期实现。候选未发布。

## 固定对象

| 项目 | 值 |
| --- | --- |
| 源码 | `4daccf6b794ee7e9d55b9c7a45f29f5403c6d2a0` |
| 版本 | `0.2.0-rc.2-openbkn.0.2.0-10` |
| build-only CI | [38106903958](https://github.com/openbkn-ai/bkn-dsh/actions/runs/38106903958)，success，`publish=false` |
| tgz | `openbkn-dsh-business-context-0.2.0-rc.2-openbkn.0.2.0-10.tgz`，184146 bytes |
| SHA-256 | `b2d90c19d19bd473de38f519b9a4abb4b8a25c8468cd80195fefb7641e3bcdeb` |
| 文件 | 70；完整身份和逐文件清单见 `candidate-manifest.json`、`candidate-files.json` |
| npm / Desktop Host | 官方 DSH `0.2.0-rc.2`；版本由 npm 包和 app Info.plist 独立读取，未冒充诊断采集结果 |
| 隔离 root | `/private/tmp/bkn-diagnostics10-mac/npm`、`/private/tmp/bkn-diagnostics10-mac/desktop` |

## 静态与运行验证

- build、typecheck、package:check、pack、diff-check 通过。
- 插件 417 tests：416 pass / 0 fail / 1 既有 skip；仓库 60/60 pass。
- 两形态安装后及故障变体还原后均 70/70 字节哈希一致，missing/diff/extra 均空；见 `npm-identity.json`、`desktop-identity.json`。
- 展示帮助函数新增 3 个测试：Windows 名称不推断位数或形态；缺值不借磁盘版本补齐；磁盘/已加载版本独立展示。
- 本轮没有模型问答，不需要模型 Key。未重跑历史 G6、CLI 安装矩阵或平台权限矩阵。

## 实机矩阵

| 场景 | npm | Desktop | 判定边界 |
| --- | --- | --- | --- |
| 基础信息 | `393c8968` | `896a1443` | npm 为“未识别（宿主未提供形态标识）”；Desktop 为“桌面版”；两者 OS 为 macOS，磁盘版本 -10；DSH/已加载版本缺值均解释原因 |
| 未配置基线 | pass | pass | bootstrap/business/diagnostics 正常；配置和依赖配置的检查为预期 not-run，未宣称登录成功 |
| business 坏导入 | `7ec3a884` | `8af746b2` | 只在已安装 `lib/business.js` 追加不存在模块导入；business fail/module-resolution-failed，bootstrap/diagnostics pass，基础信息仍可见 |
| 产品 UI 导出 | pass | pass | 四份真实产品导出 JSON，未以 Host API 替代；原始 platform=darwin、hostForm 和 null 保留 |
| 还原 | 70/70 | 70/70 | 停止故障 Host 后还原原字节并核验；本轮未另启恢复 Host，不能声称已做恢复态 UI 复验 |

截图、DOM/AX 原件及产品 JSON 与表中场景同名。四份导出的原始下载绝对路径、reportId、bytes、完整 SHA 和原件比对见 `report-provenance.json`：4/4 逐字节一致。Downloads 中的原件保留。

故障输入见 `desktop-fault-identity.json` 和 `npm-fault-identity.json`。Desktop 前后哈希当场采集；npm 变体哈希为还原后按保存的健康字节和确切追加内容重建，不能称为当场原生哈希档案。

## B1

见 `B1-REPRODUCTION.md`。固定 CI 包的三个真实 start/finish 对均成功，诊断 context-loader pass。它是生产方法 + 官方 Cordis/MCP/工具/凭据服务的边界探针，绕过业务服务构造器的工作区/Agent 注册，不是完整 UI Host、自然过期重登或真实模型验收。约 8 小时 Host + 到期后闲置约 6 小时的历史条件留给 Windows 单独复现。

## 偏差与收态

- npm CLI 对 desktop profile 的安装拒绝属于官方管理边界；随后改用真实 Desktop 插件管理器安装同一 CI tgz，成功并核验 70/70。
- 两形态重启均再次出现官方欢迎页；通过“稍后配置”进入，未修改向导或配置模型。
- Desktop 一次 UI 状态改变使点击未执行，刷新状态后重做；两形态最终导出成功。
- 边界探针准备阶段有两次 finish 参数构造错误，创建的两条测试 Interaction 未被探针及时完成；平台后续将它们置为 abandoned（requestCount=0）。只读确认后通过真实 CLI 关闭对应 Conversation；见 `b1-preparation-cleanup.json`。后续两轮各三个 start/finish 对均正确完成。此偏差不归为插件缺陷。
- 四个 Host 的 PID/创建时间/argv 与停止结果见各形态 `process-history.jsonl`、`stops.jsonl`。npm 另核监听端口；Desktop 未做 listener 身份核验，不声称四项全核。
- `user-state.json`：仅开测前选定的 8 个路径前后存在性/内容哈希一致，不延伸为整机或全部 profile 无变化。
- `residual-check.json`：本轮两个隔离 root 相关进程为零，npm 18330 无监听；未停止日常或其他任务进程。
- 未改网络设置、日常 CLI、DSH 源码或 OpenBKN 平台；既有临时回环映射和 CA 路径继续沿用，未扩大信任或关闭 TLS 校验。

## 仍开放

Windows 展示实测及 B1 完整 UI 长时间运行复现；B1 根因未知。DSH 隔离、卸载 EPERM、平台 token 策略/超时及其他 P2/P3 不在本轮。-10 未发布，合并与正式发布另行决定。
