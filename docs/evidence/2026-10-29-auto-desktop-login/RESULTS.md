# 冻结93f3e85：官方Mac Desktop登录补证与Windows材料

官方Mac Desktop的受影响登录链路通过：新隔离profile完成真实浏览器授权、CLI同步、MCP实例与授权目录读回；面板重开及Desktop重启均复用授权，两次官方菜单退出均为exit0。**首轮浏览器曾提示找不到钥匙串，原异常保留；已定位并修正验证脚本伪造HOME的问题，不把它称为插件包或系统钥匙串修复。** 修正后的浏览器只读重开由维护者确认窗口可见且没有钥匙串提示；没有再次进行账号授权。

`kind=mac-desktop-automatic-login-affected-validation`，`ciRun=null`，`formalAcceptanceEligible=false`。这不是全GUI、Windows或正式发布验收。

## 固定输入，未重建

- 生产源码：`93f3e8560a7ab8834cab7fa97fa79677d71f1827`；补证执行时HEAD为93f3e85；本次获准的交接子提交只增加文档/材料，生产目录与93f3e85相同。
- 候选：`0.2.1-rc.3-openbkn.0.2.1-auto.local.1`；SHA256 `ea6be318b40f06a55e95e1bfd962f4f06fe230874574028750639f62e61194dc`；259279字节、94文件。实际安装94/94与归档相符，业务入口 `167e6571b44d6e0bece6456c19546b79c6d39bd709d0632e6c46f66859c40417`，插件私有MCP入口 `41db8cdb31f2f3403eb10e3e42c8114fdb9e54bbc1c76fb6dbdb2c2b931bc22d`。
- 官方Mac arm64 App：复用此前任务目录中的原官方DSH `0.2.1-rc.3`，没有另拷App、构建GUI或改变其代码。原ASAR `848f8437a990ffb88fca6772eb8e0e69af84d066c76087ac973a8d8015b459f4` 前后相同，deep/strict签名验证通过；内置Node24.21.0/Electron44.7.0。原安装器历史来源与摘要保留在第56轮，未重新下载或升级。
- 官方CLI仍0.2.0，入口SHA256 `18445a26bfb20f7a8cc8eecb50f499ff12c0ed564e0e3d8741850fcbe43f82a5`。平台复用维护者已授权的既有企业0.2.0，仅登录、MCP初始化及只读网络目录；未替换本机正式0.2.0。

## 实际验证结果

| 项目 | 结果与依据 |
|---|---|
| 独立数据与安装 | 新DSH_HOME/desktop profile/Electron user-data；未复制旧凭据、模型配置、业务Session或workspace。通过官方自带dsh命令安装归档，94/94匹配；没有profile companion。 |
| 官方GUI | 正常欢迎页经“添加API Key→稍后配置”进入主窗口，没有填写模型账号/API Key。没有调试IPC、模型回合或新GUI入口。 |
| 实际CLI载体 | 在官方Desktop的原生subprocess中，对空CLI目录仅执行auth status。首轮由独立Node24.14.1运行，修正HOME后由独立Node22.22.3运行；均符合官方CLI>=22.19.0，exit0且preload marker实际写入。不是根据Desktop内置Node版本补填。 |
| 真实授权 | 维护者点击插件登录并在独立Chrome完成官方授权；界面“登录并同步成功”、authenticated、授权目录数2。浏览器页面由维护者操作，未自动化逐屏读取。 |
| 实际业务/MCP | 三个loader组件active；业务Service与冻结bundle导出类身份相同；已挂载registry实例===业务manager fiber.runtime，入口为插件包内的私有factory；没有手工mount、remoteConfigureToken或companion。 |
| 面板重开 | 直接恢复授权目录，不再打开授权窗口。 |
| Desktop重启 | 同一任务home、同一冻结候选。第二次读回文件在新spawn之后落盘，仍authenticated/目录2/MCP实例一致；没有新增授权浏览器目录。无需第二次账号授权。 |
| 两次正常退出 | 官方菜单“退出DeepSeek Harness”；PID16395与16846分别真实exit0，未用强制终止替代。任务Host/CLI/授权浏览器收态完成。单独钥匙串浏览器探针也已关闭，未关闭日常Chrome。 |
| 系统关联 | 启动前完整备份LaunchServices plist。启动只改变dsh handler的ModificationDate，Role仍com.deepseek.dsh。退出后验证当前==After、CFPreferences==After、差异仅该时间戳，再通过原偏好域导入原备份；恢复后语义及字节均等于Before。未注销App或整机清理。 |

## 钥匙串异常：原因和边界

首轮隔离脚本沿用了旧GUI准备方式，将`HOME`指向任务的system-home。维护者在授权时报告“找不到钥匙串”；授权和目录读取仍成功，但不能因此忽略提示。

只读A/B对照仅改变`HOME`，执行`security default-keychain -d user`，不读取key内容、不解锁或修改配置：

- 真实HOME：exit0，返回的默认钥匙串文件存在。
- 临时HOME：exit1，找不到默认钥匙串。

DSH的原生子进程保留HOME，授权浏览器未覆盖它，故验证脚本伪造HOME会影响系统钥匙串定位。本轮已删去这项覆盖，保留真实用户HOME，仅通过DSH_HOME及显式user-data目录隔离。没有修改冻结候选、Host或系统钥匙串，也没有添加mock-keychain/password-store等绕过开关。

修正后完成既有授权的Desktop重启；另用同一任务Chrome profile和相同SPKI例外只读打开robots.txt，不发起OAuth、不输入密码。该探针日志没有keychain/errSec/OSCrypt标记，**不据此声称界面绝无弹窗**；首次只读窗口在反馈前已收态，维护者表示未看到，因此没有记为通过。随后通过系统标准启动方式重开有明确标题的同一任务profile，只读加载本地说明页及平台robots.txt，并保留到维护者确认“看到了窗口，没有钥匙串提示”。该确认覆盖浏览器只读重开，不能外推一次新的完整授权。没有为消除这条记录重复真实账号授权。原启动脚本、日志及用户报告保留，后续不能倒改成“首轮全程无提示”。

单独的原App Electron-as-Node预检查确实忽略NODE_OPTIONS；最初打印的preloadAccepted常量不是证据。随后用marker证明忽略行为，并在真实Desktop CLI载体中观察到独立Node实际执行marker。因此没有为这个预检查错误地改CLI、制造wrapper或判定整个Desktop失败。

## 上游定向核对

只读核对时，DSH可用发布仍包括rc.4与alpha.2，测试固定官方rc.3；Foundry最新正式Release仍v0.2.0，不部署main。SDK main由d600664推进三提交至fb6f228，涉及查询/指标契约、Python及文档/评审工作流，没有修改本轮授权/TLS路径；本轮CLI仍固定已验证的0.2.0原件，不沿用“最新main”代替发行身份。[SDK对照](https://github.com/openbkn-ai/bkn-sdk/compare/d6006640781fc87c40e50677ba11c529c7e79d25...fb6f228c7b33aac6227737425c78b60a519c6578)。这些只读检查没有触发CI或授予升级权限。

## Windows最小材料

[本地交接目录](../../handoff/2026-10-29-auto-login-windows/README.md)已准备固定归档、94文件清单、观察器、离线校验器和可直接转交提示词。关联备份脚本逐字节复用e7b383b已验证版本，SHA256 `d5c874cb5dd6af83fe64676ea5bc693d2bffc2a2302b9273a970a8fa081cced1`。KIT清单SHA256 `4f8dcde6b3ce8012ae64a065f68a5718e86346f0db18c7ff155a642965bf67e8`，13文件离线校验及本机安装94/94检查通过；这不是Windows执行。

Windows只补一个官方rc.3 Desktop的实际CLI载体、独立浏览器取消/一次授权与收尾、自带MCP、重开/重启及关联恢复。保留真实USERPROFILE/APPDATA/LOCALAPPDATA/HOME及OS变量；marker未执行就停止，不借公共CA或浏览器旧例外假记通过。无旧Host/npm、完整UI、B1/W-LIFE/RDP、重定向、G6或业务矩阵。

维护者已授权主会话仅向 `handoff/windows-auto-login-93f3e85-20261029` 推送本次独立交接子提交。生产提交和归档冻结不变，Windows尚未执行；不更新main/开发分支、不创建PR或跑CI。远端取件提交以主会话推送后读回的完整SHA为准。截图、CLI配置、浏览器profile、系统关联原件及完整日志留在本机release任务目录，只将脱敏摘要和选定文件哈希纳入文档。
