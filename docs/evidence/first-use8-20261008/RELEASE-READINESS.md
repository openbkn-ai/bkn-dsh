# -8 发布收尾

日期：2026-10-10（Asia/Taipei）。用户已授权合并 PR #82 并完成发布。范围仍为首次安装、配置、CLI 登录、原生使用与卸载；不改变插件或平台功能边界，不修订模型答案，不升级宿主。

## 固定候选与证据

| 项 | 身份与范围 |
| --- | --- |
| 插件版本 | `0.2.0-rc.2-openbkn.0.2.0-8` |
| 验收源码 / CI | `23ac2daa6d3538235f33a9627a8178a48f3e1ebf` / [37725960498](https://github.com/openbkn-ai/bkn-dsh/actions/runs/37725960498)，build-only |
| 候选 tgz | 175800 字节、66 文件；SHA-256 `6a946030a6152d2899609fac95c66cd246e36cca5a8ce4e5f87ed379cbe706ea` |
| macOS 验收 | [RESULTS.md](RESULTS.md)：官方 Desktop/npm，UI、Host API、受控运行、16 项 live guard 和模型评测分别记载；模型评测 6/8，不是完整 G6 通过 |
| Windows 最终证据 | 分支 `docs/first-use8-b1-windows-results`，固定提交 `af253c98a7acb89bfcaec5c07abe91c8a5cebb2c`；[首次使用](WINDOWS-RESULTS.md)、[B1 补测](WINDOWS-B1-RESULTS.md) |
| PR #82 | 已批准后 squash 合并；主线提交 `259511c388a0439b998388020e69925d25859276` |
| 支持的宿主 | DSH `dsh-v0.2.0-rc.2` / `639ed015397290b3745d163aafe02ffee4aa3f84` |
| 平台与 CLI | 原验收平台服务镜像见 [platform-images.json](platform-images.json)，真实 catalogue/guard 见 `live-platform/`；CLI 0.1.5；不以最新上游替代已验收版本 |

本次只接入脱敏后的 Windows 最终文件快照，保留原分支与历史记录；更正 verifier 数量为 8 份 JSON + 2 脚本，并补记最后一份 Git blob 比较文件的 SHA。不改变诊断 JSON、历史运行输出、候选清单、源码、包或 helper。

主开发独立复核：24/24 产品诊断 JSON 与固定 Git blob 的大小和完整 SHA 相符；本轮 before/after 为同一 37 个唯一路径，内容哈希 37/37 相同。B1 原生 Host 停止记录的创建时间、exe、listener 归属均匹配；工具调用记录为明确标注的 UI 人工转录。除清单自身外，B1 文件清单包含最后的比较文件；其他文本的 Windows 原件哈希与 Git LF 副本存在 CRLF 或混合换行差异，不能将它们称为逐字节相同。

入库检查：337 个 JSON/JSONL 文件可解析，列明的凭据形状扫描无命中；发布说明生成器 6/6 测试通过。派生文档和脚本执行 whitespace 检查；Windows 捕获的 `.txt` 输出保留原有行尾空格和文件尾空行，作为明确排除项，不为通过检查改写原件。

历史 `candidate-manifest.json`、Mac 记录和清单保留原捕获时点，不追溯把其 pending/未测字段改成通过。本文件和后续发布核验记录提供当前阶段状态。

## 已知限制与未验证项

- B1：长时间运行 Host 重登后鉴权拒绝的原异常保留；本次自然过期、同 Host 产品重登、新会话首次调用成功。根因未定，不宣称已修复。历史上重启恢复可作为遇到同类异常后的操作建议。
- B2：配置服务和 diagnostics 属于同一 owner；坏导入时首次配置不可用。已配置业务回退仅验证登录入口，完整故障态业务链未测。
- B3：关闭面板取消 CLI 登录；浏览器被同时关闭的归属/因果补证按用户决定暂缓。
- Mac Chrome 保存询问开启时的下载异常、G6 两项未通过和采购附加编码数差异、20 秒工具超时，按原件分别披露，不在插件内新增答案裁决或平台算法。
- Windows MCP 网络不可达分类、真实 403、Desktop UI 卸载瞬间两项文件保持性，以及历史 verifier/停止原生输出缺口仍保留。日常文件与收态结论只覆盖各轮实际清单及进程范围。
- 受限账号及此前平台/原用户故障机器根因沿用既定开放范围；无 license 平台的已测路径成功不代表企业专属能力全部开放。

## 发布执行顺序

1. 合入本批证据、计数修正与 CHANGELOG 已知限制；代码与包输入必须保持不变。
2. 对合入后的 main 执行 `release-plugin.yml`，`publish=false`；保存实际 run/commit 和下载 tgz，独立比对候选 66 个文件及声明目标。
3. 一致性通过后，对固定 main 提交创建版本 tag，由既有 OIDC workflow 发布到 npm `rc` 和 GitHub Release。
4. 下载用户实际安装的 npm 包及 GitHub 资产；包名/版本、66 文件、大小/哈希与验收候选逐项核对。仅允许 npm 对 package.json 的键顺序重排；其他内容变化停止 latest 迁移。
5. 包一致且发行物可下载后，最后迁移 npm `latest`，重新核对公共注册表的 `latest`/`rc`，保存发布核验与本机下载路径。

本文件提交时第 1 步正在收尾，尚未创建 tag、发布包或迁移 latest。后续实际执行结果另存发布核验记录；没有把计划写成通过。
