# SourceText 局部修复与定向回验

2026-11-03。用户在核收专项报告后要求安排后续工作。范围仅为已连续两次复现的“输出原文hover后点击重叠弹层，Escape后指针留驻仍可见”，不改其他已测试功能，不改变平台和模型的原文、状态、原因或计算。

## 依赖与分工

1. 浏览器子智能体：使用脱敏fixture和实际组件，先保留真实布局/遮挡/pointer路径的修前失败、DOM命中和时序，再做相同路径修后验证。不得用JSDOM冒充布局。
2. 修复子智能体：在SourceText内做最小状态/焦点修复，并在既有native-dialogs测试补确定性回归。等浏览器修前证据后才动生产代码；尽量保持共享焦点helper不变。
3. 只读评审子智能体：检查固定Studio/DSH父容器契约及相关上游变化，评审dismiss guard的解除、显式新激活和卸载边界。
4. 主会话：维护旧证据、审查范围和输出红线，完成必要本地构建/测试/包审计，再按既有集成授权交付新build-only CI精确包。Windows原会话已准备复用隔离官方rc.5、home/userData及同一第2轮，收到身份和SHA后只做受影响回验。

## 关闭层级决定

保持现有纯hover行为：hover不接管键盘焦点；焦点仍在父详情搜索框时，Escape由父详情处理。明确进入原文popup/trigger时，Escape只关闭原文层，父详情保留，并防止同一留驻hover立即重开。真正离开后重新悬停或明确新激活应可正常再开。

这是DSH模态父容器的局部适配决定。固定Studio源码没有DSH父modal，也没有现场平台同序列对照，不称平台现场已验证相同。不增加document级Escape拦截，不将普通hover预览升级为抢焦模态层。

## 验证与状态

生产源码已完成本地修复，只改Scene内的SourceText。owned Escape仅抑制正在进行的hover visit；trigger和完整本实例popup root（含padding/arrow）共同构成悬停区域，真实离开或明确新激活可恢复。root监听局部挂载、对称卸载，没有document/window监听；共享focus hook及其他插件源码不变。

修前Windows两次复现保持。受控真实浏览器另捕获了Esc后的退出动画、popup遮挡消失导致trigger重新mouseenter、约120ms后再次出现的路径；这是受控重演机制，不升级为Windows原现场唯一根因。开发中又先证失败并修复“中性指针键盘关闭后首hover被抑制”和“section外popup padding过早解除guard”两项残留，原报告/日志均保留。最早浏览器报告用节点存在误代可见性的概括已修正，旧件仍留存，后续按矩形及祖先display/visibility/opacity判断。

本地最终构建及插件826项中825通过、1项既有Windows专项跳过；仓库79/79、包审计126文件通过，见[本地检查](./SOURCE-TEXT-LOCAL-VALIDATION.json)。新增9个JSDOM边界；sourceLayer等待由默认1s改为与ready一致的10s，保留原超时日志，不改断言或把环境超时当产品失败。Node使用已有24.19.0进程PATH及pnpm11.7.0，不改全局环境。

本地参考包[字节对照](./SOURCE-TEXT-LOCAL-ARTIFACT.json)：SHA256 `75a52410cb0de49d4554d220007e58aa3f5882666825d5f612453689160e4bcb`，877506字节、126文件；相对旧CI4仅client.js变化，其他125文件逐字节相同。旧CI4/a520329/cf9ab及所有FAIL/UNKNOWN保持；这份本地包不作为Windows或正式发布验收。

真实浏览器默认矩阵包含六基础序列、五扩展边界和两项嵌入的键盘关闭后首hover断言，使用静态内存transport，不访问平台。最终产品源码SHA为 `0a95cbb2c9a467cc2c00ccce331d4847e47350e076e50debec429f9c92d597ff`。交付probe加强必需路径前提、父层保留及不触发生成/分析的全快照断言后，同矩阵再次退出0，独立只读核收通过：最终原报告415024字节、SHA256 `ae023c4320af482575ed958ab3598f9aad5d04e050d5320c76adf1b6a98c0282`，Scene摘要与当前源一致，padding实际可执行；错误和非loopback请求均为空。见[派生摘要及原件SHA](./SOURCE-TEXT-BROWSER-REGRESSION.json)和[可复用probe](../../../packages/openbkn-business-context/tests/probes/source-text-pointer.README.md)。不可执行padding时明确SKIP/PARTIAL，record-baseline只采样模式不能作PASS。

[上游只读核对](./SOURCE-TEXT-UPSTREAM.zh.md)确认固定Studio/Foundry release及官方DSH rc.5没有升级；未发布main的其他合同变化单独记录，不宣称兼容已扩展。

本地门槛及独立评审已核收。下一步按此前集成授权提交、推送新build-only候选并审计实际CI包，再交给原Windows会话做受影响回验；新CI及Windows结果仍待执行。旧包和已发布-2保持不变，不补记原生PASS。

本轮新增业务问答、依据生成、Agent分析、平台业务写入均为0。不会重跑完整业务E2E，不自动合并、打标签、发布或移动latest。Windows最终回验必须安装新CI精确候选，不能以本地源码或本地包替代。
