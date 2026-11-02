# -3 CI 与远程发布前 E2E

2026-11-02。状态：第三轮CI [41404675956](https://github.com/openbkn-ai/bkn-dsh/actions/runs/41404675956) 已成功，固定源码 `f13fe10c4d6041fd7ce7be5007e0740051ec29c0`。实际artifact及独立包审计通过，已放行远程隔离安装与真实E2E；结果尚待回报。前两轮失败和受控复现保留，不被本轮成功覆盖。分支 `feat/provenance-platform-parity-live`，基于 `bc5e67b`，含原main之后已本地验证的managed-tool/CSV修复。新manifest为 `0.2.1-rc.3-openbkn.0.2.1-3`，已发布-2及历史试验包不变。

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

## 首轮 CI 与评审修正

首轮CI为767通过/2失败/1跳过，两个首项在原1秒等待条件内找不到就绪heading；慢响应受控复现与官方Node22专项修复见 [CI异步就绪修复](./ci-readiness-fix/README.zh.md)。没有跳过、自动重试或削减断言。

独立评审指出正常原生路径覆盖了旧版降级入口：Community路由404、Trace关闭/缺锚点、绑定/认证不可用时不应把已有local timeline挡在通用错误后。本轮补最小受信Host降级路径及拒绝/迟到/跨轮回归；身份变化、平台不匹配、未披露、权限拒绝或未知错误不得自动改读其他记录。正常原生路径不重复读取旧view。

包许可证标识改为 `SEE LICENSE IN LICENSE`，LICENSE同时列明插件Apache2.0与复用Studio的OpenBKN条款，原始许可证文件保持不变。README明确 -3 尚未发布、只能安装本次核对的CI tgz，旧npm命令保留已发布-2。已内联UI依赖仍固定在当前runtime dependencies中，安装额外依赖树的非阻断体积问题保留为单独后续项，本轮不调整依赖图。

修复后提交前完整验证：官方Node22.19.0/pnpm11.7.0，809项中808通过/1 Windows专项跳过；完整仓库79/79、范围2/2、包审计126文件通过。新本地参考包e68bd4d9bf75a67e125beb39726a9f8aa05c83e4547aa6b0a841629dd85f3c02，相对首参考仅LICENSE、两份README、package.json、client.js与locales.d.ts不同，Host business.js及其余120文件不变。见 [PRE-CI2-DELTA.json](./PRE-CI2-DELTA.json)，仍待新CI和其实际包的E2E。

## 第二轮 CI 与动作就绪修正

第二轮CI41403246674（f330eff）为807通过/1失败/1跳过；首轮就绪项与新增39个fallback都通过。剩余scene-list首项只等按钮存在，在初始解释GET期间点击了禁用按钮，故没有generate请求。deferred GET确定复现后，测试保留禁用时不POST/读取后不自动生成的负向断言，再等待enabled进行一次有效点击；没有加timeout、skip或retry。官方Node22受影响文件2/2，其他动作测试已确认有现有就绪屏障，未改。见 [动作就绪回归](./ci-action-readiness-fix/README.zh.md)。

此后只有测试与证据变化，f330eff生产实现、manifest、依赖和本地e68bd4d9参考包保持不变；新提交仍需新CI产物及远程E2E。此前f330eff的完整本地808/1与本次受影响2/2分别留证，不伪称新commit的完整CI已通过。

## 第三轮实际产物与交接

- source：`f13fe10c4d6041fd7ce7be5007e0740051ec29c0`；CI41404675956成功，publish=false；发布步骤与GitHub Release job跳过。
- plugin-tarball artifact ID `13122759006`，ZIP SHA256 `8122149c1d1db499173ea9225af807ac63f812aee8d235862188f88c26c609ac`，877186字节；与GitHub artifact digest一致。
- 内部 `openbkn-dsh-business-context-0.2.1-rc.3-openbkn.0.2.1-3.tgz` SHA256 `fea3d0052efc7188e989bd2582be8c6930eea03b903418103da4c28fc96b61a1`，877043字节、126文件。与e68本地参考126/126内容及整段解压tar完全同字节；仅gzip OS头Mac0x13/Linux0x03导致压缩归档SHA不同，交接始终使用CI实际fea3包。
- 插件809项：808通过/1Windows专项跳过；仓库79/79；profile MCP companion1/1；包审计126文件通过。Linux/Node22.19官方npm rc.2与rc.3各6项受控检查通过（脚本模型/替代平台），不作为Mac/Windows或真实平台/模型验收。
- 独立QA已给无包放行阻断的结论；实际文件、许可、metadata和源范围见[包身份](./CI-ARTIFACT-IDENTITY.json)、[独立审计](./CI-ARTIFACT-QA.zh.md)、[CI结果](./CI-RESULT.json)。
- 已通过Codex线程工具将上述commit/run/artifact/ZIP/tgz摘要、授权动作和验收矩阵交给指定远程会话；接下来由其核对、隔离安装并实际执行。未在此回执中预填E2E通过，未合并/发布/变更latest。后续文档回执提交不改package/runtime，CI产物仍固定f13。

远程接收进展：已独立确认ZIP/tgz摘要、尺寸和126文件清单，正在隔离安装。主机双轮/BOM记录来自另一台DSH，其远程本地合法Session关联尚待确认；可复用远程现有其他真实关联样本，不能注入handle或把API可读记为DSH E2E。尚未开始/完成的项目继续保持待验收。

## 远程当前人工登录前提（等待用户）

远程已核对实际ZIP/tgz/126文件，但首次官方CLI安装exit1：该机rc.5明确禁止CLI修改由Electron独占管理的desktop profile，未写入插件。改走官方Desktop插件管理时，空隔离profile需先完成欢迎页DeepSeek登录。授权页已打开，最后登录同时涉及条款和客户端模型调用权限，必须由用户本人操作；不代点、不复制API凭据或替换日常profile绕过。主会话与远程均已提示并等待用户完成登录。

因此当前不是E2E通过或已经完成安装：归档接收通过、安装受前置登录阻塞、真实UI/生成/分析尚未执行。此前生成/更新依据、BKN Agent分析授权仍有效；用户登录后可继续。远程若缺现成合法Session，可通过官方DSH界面在独立profile做至多1—2短轮只读KN结构元数据样本，正常形成真实关联，不能注入ID、不重跑业务/CSV问题。CI结果与不发布边界不受此人工前提影响。

远程补充确认：已找到合法历史DSH完成回执，关联平台可读Interaction（6条操作、解释not_generated、分析历史空），没有注入或修改会话。因而不需要为解锁入口额外制造业务样本；当前前提仍是官方欢迎页本人登录，安装与真实E2E均未开始。该状态来自远程会话回报，不作为主机独立原生观察或E2E通过。

## 用户完成登录后继续（2026-11-02）

用户在主会话明确回复“已在远程授权页完成登录”，主会话已通知远程核对并继续原固定产物，无新授权或版本变更。远程随后回报OpenBKN授权成功、两个网络目录可见；历史会话在绑定前已打开时显示BINDING_REQUIRED及旧降级视图，完成绑定并正常重开隔离实例后，新的“业务溯源分析”窗口实际显示6调用、原问答和Operation详情。保留前后现象；不将其泛化为包缓存故障或声称在绑定时已自动更新会话。

当前真实UI与平台原文对照、生成依据、Agent分析等继续执行；先前等待本人登录为历史检查点，不再要求重复确认。以上为远程进度回报，完整矩阵/原件/剩余项仍待接收，不预填全量E2E通过。

## CI3 真实验收与分析焦点修复（2026-11-02）

远程在合法6调用历史会话上执行了真实原生窗口、原文、Operation选择、零失败空结果、partial搜索保留、OS复制/原生保存、一次解释生成和一次Agent分析。原问题、答案、6操作及时间链据回报与开始前一致。生成返回三条库存结论和图谱，平台invalid/invalid_schema_reference原样显示；图谱中结论/证据/技术步骤/本体标识及一处局部全屏Tab/Escape已执行。分析历史completed、结论not_evaluable、建议0条。原平台Markdown5842字节且含160处“请求失败。”；未捕获实际分析POST正文或模型最终消息，不能据模型自述认定插件丢失输入，也不能将completed说成业务优化建议有效。

**CI3存在插件侧FAIL**：分析状态切换后焦点落到HTML根，直接Escape不关侧栏；Tab回侧栏后Esc才可关并恢复入口。原失败与平台输出保留，不重复生成或修改结论。真实远程完整报告及私有原件摘要另行接收。

修复仅Scene局部28行：记录真实DOM焦点，仅原节点卸载/禁用且当前focus为body/html/null、该aside仍open/connected时恢复侧栏；仍聚焦其他控件/portal则不抢，DOM contains排除外部门户合成事件。共享helper/hook、Host、请求和输出不改。8新增生命周期回归修前6失败/2通过、修后8通过，独立复核无必修；最终官方Node22完整817项816通过/1跳过、scope2/2、包审计126文件通过。见 [修复记录](./analysis-focus-fix/README.zh.md)、[新本地包差异](./PRE-CI4-DELTA.json)。

新本地参考34ecc9ec…与前参考仅client.js不同，Host和其余125文件不变。准备第四轮publish=false CI及其精确包的受影响实机复验，不能把受控绿或CI3其他通过项改记为焦点修后PASS。既有历史解释/analysis记录保留；后续复验不重新生成解释，不重跑已过业务问答，只按必要的受影响分析生命周期验证。
