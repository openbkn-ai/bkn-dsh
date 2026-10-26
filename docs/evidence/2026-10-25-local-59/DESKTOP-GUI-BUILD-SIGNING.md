# #105 独立 Desktop GUI 的构建与签名路径

日期：2026-10-25。结论：**独立GUI需要固定源的发行集成，不能只换ASAR或appId。** 现有回补npm包/官方Desktop后端/CLI认证证据保留，但当前没有独立GUI制品；本轮完成源码与纯函数评审、交付门槛和Windows准备材料，没有运行GUI构建、签名、Launch Services注册或安装。

## 固定来源和实际评审

旧源0.2.0-rc.2 /639ed015，新源0.2.1-rc.3 /1f81c047，SDK仍2.0.0/2.2.0；冻结 -32不变。引用源码文件的摘要和行锚点在[SOURCE-REVIEW.json](SOURCE-REVIEW.json)，完整源工具版本/lock摘要在[BUILD-TOOL-REQUIREMENTS.json](BUILD-TOOL-REQUIREMENTS.json)。

本轮只执行官方`developmentLauncher`纯函数，以及从原文件抽取的`localMacOSPackageEnvironment`函数和它实际依赖的正则常量；未调用有写入/签名/lsregister的`prepareDevelopmentApp`。结果见[OFFICIAL-FUNCTION-REVIEW.json](OFFICIAL-FUNCTION-REVIEW.json)。这是配置/launcher函数证据，不是整包构建或GUI通过。

| 观察 | 具体影响 |
|---|---|
| rc.3 `localMacOSPackageEnvironment`把调用者appId改回`com.deepseek.harness` | 在环境里给独立ID后直接用本地Mac快捷路径不够，后续源集成必须在过滤默认值之后确认实际ID |
| 旧版CLI和builder factory均只允许Windows unsigned；rc.3才支持Mac unsigned | 不能把rc.3 `package:mac:arm64:unsigned`命令套到旧版，不能静默换新DSH来绕过 |
| builder固定productName为DeepSeek Harness，声明dsh协议；main还会主动注册dsh协议 | 新appId不能独自保证名称、OS协议、全局CLI和数据路径隔离 |
| official开发app会adhoc签新copy并执行lsregister，声明dsh URL scheme，设置DSH_DESKTOP_DEV_APP=1 | 不能直接运行这个开发helper满足“不影响现有Host”；其自己的签名也不是生产签名 |
| official launcher开启main/renderer/Host inspector | 不能沿用9229/9222/9230作为无影响的默认值，应由独立开发方案关闭或显式分配并核验 |
| 生成的cold-start launcher只固化DSH_HOME，未固化DSH_DESKTOP_DSH_DIR和DSH_DESKTOP_PRIMARY_RUNTIME_DIR | Finder/重开不应依赖父终端临时环境；新GUI须保证重开仍指向回补运行根和匹配primary runtime |
| packaged shell忽略DSH_DESKTOP_DSH_DIR；DSH_HOME与Electron userData分别归属 | 外部env只对development路径生效；正式包必须实际打入dsh目录，并分别隔离home、CLI配置、userData/sessionData、logs/journal及锁 |
| package-target重新build:official/release:pack/prepare:dsh | 只改暂存node_modules再跑该流程会被覆盖；必须从固定源带入回补并在准备后与最终ASAR再次核对 |

## 两条可行路线与本轮选择

**独立开发GUI**可在固定源新副本复用官方开发流程，但需先提交可评审的隔离集成：移除OS协议注册、全局CLI安装、默认调试端口；生成launcher固化完整runtime路径和独立数据根；独立名称/日志，并保持模型、tool和认证实现不变。仅在新副本形成明确标记的development app；不覆盖现有Electron/DSH。该路线没有生产签名/公证结论，也不能直接作为发布制品。

**独立分发GUI**从同一固定源完整构建。源补丁系列为第53轮transport/helper四文件补丁，再加第57轮package许可/归属addendum；还需要上段独立发行胶水的实际实现与最小验证。采用自己的appId/产品名、代码签名责任、更新/强制策略来源或经审阅的手动分发模式；不得继承官方更新源而让回补被覆盖。正式更新服务/发布主体没有在本轮选择，不能给它填假地址通过配置门槛。

**本轮没有把descriptor校验器当作上述GUI源码集成。** `gui-contract.mjs`仅检查计划/回执字段，不能改变官方程序行为。新隔离规则尚需实现到源码或独立bootstrap及builder wrapper，再运行完整GUI构建。不是“只差一张证书”。新材料里GUI仍NOT_BUILT。

## 源构建的执行顺序

以下为后续构建规程，**本轮未执行**：

1. 为old/rc3分别建立新的固定commit源码副本，核对源/lock摘要。应用相应transport patch与packaging addendum，正式集成时进入相应compat patch/manifest校验路径；不改已冻结的主树生成器或 -32。
2. old使用pnpm11.7.0，rc.3使用11.28.5；按各自原lock安装。两源要求TypeScript6.0.3范围；Desktop的app-builder-lib分别26.15.3/26.17.0、Electron范围44.0.0/44.7.0。最终解析以原lock为准，不能用本仓库package级声明编译器或另一份node_modules冒充全仓构建。
3. 独立发行胶水先通过审阅：在生产模块导入/单实例锁前固定数据根；独立appId/名称及关闭本轮不允许的OS集成；保证cold start。CLI/BKN配置、credentials仅进新副本，保留来源。目录真实路径/symlink校验必须在目标机器完成，plan validator的字符串检查不替代。
4. 在固定源依次运行官方build:official、release:pack、Desktop host pack、vendor/native pack、prepare:runtime、prepare:packages、prepare:dsh。新runtime中MCP JS应为b3cd7156…972c，6份声明、许可和派生身份应完整；SDK版本保持。所有结果进该源自己的target-owned目录。
5. 独立builder配置必须保留base版本与runtime descriptor协议一致，用额外distributionId区分回补。审阅其实际metadata、publish/policy、协议和CLI集成，不仅审阅输入env。制作GUI后解包ASAR再核对MCP/声明/归属及启动入口；外层签名/封装之后再记录最终SHA。
6. 只补新GUI的身份/隔离/冷启动/实际 -32加载、受影响菜单/认证与正常退出。第53/57/58轮已通过的源码/SDK向量、完整Host/CLI路径不重跑；但不能拼接第56轮原GUI与第58轮裸后端，宣称新制品已通过。

## Mac 签名路径

公开身份参数为DSH_DESKTOP_APP_ID、DSH_DESKTOP_MACOS_SIGNING_IDENTITY、DSH_DESKTOP_MACOS_TEAM_ID；签名keychain由官方package流程管理，`verify-macos-signature.mjs`检查指定Developer ID/Team、secure timestamp/hardened runtime等。随后按官方package-target的签名/公证顺序执行runtime、app、dmg/zip及staple/Gatekeeper核验；不是对现有app重新盖章。

本机只读`security find-identity -v -p codesigning`返回 **0 valid identities**，未读私钥、未签名或提交Apple公证。[能力记录](SIGNING-AVAILABILITY.json)。后续真正签名阶段才需要明确发行主体及可用身份/受控签名环境；无需把私钥、密码或token发到聊天。

旧版没有Mac unsigned快捷路径；rc.3的unsigned/skip-notarization仅开发边界。adhoc、unsigned、skip-notarization都不能满足生产签名/公证门槛，也不绕过Gatekeeper或移除quarantine。本轮未更改任何信任设置。

## Windows 签名与材料门槛

官方Windows流程以公有leaf CER、signtool、key container、token PIN参数完成签名。preflight会编译一个新probe exe、签名并校验有效签名/同一证书/时间戳，**不执行probe**；该步骤仍会访问签名设备，不能当只读检查运行。签名失败interlock要人工分诊，不自动重签或删锁。运行时DLL/EXE、ASAR unpack、NSIS和发布者身份分别验证；派生制品不继承原官方签名。

当前Windows feed为rc.3，已固定元数据的HTTPS来源、大小与SHA512，未下载或执行安装器；原生Authenticode/ASAR实测待Windows机器。当前d20a266的新版是rc.2，不能代替新目标。新Windows材料为[准备态 r1](../../handoff/2026-10-25-021-host-backport-windows-r1/README.md)，不启动Host/登录，也不扩容当前Windows补证。

## 当前可交付与未完成

已交付：固定源审阅与实际纯函数结果、计划/回执拒绝门槛和5组新检查、冻结输入/最小原生探针/结果模板。未完成：GUI隔离源码集成、干净全仓GUI构建、实际GUI/签名/公证及Windows执行。#105继续OPEN；现有Host、冻结 -30/-31/-32、正式0.2.0和数据配置保持，无推送/CI。
