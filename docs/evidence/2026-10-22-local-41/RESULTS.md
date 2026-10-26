# 第41轮：Windows -30 独立远端交接

已按用户本轮明确授权，仅推送独立交接分支。另一路远端 -11 是独立版本，不采用、不合入、不修改，也不再作为本轮未来合流前置要求；历史第40轮的合流评审说明由此决定覆盖。

## 固定取件身份

- 仓库：openbkn-ai/bkn-dsh。
- 分支：`refs/heads/handoff/windows-local30-20261022`。
- 完整提交：`743eb4a09f1577ba4490f1f6ccbaad834d68a43f`，英文提交信息带 `[skip ci]`。
- [固定交接入口](https://github.com/openbkn-ai/bkn-dsh/blob/743eb4a09f1577ba4490f1f6ccbaad834d68a43f/README.md)与[完整 Windows 任务](https://github.com/openbkn-ai/bkn-dsh/blob/743eb4a09f1577ba4490f1f6ccbaad834d68a43f/WINDOWS-TASK.md)。这是30文件的独立产物分支，无工作流和开发源码，不可用它构建插件。
- 插件：`0.2.0-rc.2-openbkn.0.2.0-30`，231075字节、82文件，SHA256 `6d95ff7517dbe409875fd398784fe01049ba26d2b97c43fad65c817d3ea18ee9`。
- 远端交接 `KIT-FILES.json` SHA256：`7f1505eb85b16d2e345f7d6948292d106a1fb9cc35ac6899b30e76f6c64a0a18`，23项输入。

候选、SDK和所有执行脚本与第40轮本地材料逐字节相同；只更新HANDOFF、结果模板的交接阶段说明并重算KIT-FILES，另加仓库入口/任务/约束文件。第40轮原始本地kit及ZIP不改写，原KIT摘要 `ae1820585aa2f896c1a610f014274ee80972e78bfa46162f3da27d0c96ce436d` 仅属于当时准备快照，不用于远端当前交接。

## 本轮已验证

- 从origin全新clone，提交完全匹配；30个提交文件逐字节匹配暂存前清单。以命令级 `core.autocrlf=true` 执行clone，全部交付文件有效属性为 `text: unset`，空格路径中的完整清单/包校验通过。这是Mac上的Git取件验证，不是Windows原生运行。
- 23项交接输入、82项候选文件及官方SDK0.2.0注册表integrity通过；六类凭据/私钥模式扫描含两tgz展开内容，无命中。仅公开CA，没有私钥、业务原始记录或运行日志。
- 远端ref精确指向固定提交；复核时该分支Actions记录和PR列表均为空。没有手动dispatch、PR、tag、release或main/开发分支推送；只执行一个显式新分支refspec，并关闭自动followTags。
- 旧交接fd879740e4292836a24dc1e411ee335619ba4c41、旧结果fb77c07bc283b4f53a55179e43942949e0e1c8ca均保持；开发HEAD933b0ab、分支和index原字节不变。推送后697个既有文件全部未改；随后仅在5个本地计划入口记录这次授权、固定身份和-11独立决定，其余692个原字节不变。两个另一路-11工作树ref未变，未对其执行修改操作。

一次远端取件观察脚本误以为命令级 `git -c` 会永久写入配置，导致附加断言失败；包校验当时已经通过。随后按真实调用参数与有效文件属性纠正观察，逐文件复核通过，没有修改交付文件。详情保留在remote-checkout-verification.json。

## 仍未完成与约束

`ciRun=null`、`formalAcceptanceEligible=false`。Windows四组合实际profile、系统tar、持久启动日志、远程会话重连、登录/UI、取消及可测B1等仍须按交接合同复验。本轮不重复第40轮源码/实际Mac测试，不新增Windows或正式发布通过结论。

正式0.2.0保持，现有数据配置保留，本轮没有平台读写、服务替换或Host启动。完整真实模型G6、Function/run_code、BOM/业务CSV仍受Sandbox安全前置门槛约束；CE非空原生解释、低权限等缺口保持。旧失败不得由普通计数或夹具补写通过。详见第40轮剩余门槛。

本次授权只用于这一交接推送；Windows结果推送、开发/main同步、最终build-only CI、发布和部署仍未授权。交接任务要求先在会话回传脱敏结果、私有证据路径/SHA和受阻项。
