# 第67轮：Windows回执审阅与controller OS透传最小修复

2026-10-26。已接收Windows固定5e55d09的结果；本轮审阅并完成局部修复，未推送、未跑CI，未执行GUI或真实平台/业务。`local-development-preacceptance; ciRun=null; formalAcceptanceEligible=false`。

## 接收与准确判定

结果分支 `docs/windows-021-profile32-gui-results-20261026` 的远端ref核对为 `c0fa28d87464a449002cb3fcc633eda1f8283aa0`。通过指定完整commit取得4个base64原文件，逐项核对Git blob SHA1和长度，再计算SHA256：报告 `ece2251fc22e9eb3785a746cc73014333489cee91af1d0f0628babe3be9271ee`、manifest `20699ea2baf670e534f8eb1d560142849e6fd83ca9c8b36686527cd2e50276c0` 与用户回执相同，manifest两项publicEvidence也匹配。

[原报告](windows-public/results/RESULTS-profile32-gui-20261026.md)、[原manifest](windows-public/results/evidence-manifest-profile32-gui.json)、[输入校验](windows-public/results/verify-inputs.json)保留原字节。私有controller日志/summary/.reg/SID/诊断原件未读取，环境与收态按远程报告接收，不向用户索取已足够定位问题的私有数据。

| 子项 | 接收结论 |
|---|---|
| 输入82/12、资源与新profile准备 | PASS，保留各自范围 |
| controller内启动前Before | FAIL；最小环境缺OS，PS第9行在注册表访问前退出 |
| 完整环境诊断Before | 按报告成功；不等于修正后controller链已通过 |
| 真实业务自动加载、官方GUI窗口/正常退出 | NOT_RUN；整轮BLOCKED |
| After/Restore及修改后关联恢复 | NOT_RUN，无GUI写入，因此本轮无需执行 |
| 保全/fixture/owned收态 | 按报告PASS，未读私有原件 |

原报告末句“备份/恢复守卫均已验证”不能扩大为After/Restore实际通过；原件不改，也不要求Windows重写历史报告。官方EXE确实被Node模式inspect调用，未创建的是owned GUI进程；两者分开记载。

## 根因与局部修复

源controller的baseEnv白名单没有OS；`system-association.ps1`用 `$env:OS` 检查Windows。Windows诊断A剥离OS复现、诊断B完整环境Before成功，与本机源级检查一致。根因是主会话提供的controller缺陷，不归因于插件、原官方Host、用户环境或平台。

只在新本地副本的原白名单中加入OS。PowerShell守卫、备份/恢复实现、GUI/业务流程及其余白名单项保持原字节，不新增环境模块、启动器或发行体系。冻结5e55d09、-30/-31/-32及12文件payload不改。

本地副本在 `release/local-67/handoff-r2/`，唯一代码差异为 `kit/run-gui-proof.mjs` 的一个数组项；其他差异仅为明确“本地未发布”的说明/INPUTS状态及重算摘要。该副本没有新远端提交，不可沿用旧5e55d09作为其身份。[结构化审阅与修复](REVIEW-AND-REPAIR.json)记录本地摘要。

五项定向回归直接提取并执行**原/修正controller的实际baseEnv源码块**，将结果传给真实Node子进程：

1. 代码精确只有OS透传差异，PS原文不变。
2. 原controller子进程确实缺OS，负对照成立。
3. 修正后子进程收到父环境的Windows_NT，其余环境值不变。
4. 凭据/模型/Node模式字段仍不继承，新隔离home仍正确。
5. 父环境缺失OS或非Windows值时，不伪造Windows_NT。

结果5 pass/0 fail。这里验证的是Node构造/传递环境及守卫谓词，不是PowerShell或注册表实测；Windows修正版Before→GUI→退出→Restore链仍未验。修正版输入校验82/12与Node语法检查通过，没有重跑旧矩阵、跳转、UI、登录、B1或G6。

## 后续最小范围与保全

Windows只需使用新taskRoot完成同一短流程。前置输入/资源沿用已核对身份，不另立安装或准备专项；保留首次失败和诊断目录，不在旧taskRoot覆盖或继续。备份成功才启动一次官方rc.3 GUI，验证真实业务自动加载、窗口、正常菜单退出、关联恢复和owned收态；不增加其他形态或新验证体系。

当前遵循用户“不推送、不跑CI”的限制，仅准备本地修正。若后续获新的交接授权，再固定新分支/完整commit/KIT摘要；没有新发布授权或Windows执行结论。#105与总验收保持开放，已过Mac和Windows8/8证据继续复用。

正式0.2.0、现有Host、业务数据配置与证书信任无本轮操作；未采用-11。上下游默认头与第66轮相同，本次不改SDK/pins/工具契约。原文件/制品/交接保全见[PRESERVATION](PRESERVATION.json)。
