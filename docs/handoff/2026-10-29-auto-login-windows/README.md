# Windows 自动登录最小差异复验材料

**本次获准独立交接，Windows本轮未执行。** 交接分支固定为 `handoff/windows-auto-login-93f3e85-20261029`；交接提交SHA由主会话推送读回后提供。 生产源码固定提交 `93f3e8560a7ab8834cab7fa97fa79677d71f1827`，候选固定 `0.2.1-rc.3-openbkn.0.2.1-auto.local.1`。归档未重建：SHA256 `ea6be318b40f06a55e95e1bfd962f4f06fe230874574028750639f62e61194dc`，259279字节，94文件。

只补**一个既有官方 Windows rc.3 Desktop**：实际CLI载体/preload、独立浏览器取消与一次真实授权、插件自带MCP、目录读回、重开/重启复用与正常退出。没有旧Host、npm/Web、完整UI或业务矩阵。任务步骤见[可转交提示词](WINDOWS-PROMPT.md)，身份见[INPUTS](INPUTS.json)。

原生MCP回补已经在插件内，禁止再放置以前的12文件profile companion。`business-observer.mjs`逐字节来自固定93f3e85的既有观察器；`desktop-observer.mjs`仅补实际CLI子进程的无网络marker探针。不能只凭CLI exit0、磁盘package版本或内置Electron版本声称preload生效。

`system-association.ps1`逐字节复用已实机验证的e7b383b脚本，保留OS守卫、完整Before、After、受限Restore与UserChoice/ACL保护；没有新GUI发行、签名、安装器或生命周期框架。原始日志、SID、.reg、截图和凭据只能留在Windows任务目录，报告只给脱敏结论与摘要。

维护者只授权主会话推送本次独立交接分支，不更新main、开发分支或其他交接分支，不开PR、不执行CI。Windows会话仍不得推送或执行CI。交接提交只增加补证/文档/原归档；生产源码93f3e85及其94文件身份始终不变。
