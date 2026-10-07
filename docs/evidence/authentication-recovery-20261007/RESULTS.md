# 明确鉴权失败的界面恢复修复

本轮修复 Windows 旧候选的实际症状：本地仍保存凭据，但 Context Loader MCP 返回 401 时，OpenBKN 面板仅有“重试/诊断”，需要用户另行执行 CLI 登录才能恢复。修复只保留已有鉴权分类并接入已有 CLI 登录入口。CLI 继续负责凭据与续期；插件不管理跨客户端 token 共享，不裁决模型回答，不增加业务算法。

## 输入与复现

- 旧候选 source `3414bdec3c956cc0d580aebd959ac6f3439bb352`，CI `37478119730`，tgz `6bbab278…` / 66 文件。
- Windows 固定证据 commit `09018faeeb476c6f93c4557b35c151f97839a8b1`，`docs/handoff/2026-10-07-unified7-final-verification/windows-results/b-batch/b3-desktop/d-token-invalid-panel-axtree.txt`：明确出现“重试”和未知原因提示，没有登录入口。该文件是旧包症状，不作为新包验收。
- 修复基线 main `27ca05486b09ab6ba9a0315ab310913f6e9b9dc3`。相关 auth/service/controller/overlay 文件自旧候选至该基线未改动。
- `regression-before-fix.txt` 保存从 CLI subprocess → AuthCoordinator → MCP manager → service Remote → UI controller 的受控调用链失败：4 项均失败。测试中的凭据为公开固定测试字符串，不使用真实用户 token。它补足跨层回归，不能替代真实 Windows UI。

## 修复与本地验证

- 已知 MCP 401/403 用不附带原始 cause 的安全错误保留状态；支持 SDK `data.cause` 包装。
- MCP 401 映射 `openbkn/authentication-required`，现有 UI 显示 CLI 登录并同步。登录后仍被拒绝时保持该状态，不伪报成功。
- 403 保留账号访问拒绝提示；TLS/连接/未知原因继续走错误与诊断，不推测重新登录能恢复。
- 平台目录请求的 401 和 403 分开，提示包含实际来源，不再把 MCP 401 写成“MCP 已连接”。
- 独立评审指出首版将目录 403 转到普通错误页会移除旧手动 Token 入口。修正后目录 403 保留既有凭据恢复视图，仍明确显示访问权限拒绝、建议管理员或已授权凭据，不保证重登同一账号恢复。MCP 403、TLS/网络分类保持各自语义。
- 全套插件 320 项：319 pass / 0 fail / 1 skip；repo + Node eval 63/63；typecheck、package:check、diff-check、pack 通过。`regression-after-fix.txt` 为集中回归原生输出。
- 最新上游核对：DSH master / 最新 tag `dsh-v0.2.1-alpha.1` 仍为 `5badb15009ae1756c3afe0ae0cef1faafc290ccc`；支持的 `dsh-v0.2.0-rc.2` 为 `639ed015397290b3745d163aafe02ffee4aa3f84`。Foundry main 仍为 `4a0db7799bc2f29aeeeb190bbecd8c7f6a90360f`，最新正式 release `v0.1.5`。本轮不升级 pin 或平台。

## 最终源码评审与 CI 身份

源码 PR [#76](https://github.com/openbkn-ai/bkn-dsh/pull/76) 的初版评审发现目录 403 手动凭据入口丢失，已修正。最终 head `f9da26a217f877606fe1e041e6eb886372fb1283` 获独立 APPROVED，审核/verify/CodeQL 通过，合入 main `c91fe090e0aac2dc72a4ff1b3d221d72baa432ba`。`source-pr-approval.json` 留存两轮评审各自的 commit，不能用初版状态接受后续 head。

build-only CI [37570295456](https://github.com/openbkn-ai/bkn-dsh/actions/runs/37570295456) 对该 main 构建并通过；`Publish to npm` 步骤和 `GitHub Release` job 均 skipped。最终 CI tgz（未二次打包）：

- version：`0.2.0-rc.2-openbkn.0.2.0-7`
- SHA-256：`fa168d8113e8dd43348ea4751c7e4d297049e2c1ddced9c586e6d3a1f3f0718c`
- 165804 bytes，65 文件；CI artifact ZIP 为 `0d2decd13210246bcec11aa68549aab0b2404124af03134c8a9d3635977c790e` / 166091 bytes，与 Windows kit ZIP 分开。
- 原件本地：`release/authentication-recovery-candidate/c91fe09/`；交接 kit 内原始 tgz/逐文件清单相同。

## Mac：本 CI 包的受影响实机验证

官方 `/Applications/DeepSeek Harness.app` / 应用内 CLI 0.2.0-rc.2，Host Node 24.18.1；真实应用继承隔离 DSH_HOME/BKN_CONFIG_DIR，不改 runtime、不启 inspector。安装前后的 65/65 文件、missing/diff/extra 为空，见 `mac-installed-identity.json` 与 `mac-installed-identity-final.json`。

1. **明确 MCP 401**：隔离 CLI store 已正常授权。测试 wrapper 只在 Host 的 `auth token` 输出替换公开无效字符串，不改 store、不模拟 SDK 品牌。真实平台 + 官方 SDK 的 auto negotiation 返回 401；面板写明 Context Loader MCP HTTP 401，显示原有 CLI 登录和手动 Token 入口，没有误写 MCP 已连接。失败产品报告 `d867ec03` 的 `context-loader/auth-rejected/httpStatus=401` 成立。
2. **产品入口与同 Host 恢复**：点击“使用 OpenBKN CLI 登录并同步”，在本平台浏览器走正常账号授权。第一次请求因浏览器窗口定位延迟而超时（exit 2）；保留偏差，之后从产品按钮重新发起并及时完成。只有真实 CLI exit 0 才自动删除 fault flag，未手工解除故障。同 Host PID 14056 恢复两个目录项；报告 `7a116535` 七项 pass，`context-loader recovered=true/lastFailureCode=auth-rejected`，CLI 也从首次未完成中恢复。
3. **TLS 边界**：退出第一 Host 后恢复原 patch/CLI，移除本进程 CA 再启动新隔离 Host PID 20719。面板保持错误/诊断分支，报告 `37de9124` 唯一失败为 `context-loader/tls-failed`，没有误当作 401 登录恢复。
4. **原配置健康轮**：恢复 CA，仍用原 patch/真实 CLI，另起 Host PID 22448。报告 `17e1ce66` 七项 pass、目录两个网络。此为新 Host 健康轮，不冒充 TLS 同进程恢复。
5. **四份真实下载**：均经产品“导出诊断报告”按钮与原生 Save dialog 落在 `/Users/kalias/Downloads/`，原始字节复制后哈希相同；路径、id、字节、SHA 见 `product-downloads.json`，Git 字节核对单列。不是 Host API 替代件。
6. **收态**：三 Host 的主进程/子进程/19387 listener 停止前核对 PID、exe、创建时间，native Quit 后全部 recorded Host PID 消失、端口释放，现态无隔离 CLI 进程；`mac-stop-*-before/after.json` 保留原生进程/监听结果。后续短时 CLI PID 未逐个留档，只能说 Host 家族闭环和终态 CLI 无残留，不能宣称完整历史瞬时进程审计。原 patch 字节恢复 SHA `ee08d266e84ed62d9e83b6c2350255db7615916a1990fd023e388098221f245c`；9 个选定日常路径 before/after 一致（4 个实际文件、5 个不存在项），不是整个 home 未变证明。

本轮临时 wrapper 与 CI 包外的 fixture 是受控输入。它证明真实 MCP 拒绝与产品登录恢复，不证明自然过期根因、自动续期、复制 token 因果或跨客户端共享安全。CLI 授权超时/取消的 UX 未改：首次超时尝试出现通用重试提示，重开面板再次核对 MCP 401 后才重新显示登录入口；本次未增加自动取消或超时恢复。真实 403 受限账号未测；401/403/后续仍拒绝/TLS/网络的各请求链由源码回归覆盖。

## 本 CI 包的官方核心与平台核对

- 官方 npm DSH 0.2.0-rc.2 / Node 24.19.0，65 文件复制到全新独立 peer bridge；prepare 的 `probePackage` 与实际 argv `--plugin` 相同。原生输出/工具治理 fixture **8/8**、exit 0；`ci-native-output-runtime.jsonl` 的 metadata 行不计作场景。脚本答案的 completed 只证明输出边界。
- direct 官方 ToolRuntime + 真实平台：**16/16 live guard**，exit 0，最终 `failed=[]`，平台操作记录只包含允许调用。无模型、不借受限账号；不能称 Windows 本机、真实模型或无权账号验收。
- Fresh tools/list 28 项 input/output schema 与基线语义一致（忽略 JSON 对象键序）。DSH / Foundry 当前 refs、正式版本见 `upstream-contract-check.json`，本轮未升级支持 pin。
- **新采平台镜像清单**：read-only `kind-bkn-dev` pods 全命名空间投影，49 个容器含 declared image、runtime image、imageID 和状态；核心平台 tag 为 0.1.5，实际 CLI 0.1.5。见 `platform-images.json`。已完成镜像采集，但标签/运行镜像身份不证明全部镜像由 Foundry main 构建；Completed init container 的 ready=false 不当作故障。

## Windows 旧证据与新交接

固定旧证据 `09018fa` 的可成立与须收窄内容见 `WINDOWS-OLD-EVIDENCE-REVIEW.md`。旧包真实 B 批已执行，不再笼统写 Windows 无凭据未测；仍须区分 npm 复制 store、旧 dshApps=6、A-only 37 记录/34 路径哈希、属性 receipt 缺独立核对与缺少源 Markdown。现态复测不补成历史时点证据。

新的两形态鉴权恢复 R1、原生输出 N0–N6、旧证据补正 E1 见 [Windows HANDOFF](../../handoff/2026-10-07-authentication-recovery/windows-kit/HANDOFF.md)。已有 native PS5.1-tested helper 逐字节保留；新 verifier、auth fixture 和本 CI 身份仍待原生 Windows 实测。旧 `6bbab278/66` 或 `3c345ef6/65` 不能接受本 `fa168d81/65`。

## 仍保留的边界

前一 `2813f3a/3c345ef6` 原生输出候选的五道原题 native completed 是历史验证，本鉴权改动没有重跑模型问答。**完整 BOM 仅返回一级九项，全量覆盖未通过；无匹配题夹带无关非零统计，原负向标准未通过；部分结构口径解释未证实。** 保留答案与独立评测，鉴权修复不证明质量已改善，不重新加入插件裁判、业务算法或自动纠错。

本候选 Windows 受影响复测待回传；受限账号按用户决定 not-run。历史故障机器根因、CLI token 续期/共享根因、设置向导重现、深层库存超时与平台 #2029 仍各自开放。本轮不扩大到自动 Token 管理或平台业务修补。发布、tag、dist-tag 尚未授权。
