# Mac SourceText S1–S3 实机补证核收

2026-11-04。**接收本次样本下的 Mac S1、S3 四条键盘路径及 S2 左侧 padding 路径结果。** S2 几何来自原生截图估计，精确 DOM/AX 命中仍未知，箭头未单独执行；不外推完整发布或模型端到端验收。

先前把原 Mac 样本缺原文扩大为“Mac测试必须等待平台迁移修复”不充分。复用 Windows 真正成功的第2轮后，Mac Reader 实读200、原文非空，继而通过正常 DSH 入口完成本次动作。#82仅跟踪原样本的历史迁移问题，不是本次测试前置。

## 固定对象与真实会话恢复

- CI6源 `f01b316fbfb6be681af81e2267a7b3341e659efd`、run41596006291、artifact13212518096；TGZ877732字节/SHA256 `4500fa4357cdcdcb9914a39794aedb9096c948192c2bf0f35ecf4fadb882f046`，126/126文件匹配。官方Mac DSH Desktop0.2.1-rc.5，隔离官方CLI0.2.0，维护者指定的50.28企业正式0.2.0目标；本专项未重审各服务镜像。
- 原 Windows Session349071字节、binding286字节均与旧验收摘要一致，无附件/子日志。通过接收方专属RSA-OAEP/AES-GCM和请求级校验证书的TLS私下交接；源、临时中转、Mac均核同一623045字节密文摘要，两份原文件也核一致。没有Git数据转交、凭据/profile或原会话正文公开；[交接回执](./mac-rc5/windows-sample-reuse/SESSION-TRANSFER-RECEIPT.json)。临时中转正常退出，所用端口已关闭。
- Mac官方持久化先真实拒绝Windows绝对cwd，失败保留；新任务工作副本通过官方SessionPersistence/Workspace API只适配`header.cwd`。264条原事件的原始行逐字节一致，S/M/C/I/KN、消息、工具输入输出、回执和原绑定均保留；仅另有Host自动追加的一条空`session/end-seed`。原接收件保持原摘要。工作副本重压缩后的139000字节不等于原文件，是已核清的格式/元数据差异，不是业务改写。
- 复用同一本机任务已有的授权记录与CLI store，没有手设授权标志或再开授权浏览器。正常Host加载真实历史会话，点击既有答案入口，显示匹配C、第2轮和目标I；按钮到M的wire及opaque handle未独立插桩，GUI全文与独立Reader未再逐字比较，不追认这些为已证。

## 接收结果

| 项 | 本次接收范围 | 保留边界 |
| --- | --- | --- |
| S1 | 真实输出hover、点击覆盖自身入口的弹层正文、Escape；指针留驻，1.378s/3.080s均子关父留、未重开。 | 离散采样，不证明所有采样间瞬时帧。 |
| S3 | 输入/输出各用Enter、Space打开；Escape子关父留并回自身入口，首次真实hover重开，四条路径通过。 | 每动作后400ms稳定观察；最初无稳定间隔的相反观察保留，不能断言唯一原因或零延迟行为。 |
| S2-padding | 正常Window Zoom后1920×971，再仅调底边至1920×820。正文获焦后，指针移至覆盖自身入口的左padding；1.351s/3.082s均子关父留、未重开。 | 原生截图定位+OS指针+冻结布局支持的限定路径；矩形为估计，精确DOM/AX命中未知。 |
| S2-arrow | 未执行。 | 不把padding通过写成箭头也已通过。 |

原先1280×820及1305×720没有形成交叠的SKIP保留，不能外推屏幕内不可达。后续只补未完成S2，未重跑S1/S3；使用正常宽窗操作，没有改CSS/DOM/DPI或业务数据。S2报告同时给出屏幕点(1108,370)与窗口内点(1108,340)，原生窗口原点(0,30)；矩形估计按窗口截图坐标解释，不能混为屏幕矩形或精确命中证明。

## 原件与核收

实际操作由指定远程Mac完成，主会话从原生commandExecution的stdout恢复gzip/base64，逐一核压缩长度、原字节数、UTF8及SHA，并复核数据、候选、几何、采样和收态的内部一致性。私有截图/AX原始日志仍在远程；本次未在主会话重演操作。

| 原件 | 字节数 | SHA256 |
| --- | ---: | --- |
| [JSON](./mac-rc5/windows-sample-reuse/MAC-CI6-GENUINE-SESSION-SOURCE-TEXT-FINAL.json) | 15036 | `d69bc661fa09329d21c9fe7f3fd166c0f272ecc6c9e7557a208ece70259dfced` |
| [中文回执](./mac-rc5/windows-sample-reuse/MAC-CI6-GENUINE-SESSION-SOURCE-TEXT-FINAL.zh.md) | 5971 | `baa5fe37207300bdc5d82e8e4a47fd0fcf44b8da01cab80a1e42eed6ad0e9cf7` |

见[核收清单](./mac-rc5/windows-sample-reuse/RECEIPT.json)。原件不改，旧NOT_RUN、初次SKIP及失败记录保留，当前接收结论另存。

## 收态与剩余范围

四个准备/验证实例均正常菜单退出、exit0；本轮已知Host/辅助进程0，三个已记录任务端口无监听。原接收件、原binding、旧任务绑定/YAML、原日常Mac Session、官方EXE/ASAR和固定候选在列明范围内核对通过，系统dsh关联按守卫恢复Before原字节；不扩大为全home/全系统/TCC不变。最终宽高恢复1280×820，原生Center后位置比初始低40px，仅涉及已退出的新隔离窗口；中途1305宽度原因仍未知，未隐藏。

本次无新模型问题、解释/Agent分析或平台业务写入；正常GUI只读请求发生过，服务端After未另测。插件/Host/平台代码与现有包不改，没有Windows重跑、远端CI、推送、合并或发布。

本轮SourceText补证按上述范围接收；精确DOM命中、arrow独立分支及动画期瞬时行为不作通过声明。正式CLI0.2.1安装继续按维护者要求待验，不重查registry；常规PR/main/最终制品与发布步骤另行推进，不能由本次回执自动放行。平台历史迁移#82继续独立跟踪，原Mac旧样本仍未被修复。
