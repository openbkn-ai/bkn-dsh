# CLI-FAILURE-EXISTING-EVIDENCE — Windows -13 认证补测（copy13auth）已保留记录补查

- 补查时间：2026-10-24（本地），只读操作，未启动/重启任何 Host、浏览器或 CLI，未登录、未点重试、未新增任何采集或触发。
- 范围：仅两个原测试根本轮（2026-10-23T16:05Z–16:33Z 窗口）已落盘记录。未读取：私有启动控制台、凭据存储（`bkn-config\`，仅列文件名）、cookies（`electron-user-data\...\Network\Cookies` 等仅列名/时间，未读内容）、完整会话（`dsh-home\sessions\` 仅列名）、个人实例资料。原文件全部只读未修改。
- 关联：补查对象为已核验的 english13-copy-auth-supplement.zip（19 文件，SHA-256 `1663ae0fb827a71c57add77d76ac1e2d6ee6c4b535c9e6393c5b6c7ed132d35d`）。原包、原报告、两形态 BLOCKED 结论均不变。

## 一、结论

**两形态：本次原始 CLI stderr／命令行／子命令时间戳未保留，无法进一步定位原因。**

两个 root 在本轮时间窗内的全量 mtime 扫描（递归、排除 node_modules；`private\`、`bkn-config\`、`sessions\` 仅按文件名核过、内容未读）未发现任何 CLI 调用日志或 stderr 落盘文件。唯一保留失败细节的是两份已导出的诊断报告（被动采集），其中只含 exitCode 与稳定错误码，不含子命令、stderr 或登录尝试 ID——与维护端判断一致，以下不做重构成"完整登录日志"的尝试。

"未保留"有插件设计依据（本轮固定 -13 插件安装内的源文件，只读检查）：
`dsh-home\profiles\desktop\node_modules\@openbkn\dsh-business-context\lib\diagnostics-observer-vRub4cgb.js`
SHA-256 `69270547ec90067cc32af9386da6900dafaf558ef303af795ea8b4a9a8a2e4f5`
其中 `PassiveDiagnosticsBuffer` 为每进程内存 Map（"Bounded passive outcome buffer keyed by subject … shared per process"），不写盘；`sanitizeDiagnosticsEvidence` 白名单仅放行布尔、有限数字和 ≤64 字符的白名单字符串字段——子命令与 stderr 按设计不进入证据、不持久化。

## 二、各形态最小信息（缺失字段为 null）

### Desktop（C:\bkn-verify\english12-desktop，诊断 1b48a157）

| 字段 | 值 | 来源 |
| --- | --- | --- |
| CLI 失败日志来源文件 | null（未保留任何 CLI 日志文件） | 窗口内全量扫描 |
| 实际子命令 | null | 无记录 |
| 命令/失败时间 | 结果时刻可由已导出诊断推算：observed:cli = 2026-10-23T16:08:44.420Z（createdAt 16:10:37.654Z − lastOutcomeAgoMs 113234）；observed:login-state = 16:08:00.704Z（−156950）。命令发起时刻无记录 | OpenBKN-diagnostic-20261023T161037654Z-1b48a157.json |
| exitCode | 1（failureCount=1） | 同上 |
| 错误类型/稳定错误码 | `cli-execution-failed`（stage=cli）；另有 `not-logged-in`（stage=authentication，loggedIn=false，failureCount=1） | 同上 |
| HTTP 状态 | null | 无记录 |
| 脱敏 stderr / 错误消息 | null（未保留） | 无记录 |
| 能否对应本次登录尝试 | 部分对应，依据：① failureCount=1，仅一次 CLI 失败观测，与"只点击过一次登录"一致；② observed:login-state 结果（16:08:00.704Z）早于点击，对应面板首次打开时的本地登录态检查（回执 Collect-Receipt 完成于 16:07:55Z，面板随即打开），observed:cli 结果（16:08:44.420Z）晚于点击，对应点击发起的那次 CLI 调用失败。点击精确时刻无运行时记录（见第三节），该对应关系为合理推断而非日志证明 | 诊断报告 + 本轮回执时间戳 |

诊断原件（导出下载原件）：`D:\mydocs\downloads\OpenBKN-diagnostic-20261023T161037654Z-1b48a157.json`，SHA-256 `2ed45df29c71c916dfd8f792c9f935e8b5762c3d7089d3d3f2ebb1d7757feeb6`（与补证包内归档副本同源）。

### npm/Web（C:\bkn-verify\english12-npm，诊断 c348880a）

| 字段 | 值 | 来源 |
| --- | --- | --- |
| CLI 失败日志来源文件 | null（未保留任何 CLI 日志文件） | 窗口内全量扫描 |
| 实际子命令 | null | 无记录 |
| 命令/失败时间 | 结果时刻可推算：observed:cli = 2026-10-23T16:29:42.734Z（createdAt 16:30:01.553Z − lastOutcomeAgoMs 18819）；observed:login-state = 16:29:28.410Z（−33143）。命令发起时刻无记录 | OpenBKN-diagnostic-20261023T163001553Z-c348880a.json |
| exitCode | 1（failureCount=1） | 同上 |
| 错误类型/稳定错误码 | `cli-execution-failed`（stage=cli）；另有 `not-logged-in`（stage=authentication，loggedIn=false，failureCount=1） | 同上 |
| HTTP 状态 | null | 无记录 |
| 脱敏 stderr / 错误消息 | null（未保留） | 无记录 |
| 能否对应本次登录尝试 | 可以，依据充分：① 点击时刻有运行时记录 2026-10-23T16:29:42.324Z（本轮自动化回执原样时间戳）；② observed:cli 结果 16:29:42.734Z = 点击后 410ms，即点击发起的 CLI 约 0.4 秒即失败（快速失败，未及设备授权）；③ observed:login-state 结果 16:29:28.410Z 早于点击 13.9 秒，对应面板打开时的本地登录态检查（旁证：`dsh-home\openbkn\session-bindings\session-d5257770-….json` 于 16:29:01.227Z 写入，为面板打开时段的会话-网络绑定恢复记录，内容无失败信息）；④ failureCount=1，无第二次 CLI 失败观测 | 诊断报告 + 运行时记录 + 会话绑定状态文件 |

诊断原件（无头浏览器下载原件）：`C:\bkn-verify\english13-work\dl\OpenBKN-diagnostic-20261023T163001553Z-c348880a.json`，SHA-256 `79ee532ded4c87c07fd5e0e9b36dc9ce3659017082f1a1bd871e04e5f21b3416`（与补证包内归档副本同源）。

## 三、时序差异（仅用已有记录解释）

**npm/Web——可解释。** 维护端推算 CLI 结果 ≈16:29:42.734Z 与运行时记录的点击时刻 16:29:42.324Z 相差 410ms：CLI 在点击后约 0.4 秒失败。原报告"约 6 秒后失败"指的是自动化下一次读取 UI 时看到错误文案的时刻（约 6 秒后的轮询），不是 CLI 失败本身的发生时刻；失败实际是亚秒级快速失败。另 16:29:28.410Z 的 login-state 观测早于点击，属面板打开时的登录态检查，不是第二次登录。无未解释差异。

**Desktop——部分可解释，剩余保留未知。** 原报告"点击约 16:09:20Z"为事后估算值，无运行时记录支撑（npm 形态有自动化回执时间戳，Desktop 点击当时未记录时刻）——该估算很可能偏晚约 0.5–1 分钟，这是"点击时刻晚于诊断推算的 CLI 结果时刻（16:08:44.420Z）"这一表面倒置的原因，属估算误差，不构成存在第二次登录的证据（failureCount=1 亦排除）。可界定的区间：回执 Collect-Receipt 完成于 16:07:55Z → 面板打开、login-state 检查结果 16:08:00.704Z → 登录表单出现 → 点击（精确时刻无记录，区间 16:08:0x–16:08:44Z）→ CLI 运行数十秒 → 16:08:44.420Z exitCode=1。原报告"约 40–50 秒后变为错误"同样是跨工具调用的粗略观察，非计时记录。点击精确时刻：未知。

## 四、各形态实际检查过的本轮文件清单（均只读、未修改）

Desktop（相对 `C:\bkn-verify\english12-desktop`，SHA-256 前 16 位；完整哈希可另附）：
- `evidence\launch-20261023T160715134Z.json` `17262cd2507039fa`、`evidence\copy13auth-host.json` `e1d6b65fea972d2f`、`evidence\package-copy13auth-20261023T160755699Z.json` `7b392dd1305c36fe`、`evidence\cleanup-20261023T161702429Z.json` `c76d626fcd3234ec`（均已在补证包内，无 CLI 细节）
- `dsh-home\profiles\desktop\cordis.yml` `c300dcf2ebc5f020`（00:07:16 本地宿主启动时写入，服务装配配置，无失败信息）
- `dsh-home\profiles\desktop\node_modules\@openbkn\dsh-business-context\lib\diagnostics-observer-vRub4cgb.js` `69270547ec90067c`（固定 -13 插件源文件，用于"按设计不保留"的依据）
- 诊断原件（Downloads）：见第二节
- `electron-user-data\`：窗口内变更仅 Chromium 缓存/Preferences/Local Storage leveldb 内部日志/Session Storage 等（Cookies 仅核对文件名与时间，内容未读）——无应用级日志文件
- 按名核对未读内容：`bkn-config\`（凭据存储）、`dsh-home\sessions\`（完整会话）；两者窗口内无新增文件

npm/Web（相对 `C:\bkn-verify\english12-npm`）：
- `evidence\private-console-20261023T162005538Z.json` `34574baaddb4eb69`、`evidence\launch-20261023T162008080Z.json` `f2c477c2907062a8`、`evidence\launch-return-20261023T162008080Z.json` `c95444a2d7e03464`、`evidence\copy13auth-host.json` `1c4f4e15f6ecded7`、`evidence\package-copy13auth-20261023T162042003Z.json` `2dfc85ed0bc112d6`、`evidence\cleanup-20261023T163202837Z.json` `1c4d1a48a25cb028`（均已在补证包内，无 CLI 细节）
- `dsh-home\profiles\web\cordis.yml` `c300dcf2ebc5f020`（00:20:08 宿主启动时写入，无失败信息）
- `dsh-home\openbkn\session-bindings\session-d5257770-e008-4954-95fd-9baa126071be.json` SHA-256 `be8422583f16bf3ed4255a91e5a852fb9985823785b258d40fa713c46cd127cf`（16:29:01.227Z 写入；内容仅 schemaVersion/sessionId/平台地址/网络 ID supply_ontology_hand/显示名/boundAtSeq/recordedAt，无失败信息）
- `dsh-home\storages\workspace.json` SHA-256 `f41d8abe7f5e5ef97f4db92b7c8a636aba585cdd70e04942221f6c719072bdb7`（工作区索引，无失败信息）
- 诊断原件（english13-work\dl）：见第二节
- 系统临时目录（%TEMP%）窗口内文件逐一分类：`~RSD993.tmp`（UTF-16 下载器 ini，filepath 指向本轮诊断报告导出下载 `…\english13-work\dl\…c348880a.json`、downtool=msedge.exe——导出副产物，非 CLI 日志）与一个 0 字节被占用 tmp（无关）；无任何 dsh/openbkn CLI 相关临时日志
- 按名核对未读内容：`bkn-config\`（凭据存储）、`dsh-home\sessions\`（完整会话）、`private\`；窗口内无新增文件

## 五、边界确认

- 未启动/重启 Host、浏览器、CLI；未执行 auth login / auth token；未点重试；未新建业务回合；未重装升级；未重跑四张文案图、D1–D4、E00–E10、G6、冷启动。
- 未读取签名密钥，未签发/注入 cookie；未删除、轮换或复制凭据。
- A7、runner、Ctrl+C 及历史 BLOCKED 保持原处置；未 publish、未写任何 dist-tag、未打生产 tag（本轮按要求未重复查询 npm 标签）。
- 本文件为新增独立文件，不覆盖旧包、不改人工确认字段、未自动公开上传。
