# -3 CI 与远程发布前 E2E

2026-11-02。状态：提交前准备；CI run/artifact/SHA待实际产生后补记，不能使用历史7f5本地包冒充。分支 `feat/provenance-platform-parity-live`，基于 `bc5e67b`，含原main之后已本地验证的managed-tool/CSV修复。新manifest为 `0.2.1-rc.3-openbkn.0.2.1-3`，已发布-2及历史试验包不变。

提交前验证：默认插件测试770项，769通过/1 Windows专项跳过（已含原源码旁10项）；完整仓库79/79、范围保护2/2、包审计126文件通过。本地-3参考包SHA256 `4fd73c118a08238738a5c78c06b7d95dacdc98276aa6d065669d059060e95d41`，相对已实测7f5候选仅package.json版本/测试脚本不同，其余125文件及生产运行资产逐字节一致；仍需接受CI产物，见 [PRE-CI-DELTA.json](./PRE-CI-DELTA.json)。

## 授权与执行责任

维护者明确授权提交、推送、远端CI出包及指定远程会话 `01a15340-6507-7660-a68d-68994e283415`（DominicZhangdeMac-mini.local）执行发布前E2E；随后明确选择“允许在隔离测试会话对应的样本记录上执行这两项”，两项是生成/更新依据、开始BKN Agent分析。允许这些动作新增平台解释/分析记录并调用模型，原问题、回答和业务数据不变。

主会话负责提交/推送、`release-plugin.yml` 的 `publish=false`、下载实际artifact、摘要和逐文件比对、独立接收结果。远程会话负责真实DSH/平台E2E、脱敏证据与剩余项。不得据此合并、打标签、发布、改latest、应用建议、升级平台/Host或替换日常profile；代码若有后续修复，必须新CI产物并重验受影响项。PR与commit内容英文，聊天与用户记录中文。

## 固定产物与环境

1. 主会话提供commit、CI run URL、artifact ID/name、ZIP摘要、内部tgz摘要/文件清单；远程重新下载并核对，而非npm安装当前latest。
2. 保留既有工作树和用户改动，在独立checkout、DSH_HOME和Electron user-data-dir安装CI包。记录官方CLI退出码、126文件或实际新清单逐文件摘要、独立进程/Host路径与新UI/Remote实际执行。
3. 核对实际Desktop版本及build commit、Node/CLI、平台URL/部署版本及可见知识网络/账号范围。不把上游tag、加载成功或旧本地测试等同当前功能验收。不得输出token、cookie、私钥、认证文件或完整业务payload。
4. 本机历史Mac rc.5 build为d4db512a969fccf0c5cc7ec8fe38e9c1d27af916；官方rc.5 tag为b830ec950faba0a46dda564be3e2d854afed94f1，二者不可混称。实际平台来源基线与部署另行记录，不能根据版本串推断字节一致。

## 真实验收清单

- 从已有第一/第二回答分别打开准确Interaction；左侧轮次、原问题/回答、时间链、调用状态/原因/Operation ID与平台同记录对照。不要默选最新轮或把空列表解释为无记录。
- 搜索、partial/truncated、清空、翻页、显式刷新、切轮、关闭/重开及会话切换：保留准确选择，取消旧请求，迟到结果不得串轮/串网络。
- 普通调用与managed function父/内部调用分别展开和独立选择；失败0筛选、原输入/输出/错误、缺失记录按平台保留。不能以模型回答正确或错误裁决平台业务事实。
- 若同平台仍可见，可用双轮conv_1c027aaa36b601844ad14dbe3f0cc7f5（int_e44fec6083bba2588f962c49343cddeb / int_958d25790acbb7b76b481f68c7cc655e）及BOM大记录conv_06cbbfa3d5e06fd17377ea0e12daab60 /int_794daf4c8064143c6f2ae3b291fb0ce3。大记录历史为9067369字节/59operations/59timeRail，平台/插件43顶层分组；若不存在或权限不同，忠实报告后选有明示平台关联的隔离样本，不伪造ID。
- 两种原文Popover、分析面板、证据/图谱局部全屏的Escape层级与焦点还原；modal双向Tab不得跑到外层关闭；SourceText非模态Tab行为保留。检查窗口缩放/窄布局和外层Host不受CSS污染。
- 真OS剪贴板和原生Save对话框：与平台同记录Markdown字节/摘要一致，不能把浏览器Clipboard API空值当OS失败。测试草稿不发送，结束清空；文件保存到隔离路径、不覆盖原件。
- **新授权动作**：在隔离样本上从未生成解释开始，点击生成/更新依据，核对平台状态、解释原文/invalid原因、阅读/图谱、步骤/来源/证据选择联动；已有记录不删除。不得本地重裁invalid或补写关联。
- **BKN Agent**：先点“交给BKN Agent分析”，证明仅开侧栏；再显式点“开始分析”，记录真实POST与流式token/tool_call/structured/error/done可见结果及分析history ID。事实输入来自平台原始Markdown；不把证据链Agent判断当输入，不自动应用建议。失败应保留原平台原因，不用插件改成成功、不自动重试；有实际失败则保留并分诊。
- 认证、证书、网络切换/慢请求和取消：优先只读/隔离条件，不能为制造异常修改日常凭据或关闭TLS。无安全可执行条件则标UNKNOWN，不用fixture填PASS。
- 本轮不重跑已通过的业务问题/CSV模型验收，不扩大业务数据写入；原受保护模块的自动回归、包差异核对与既有证据分别报告。

## 结果要求

逐项PASS/FAIL/UNKNOWN及证据层级（源码/受控/原生/平台对照），记录候选commit和SHA、环境/安装/进程、所用Conversation/Interaction/Operation/analysis ID、屏幕与原文摘要。保留失败前后、超限/partial及平台Markdown异常；私有原件留本地，Git只放脱敏结果/必要样本截图/摘要。最后正常退出隔离Host、恢复日常窗口，核对原包和会话内容。只做Mac不能声明Windows通过。

平台历史搜索返回projection_scan_cap_reached；BOM平台Markdown含700处“请求失败。”文本。二者均为已观察的上游输入/响应，需如实核对和报告，不允许插件清洗或改写。HTTP错误安全分类及detail不可读时KN预检拒绝Markdown/动作仍为明确适配差异，见原开发记录。
