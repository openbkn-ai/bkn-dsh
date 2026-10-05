# 原故障用户：安装诊断候选并回传报告

这里的 -6 是原 -5 诊断开发经 S2 隔离与界面修复后的候选；不让用户安装已知业务 import 故障下丢失 UI 的旧 -5 包。候选尚未正式发布到 npm，安装使用验收包内固定 tgz，不运行 npm 的 @-6 版本安装猜测命令。

1. 先记录故障用户的 OS、官方 DSH 形态/版本、当前 bkn-dsh 版本；保存非秘密配置的原写法，不能复制 token 或凭据文件。
2. 按用户同意的当前 profile 使用该形态自己的 CLI 安装固定 tgz。Desktop 使用随附 CLI 的 desktop profile；npm 使用 web profile。按 manifest 验证 SHA。
3. 在重启／复现前检查 override：若有 `name: '@openbkn/dsh-business-context'`，删除 name 行（只以业务 ID 定位），或改成 `@openbkn/dsh-business-context/business`。baseUrl/cliPath 等值保留，任何 Token 不进入 YAML。避免把升级时临时失配造成的缺配置当作原故障。
4. 重启实际 Host，再复现原故障；点击 **OpenBKN → 右上角“诊断” → 导出诊断报告**。等待文件保存，记录 JSON 绝对路径、报告编号和复现时间；截图可作为补充。
5. 回传脱敏 JSON、OS/Host/插件版本、实际操作和是否复现。不要回传 token、密钥、授权 URL/码、原始日志、整个 profile 或用户数据。
6. 主开发以其检查点/错误类别给下一步；insufficient-evidence/not-run 不当作健康，也不凭通用 Token 文案断定根因。

验收机器上的受控 S2 通过只证明入口可用；原用户根因仍以其机器的真实报告及必要后续复现为准。安装到用户当前 profile 是由用户同意后执行；验收默认隔离 profile，不能混用两个目的。
