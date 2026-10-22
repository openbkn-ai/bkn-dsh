# -12 Windows 增量复核交接

本文件取代此前“每种形态重跑 E00–E10”的必跑要求。固定官方 DSH **0.2.0-rc.2** 的 Desktop、独立 npm/Web，以及 OpenBKN/CLI **0.2.0**，只复核 -11 → -12 的客户端变动。**不执行 npm publish、任何 dist-tag 或生产 v* tag；全部通过也只回传。预期 rc=-11、latest=-10。**

## 下载与已有结果

- 原验收包继续使用，无须重新打包或重新下载已有的相同 ZIP：[windows-english12-acceptance-v1.zip](https://github.com/openbkn-ai/bkn-dsh/releases/download/review-english12-20261022/windows-english12-acceptance-v1.zip)。SHA-256：`43abbacd0018763057c540ad823bf229abc33e79e0e0aa0c77ecdad8b34996c0`。
- 插件仍为 `0.2.0-rc.2-openbkn.0.2.0-12`；内嵌 CI tgz SHA-256：`30a94300994296513b8d391acda69933acf1f4a77440e9da53486a0de5bd1a44`。源码 `5519645d58a8537c27c73626bc2dae7d90ddc242`，CI `39791127284`，全部 74 文件须匹配。
- 使用本次 [增量回传模板](https://github.com/openbkn-ai/bkn-dsh/releases/download/review-english12-20261022/DELTA-RESULTS.template.zh.md?download=1)，不再填全量 RESULTS.json。
- -11 基线为原始 english11-return.zip，SHA-256 `6a80537bce081b15f11aea16326363ed58ad723b8eaeac38b76d2e85a20d0ec4`。只引用其中实际已有的结论，不修改旧包，也不把旧 PASS 改写成本轮实测 PASS。

包对比已确认六个 Host/Remote JS、运行依赖和宿主 pins 未变；JS 变动集中于 lib/client.js。macOS 已完成精确候选的两形态界面/冷启动及四次新设备授权。Windows 仍实测下面四组客户端变动，不能用 Mac 结果代替。

## 最小准备：每种形态一次安装、启动和身份回执

沿用已验证的官方宿主、CLI、CA 和平台，不重装宿主，不重新下载/逐文件比对安装器，不重做整个平台工具契约调查。确认这些环境和 -11 时相同；若有变化或不确定，记录差异交维护端判断需要补哪一层，不自行扩成全量测试。

有已建好的本轮 -12 独立 TestRoot 就复用；保留 -11 原 profile 和原件。尚未准备时，仅按 ZIP 内 CHECKLIST 的第 1–3 节建立每种形态各一个新 TestRoot 并安装。E00–E10、双语冷启动和第二登录 root 的旧要求不再执行。每种形态只做下面这一轮真实登录，用同一个已安装候选 Host 继续其余检查。

在包目录执行一次 kit 校验，并记录前后 npm 标签；不把新模板放进只读包目录：

```powershell
node .\verify.mjs kit .
npm.cmd view @openbkn/dsh-business-context dist-tags --json --registry https://registry.npmjs.org
```

当前每种形态只需一套真实 Host/package 回执，不再收集 before/after 和 restart-en/restart-zh 全套。启动后运行（路径按实际 TestRoot 替换）：

```powershell
.\Collect-Receipt.ps1 -TestRoot C:\bkn-verify\english12-desktop -Phase delta
.\Collect-Receipt.ps1 -TestRoot C:\bkn-verify\english12-npm -Phase delta
```

只对正在运行的对应形态执行；它会自动核对已安装的全部 74 文件。后续进程快照、清理复用该 delta-host.json；没有换包或重启就不重复收集。脚本返回不代表宿主已就绪，真实回执和界面才是证据。

Web 仍用 Start-PrivateWebConsole.ps1 的独立私有终端启动，操作人本地打开 URL；自动化不读取/截屏该终端，不使用 Tee-Object、转录或重定向。CA 与 TLS 校验保持原状。

## 只跑四组：建议 D2 → D1 → D3 → D4

每种形态独立记录四组结果。各页面一次覆盖对应变动；无需在每个子项再重复完整的中→英→中矩阵。

| 组 | 一次连续操作与通过判据 | 最少证据 |
| --- | --- | --- |
| D1 面板状态/返回目录（原 E02/E03） | 从已保存合法配置的目录进入设置，输入未保存的 not-a-url 和 CLI 路径，展开高级设置、触发 URL 校验错误。Desktop 关闭→宿主切语言→重开；Web A 保持打开、B 改同一 Host 语言。草稿/展开/错误仍在且文案翻译。点 Back to networks / 返回网络目录，不保存即可回目录；输入一个搜索词并展开一条网络，再按对应方式切回语言，搜索/展开保留，原始业务名/ID不变。 | 表单切换前后、返回目录后搜索/展开状态；可用一段短录屏代替多图。 |
| D2 真实登录恢复（原 E05，一次授权合并时序） | 每形态只发起一次真实新设备登录：待授权时关闭再重开，仍连接中；Desktop 再关闭经宿主切语言，Web 用 B 切语言，确认同一请求仍连接中；然后保持面板关闭完成授权，确认不自动弹窗。手动重开直接到目录，无需 Refresh status，无重复登录/授权页。登录页同时检查英文 Platform URL: 后的空格。 | 连接中重开/切语言后、授权完成仍关闭、重开后的目录，以及登录前后进程快照。不回传授权页面、设备码、URL或凭据。 |
| D3 诊断保持/显示（原 E04） | 采集一次报告，记 reportId/createdAt；关闭→切语言→重开后仍同一报告，按钮/说明翻译，原始错误和状态不被改写。在深色宿主下检查文字及 × 可读。显式 Collect again 后产生新报告，只需导出最后一份 JSON。 | 原报告 ID/时间在切换前后相同、新报告 ID及一份导出。无需按两种语言分别全量导出/逐项复查诊断规则。 |
| D4 同一回合溯源状态/文案（原 E06/E07受影响部分） | 优先复用本轮测试 Host 已能打开的真实完成回合；切到非默认页签，如有非空图则选一个非默认节点。关闭/切语言/重开同一回合后，页签、可用选择和 Interaction ID 保持；检查中文交互 ID/请求/追踪/回执/操作/状态及关闭按钮。动态条数仅在现有数据可见时检查。 | 同一回合切换前后，缺数据子项单列 BLOCKED。无需重跑完整业务问答；只有确实没有可复用回合时，每形态最多补一条已有模型配置可执行的只读问题。模型未配好、计数不存在或图仍为空，就停止找数据，记录 BLOCKED。 |

D2 合并了“待完成时重开”和“完成时保持关闭”两段，**不再要求每形态第二个 TestRoot / 第二次设备授权，也不重复打开状态下的成功路径**。首个 -12 TestRoot 保持隔离未登录即可；若已登录且 D2 尚未测，只为该形态补一个未登录 root，成功后直接在它上面继续，勿清除/复制已有凭据。若该精确候选的 D2 已实际完成并有原证据，引用即可，不重新授权。设备请求超时原样保留，只重做失败的 D2，不连带重跑其他组。

D2 在连接中及完成后各运行一次以下快照（示例为 Desktop；npm 换自己的 root/receipt）：

```powershell
.\Snapshot-Processes.ps1 -TestRoot C:\bkn-verify\english12-desktop -Phase delta-login-pending -HostReceipt C:\bkn-verify\english12-desktop\evidence\delta-host.json
.\Snapshot-Processes.ps1 -TestRoot C:\bkn-verify\english12-desktop -Phase delta-login-completed -HostReceipt C:\bkn-verify\english12-desktop\evidence\delta-host.json
```

两条命令分别在真实对应时间执行，不连着补造。D2 的授权完成需操作者准备好账号，勿在等待设备码时做其余长检查。

## 本轮不重复跑的内容

- 安装器下载/重装、宿主整目录重比、完整 tools/list/schema 调查、完整 E00–E10、G6/多轮业务问题、两语言各冷启动一次：当前 Host/Remote、依赖、pins 未变，引用 -11 与维护端已完成的相应证据。只验证当前 Windows 候选确实加载。
- 不再为 Ctrl+C 建无插件控制实例；正常退出时顺手记录现象即可。既有 Windows runner/Ctrl+C 和本地 error/平台 completed 异常继续保留，未修复不写已解决。若本轮自然复现，只留脱敏最小错误、关联 ID/时间和进程证据，不展开额外调查。
- 不再为计数或非空图反复构造数据，不再强制开展 WebSocket 零请求专项抓包。这些仍标未补测/既有 BLOCKED，不因缩小范围变为 PASS。
- -11 Desktop E05 的 FAIL 必须由本轮 D2 实测替换；E02/E03 原因涉及的状态恢复必须由本轮 D1 实测。E04与溯源显示虽旧有部分通过，也受本次客户端变动影响，保留 D3/D4，不能直接沿用。

仅当候选内容、宿主/CLI/平台实际版本或契约有变化，D1–D4 失败，或旧 PASS 路径出现新异常时，补受影响的相邻检查；不自动整套重跑。更改插件产物后，仅重跑新变动影响的验收项并重新核对身份，不沿用旧候选截图。

## 清理与最小回传

每形态菜单正常退出 / Ctrl+C；若需要停止，使用同 root 的 delta-host.json：

```powershell
.\Stop-Host.ps1 -TestRoot C:\bkn-verify\english12-desktop -HostReceipt C:\bkn-verify\english12-desktop\evidence\delta-host.json
.\Stop-Host.ps1 -TestRoot C:\bkn-verify\english12-npm -HostReceipt C:\bkn-verify\english12-npm\evidence\delta-host.json
```

只执行对应形态，已正常退出也生成清理回执；按 PID/路径/创建时间核对，禁止批量杀 Node/个人实例。保留数据、失败和凭据，不打包凭据。停止 Web Host 后只关闭本次记录的私有控制台。

新建 english12-delta-return，按增量模板写 DELTA-RESULTS.md，仅回传：两形态各一套 Host/package 回执；D1–D4 的实际证据和缺项；D2 两次进程快照；各形态清理回执；前后 npm 标签；自然出现的新异常。相对路径引用，同一证据可以复用。缺少图/计数不妨碍回传，保留 BLOCKED 和已通过子项。

**不运行原 Review-Results.mjs 来审核增量报告。** 它要求完整 E00–E10、两次冷启动回执和全量 RESULTS.json，不适用本轮协议；不要补造 PASS、重启或证据让它通过。维护端仍会核对当前 Host/package 身份、增量证据和原始 -11 引用，增量通过不等于历史 BLOCKED 已消失或正式发布门槛已全部通过。

将回传目录压成新的 english12-delta-return.zip，提供 SHA-256、实际文件数和可访问的下载链接/共享路径。manualConfirmed 只由真正看过本轮证据的操作者填写；无论结果如何，不发布、不改 npm 标签。不回传整个 TestRoot、private、DSH_HOME、bkn-config、Electron 用户目录、cookies、session 全文、授权 URL或凭据。
