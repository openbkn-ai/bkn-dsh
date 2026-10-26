# 第46轮：登录成功后的 stream / runner 生命周期本地复现

已补齐比第44轮函数夹具更接近实际执行路径的证据：同一原-30打包客户端函数与服务端stream方法，在两版官方Gateway的真实loopback WebSocket上均能产生成功首结果后的cancel。服务端仍活跃时，cancel可在注入的直接CLI结果已经完成后，经固定源码的common binding、WindowsJobOwner、WindowsJobRunner到达注入的terminateJob接口；服务端已移除流时，迟到cancel被忽略。

这证明受控条件下的生命周期路径，不是Windows现场浏览器关闭的根因结论。没有实际CLI、浏览器、Windows Job、Host UI或平台执行。两版各三组，共6组最小检查通过；生产插件/SDK/Host、原-30、r3交接均未改变，没有推送、提交或CI。

## 最小结果

两版结果相同，分别为旧0.2.0-rc.2 / 639ed015 与新0.2.1-rc.2 / 687f282e：

| 受控条件 | 原生线路cancel | Host操作signal | 进程生命周期路径 | 注入的非空Job/runner状态 |
|---|---|---|---|---|
| 原-30消费首结果；延迟item发送完成回调，使服务端尚活跃 | 实际收到cancel | aborted | common SIGTERM → 原生WindowsJobOwner terminate IPC → 原生runner调用注入terminateJob，一次 | fixture Job变空，fixture runner结束 |
| 对照消费者读到terminal；相同发送回调延迟 | 不发送cancel | 未abort | 不发送terminate IPC | fixture Job刻意仍非空，runner继续等待 |
| 原-30消费首结果前，服务端已经发送end并移除流 | 实际收到迟到cancel | 未abort | 服务端忽略cancel，不发送terminate IPC | fixture Job刻意仍非空，runner继续等待 |

三组中调用方operation signal均未abort，故不需要显式UI取消就能出现第一组成功后收尾。直接结果均由夹具在网络结果前注入为exitCode=0，绝不是实平台CLI登录成功证据。

不能仅把客户端改为“消费到terminal”就认定同时解决浏览器关闭与runner残留：第二组虽然避免cancel，但在假设Job仍有成员时，原生runner依然等待。此处“Job非空”是明确注入的前提，不是对Chrome所属Job的测量。

## 哪些代码实际执行

- **插件**：原-30 `lib/client.js`里提取的未改动remotePort函数；原-30 `lib/business.js`导出的真实service prototype.beginLoginStream。仅remoteBeginLogin由无凭据/无平台的stand-in返回固定网络。
- **Gateway**：两版官方npm归档中的客户端ClientStreamHandle/ClientUplinkQueue/RemoteStreamMuxClient及服务端RemoteStreamMuxConnection。只在任务副本额外暴露私有符号；原方法体不改。旧版浏览器bundle以最小ModuleLoader/document环境加载，新版使用node bundle。
- **线路**：真实ws服务端与Node WebSocket客户端，只绑定127.0.0.1临时端口，原生协议编码、cancel解析、服务端stream表及AbortController均实际执行。直接实例化mux类，未跑完整公开Gateway/Typert挂载、鉴权或真实Desktop carrier。
- **进程生命周期**：两个固定提交的bindManagedProcess、WindowsJobOwner和WindowsJobRunner源码，TypeScript transform后执行；read/output/protocol辅助函数同样来自固定源码。Windows API、IPC传输和直接进程结果由夹具注入，没有真正的进程/Job/句柄操作。
- **时间控制**：第一/二组只延迟WebSocket item send的完成回调，不改生产service的单yield生成器。第一组在cancel时释放回调，第二组在25ms后释放；这是受控发送完成时序，不代表Windows现场发生了同一延迟。

原公开函数/模块和源码SHA都在[完整结果](native-login-lifecycle.json)。六组结束后fixture runner断开、HTTP监听关闭、服务端WebSocket清空，执行进程正常退出。未复制/持有任何真实Job句柄。

## 输入与源码核验

[输入校验](input-verification.json)独立验证：两版各82个已安装插件文件均匹配固定-30逐文件清单；候选tgz仍为231075字节，SHA256 `6d95ff7517dbe409875fd398784fe01049ba26d2b97c43fad65c817d3ea18ee9`。两版Gateway官方npm tgz的注册表integrity通过，实际执行的client/server文件与归档逐字节相同。每版六个进程源码文件均与固定commit的git blob相同，没有使用源码树的任意本地修改。

原helper SHA仍为 `0e3466f3da61bd2cac8f263c03573ad03206dea7cf20ac58d8f94e433b4943a7`，SDK tgz仍为 `d227f6264597d727e7931bef4118f099df20d42402ff32e306f6d65e8a6b273f`。本机准备态r3 KIT为82d1b74c…bc936，冻结交付r3 KIT为7daaca61…1308d0，各自保持原字节；交付worktree仍fac4db78且干净，不混用摘要。

## 浏览器与UI源码检查

[源码检查](source-review.json)记录了正式SDK0.2.0打包openBrowser函数：Windows选start、shell=true、stdio=ignore、detached=true，随后unref。这里只检查了实际归档源码，没有执行该函数；这些选项不能替代实际Job成员或浏览器生存期证据。

UI成功分支发布succeeded并移除abort监听/清掉超时，不在成功finally中调用invalidate；后续关闭/新操作会invalidate并abort。common subprocess只等待直接done的调用方式，和Windows runner等待整个Job清空的生命周期，是两个不同边界。本次受控证明了在调用方未取消时，stream消费本身仍可发cancel。

固定Win32源码为Job设置kill-on-close，并在恢复直接目标线程前AssignProcessToJobObject。它不能证明现场Chrome加入的是这个Job，也不能证明现场所用containment选路、浏览器关闭原因或同次370ms采样内的先后。

## 上游与正式环境边界

只读刷新两上游：DSH master仍687f282e，最近release为dsh-v0.2.1-rc.2；Foundry正式release仍v0.2.0，未发布main已到2466c45f。相对上轮0b447996的5个提交涉及公共错误本地化/Language类型、图探索UNION提示、null enum拒绝和定义别名；66个改动文件未包含DSH subprocess或SDK浏览器启动实现。变化与完整文件清单见[上游状态](upstream-state.json)，关键patch已审阅并保留私有原响应。

没有部署这些变化。正式0.2.0、业务数据、配置、个人应用及其他会话保持；本轮未读取平台当前状态，不宣称完成新的平台数据前后核验。将来的错误输出/别名schema兼容性需在对应版本边界另验，不套到现有正式0.2.0。

## 等待Windows r3合并判断

1. r3官方PS5.1 argv回归仍待Windows结果，不能拿本轮Mac检查代替。
2. 日常Chrome已打开且窗口/进程身份经用户确认后的一个Desktop正常登录：原窗口/根是否保持、是否出现新树，以及直接CLI、runner、新树各自结束的有界时间线。
3. Job身份/成员、实际containment选路、是否收到terminate及关闭先后，证据不足时继续未知。PPID、inAnyJob或同次采样消失均不能替代。
4. 继续保留r1成功后runner残留与r2有限窗口未残留两个原观察，不把本地复现或r2未复现写成修复。

本轮不追加Windows任务、不改-30、不重跑A/B启动/UI/B1，不开放Sandbox/G6。完整合同及安全、低权限、CE非空、历史销售和最终固定CI门槛继续开放。`ciRun=null`、`formalAcceptanceEligible=false`。

## 复现与证据

在本仓库根目录、任务Node24.19.0和既有两版受控runtime/固定源checkout条件下运行：

```sh
/Users/dominiczhang/Documents/project/app/openBKN/.test-tools/node_modules/node/bin/node docs/evidence/2026-10-23-local-46/native-login-lifecycle-probe.mjs release/local-46/repro-new
```

输出目录必须不存在；脚本不安装依赖、不访问平台、不修改输入，创建私有符号副本与loopback夹具。结果在新目录native-login-lifecycle.json。公开脚本的SHA、结果和检查记录在本目录EVIDENCE-MANIFEST.json。前期三次探针适配失败（ws CJS导出、旧版document环境、close接口）及中间验证版本保留在release/local-46，不属于产品失败或Windows验收。
