# 核对来源与证据范围

核对日期：2026-10-05，Asia/Taipei。本文件区分当前静态检查与历史实机记录；后者不是新候选验收。

## 发行与源码

- [-4 GitHub Release](https://github.com/openbkn-ai/bkn-dsh/releases/tag/v0.2.0-rc.2-openbkn.0.2.0-4)：已发布，源码 `a134f5d573e11846bb6665d1c170510149d09d4d`。
- [npm -4 元数据](https://registry.npmjs.org/@openbkn%2fdsh-business-context/0.2.0-rc.2-openbkn.0.2.0-4)：本轮取回 dist tarball，在内存解包核对版本、52 个文件及 SHA-256 `53ce847b8d884ba7f1cb43048b5e60380c0c297142671a2b9d0abbea9692a013`；exports 中没有独立诊断出口。
- 本轮 `git ls-remote`：bkn-dsh main 与 -4 tag 的 peeled commit 同为 `a134f5d…`；annotated tag 对象是 `ddaf812626119bcfd32a2e6e20c5a04a0f1ebf05`，不能把 tag 对象当源码 commit。
- DSH 支持 tag `dsh-v0.2.0-rc.2` / `639ed015397290b3745d163aafe02ffee4aa3f84`；master 观察值 `5badb15009ae1756c3afe0ae0cef1faafc290ccc`。
- OpenBKN [bkn-foundry](https://github.com/openbkn-ai/bkn-foundry) main 观察值 `8850188212ff51480ad7bb742b025a0ce1ce187f`。本计划核对了远端 HEAD，没有完成其相对既有基线的全部契约 diff 或本机部署核验；这是 D0 的工作，不能称最新平台兼容已通过。

## bkn-dsh 当前结构（相对 Git root）

以下文件在反映 -4 的文档 worktree `05b219ab27228075f127796e2196cba670a5d8f7` 中检查；开发必须回到发行源码并核对差异，而不是依赖该临时目录。

| 文件 | 与诊断相关的观察 |
|---|---|
| `packages/openbkn-business-context/src/index.ts` | 顶层导入 Config/业务服务，主 apply 依赖 agents/subprocess/storageDomain，独立诊断不能依赖该入口成功 |
| `src/business-context-service.ts` | RemoteError 已带部分阶段；status 有同步凭据的行为；登录/目录/MCP 可复用分类观测边界 |
| `src/auth.ts`、`src/openbkn-cli-subprocess.ts` | CLI stdout/stderr、cause 可能带秘密，不能把原文带入诊断 DTO；expired 缺失已有兼容 |
| `src/platform-reader.ts`、`src/openbkn-mcp-manager.ts` | 目录请求与 MCP 生命周期是不同失败阶段 |
| `src/client/index.tsx` | 现有 UI 注册依赖业务 Remote 以及会话相关服务 |
| `src/client/openbkn-ui-controller.ts`、`src/client/OpenBknOverlay.tsx` | 有部分分类，但仍有通用 Token/平台兜底，错误页没有诊断导出 |
| `package.json`、`tsdown.config.ts`、`cordis.patch.yml` | 单一主 Host row/入口，新增诊断需同时验证 exports/files、生成器与客户端 |
| `.github/workflows/release-plugin.yml` | build-only 需 publish=false；先构建 pinned generator，再测试和 pack；v* tag 会发包，不能当彩排 |

表中 `src/`、包内配置和测试路径均位于 `packages/openbkn-business-context/`，除非明确给出了仓库根路径。

## DSH 支持宿主的边界

- [plugin-inventory](https://github.com/deepseek-ai/deepseek-harness/blob/639ed015397290b3745d163aafe02ffee4aa3f84/packages/host/plugin-inventory/src/index.ts)：元数据和 fiberPhase 不等于完整启动异常接口。
- [Cordis fiber](https://github.com/deepseek-ai/deepseek-harness/blob/639ed015397290b3745d163aafe02ffee4aa3f84/vendor/cordis/src/fiber.ts)：内部错误字段与加载/配置生命周期需单独验证，不是稳定的公开诊断契约。
- [desktop host-process](https://github.com/deepseek-ai/deepseek-harness/blob/639ed015397290b3745d163aafe02ffee4aa3f84/apps/desktop/src/host-process.ts)：不能假定普通桌面版开启 inspector 或总有可直接读取的组件原始日志文件。

## 既有用户报告

用户在 Windows 测试机上三次运行旧的外部自检 v1：

| 文件 | 用户确认状态 | 能支持的结论 |
|---|---|---|
| `OpenBKN-diagnostic-20261005-114705-12f9fc.json` | DSH 未运行 | 正确发现没有运行中的 desktop Host |
| `OpenBKN-diagnostic-20261005-114836-20b963.json` | 桌面已运行，插件未安装/已卸载 | 找到 Host，未找到插件符合该状态 |
| `OpenBKN-diagnostic-20261005-120002-08c269.json` | 安装 -3 后 | 52 文件与发行一致、静态 baseUrl 格式合法；未取得组件运行时状态或启动错误 |

原始文件在用户提供的 `/Volumes/share/`，完整证据摘要和三份 SHA 见同级父目录 [后续版本规划](../2026-10-05-next-version-updates.md)。本交接包不携带原始用户报告或任何状态文件。

最初用户截图显示 -3 组件异常及通用错误，根因仍未知。测试机第三份报告不能证明该用户的故障已复现或解决。外部自检 v1 的模拟 Host/脱敏测试与真实 DSH 故障验收是不同证据；也不能用现有 52 文件匹配关闭新诊断目标。
