# 第43轮：Windows -30 r2 独立交接已推送

按用户本轮明确授权，仅推送新的独立交接分支 `handoff/windows-local30-r2-20261023`，完整固定提交 `96f8f7656103e8e066a12ea8d9d05d5e7dd96339`。提交信息带 `[skip ci]`，32文件的独立产物树无工作流、无开发源码；没有PR、标签、发布、CI dispatch或平台动作。用户排除的另一路-11不采用、不合入、不修改。

## 固定身份

- 同一插件 `0.2.0-rc.2-openbkn.0.2.0-30`，231075字节/82文件，SHA256 `6d95ff7517dbe409875fd398784fe01049ba26d2b97c43fad65c817d3ea18ee9`，没有重建或变更。
- 远端r2 KIT-FILES SHA256 `f340d205a6290c9e9eea9cfaef08561a5a596496bdb75a1e30c43ccd71e0e004`，25项输入。
- 原r2 helper SHA256 `0e3466f3da61bd2cac8f263c03573ad03206dea7cf20ac58d8f94e433b4943a7`；与第42轮本地修正版完全相同，相对743eb4a的helper仅两行参数拼接括号修正。
- 第42轮本机准备快照的KIT摘要35abfbbc…20cbbc保留原字节；本次只在隔离交接树更新HANDOFF/FOLLOWUP/结果模板的交接阶段和定向范围，再重算清单。所有执行脚本、候选、SDK、pins与本机r2一致。不能把两个不同文档快照的KIT摘要混用。

[固定取件入口](https://github.com/openbkn-ai/bkn-dsh/blob/96f8f7656103e8e066a12ea8d9d05d5e7dd96339/README.md)、[本轮完整任务](https://github.com/openbkn-ai/bkn-dsh/blob/96f8f7656103e8e066a12ea8d9d05d5e7dd96339/WINDOWS-TASK.md)，以及[可直接粘贴的固定提示词](WINDOWS-PROMPT.md)。

## 最小化复验范围

仅一次公共Windows5.1 argv回归，A/B各一个新home的InitializeOnly、同-30安装和原helper正常启动，再各一次成功登录及runner时间线/正常退出。已通过完整UI、取消/超时、完整B1和业务路径保留原报告身份，不自动重跑。只有A/B复现且确需同轮对照时才最多追加C或D一个单次登录。慢读取消、RDP、浏览器信任、npm窗口及G6/安全/低权限/CE等开放项不借本轮扩大执行。

runner只取证：区分直接CLI退出和Job范围清空，PPID图不能证明Job成员或Job为空；不强杀整个Job、个人浏览器，不修改生产插件/SDK/官方Host。浏览器后代假设尚未证明。Windows原始私有证据不包含在交接提交中。

## 已验证与限制

交接树25项输入、82候选文件、官方SDK注册表integrity通过；相同helper的初始化6项/正常10项参数在Mac PowerShell7.6.8经真实Node argv回归通过。Windows5.1和A/B原生启动仍待本轮远程执行。

提交树32文件逐字节匹配；六类凭据/私钥模式扫描包括tgz展开内容，无命中。使用命令级core.autocrlf=true从origin全新clone到空格路径，全部32文件及完整kit再次匹配，Git属性关闭文本转换。没有增加源码或业务测试；这次校验只覆盖交付边界。

远端ref精确指向固定提交，检查时该分支Actions和PR列表为空。只执行显式新分支refspec，并关闭followTags；旧743eb4a、fd87974和fb77c07远端ref不变。开发分支/HEAD/index保留，其他工作树不动。具体检查时间见remote-state.json。

正式OpenBKN0.2.0不替换，本轮没有平台读写或Host启动，数据配置和现有应用保留。`ciRun=null`、`formalAcceptanceEligible=false`，完整验收未关闭。本次推送授权不包含Windows结果推送、开发/main同步、CI或发布。
