# Windows：-7 插件修复候选验收包

本包固定到 CI 37407894581、源码 e972d319f19e2094740ac12da45684e3ba890e37；publish=false。tgz SHA、65 个包文件及逐文件哈希见 candidate-manifest.json。目标为 #62 来源网络和 #63 错误提示修复，并复验诊断、原业务功能和升级；包仍为三入口架构。

先运行 verify-kit.ps1，再依次读 HANDOFF.md、FIXES.md、REGRESSION.md 和 RESULTS.template.md；在 Windows 原生 PowerShell、官方 Desktop/npm DSH 0.2.0-rc.2 两种形态分别执行。完整 W0–W12 与 R1–R9 不继承 Mac 的通过标记。先做脚本解析与 W0/W1、W2–W4，再检查两个修复。

当前候选是 -7；history/ 内 -4/-5/-6 仅用于升级。MAC-ACCEPTANCE.md 说明最新 Mac 证据与调查限制；evidence/legacy-diag6/ 内所有文件都保留旧 -6 身份，仅为历史或未受影响功能的参考，不能当作 -7 的完整验收。

原 G6 严格结果 7/10（3 fail、1 not-run）保留；本轮 Q01 在旧 -6 的五次重复测试全 fail。不得改变评分规则来翻转结果。无真实受限账号继续记未测，fixture 不代替实机/权限/模型验收。

在隔离 profile/CLI store 操作，保护原用户进程、配置与凭据。只回传脱敏证据、实际下载绝对路径与 SHA、版本身份、逐项结果、脚本修正 diff 及清理记录。不能重建/修改候选或宿主、使用 WSL/inspector、发布/合并/tag 或向其他聊天发送消息。
