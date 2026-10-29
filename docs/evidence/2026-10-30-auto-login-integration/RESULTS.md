# 自动登录增量独立 PR 集成检查点（2026-10-30）

本次范围由维护者明确授权：整合自动登录增量及52b3f32收口文档，完成必要独立评审、build-only CI及正常PR合并；以冻结auto.local.2为基准，只补必要差异验证，不发布、不动latest/本机npm CLI、现有Host、正式0.2.0或数据配置。正式PR审批及合并状态以承载本记录的PR为准，本记录不冒充已发布。

## 已固定的 CI 与候选

- 成功CI：[40920391148](https://github.com/openbkn-ai/bkn-dsh/actions/runs/40920391148)，源码42fe36206171e85b023bed2640ad2378f8023817，release-plugin.yml，publish=false。插件658项（657 PASS/1项Windows专用SKIP）、仓库73 PASS、companion保全1 PASS、包审计及16个exports/main/types路径齐备。Linux/Node22.19上两官方npm运行时0.2.0-rc.2及0.2.1-rc.3的受控guard/CSV/native-output/Remote检查均通过；这是CI既有自动检查，不是重跑真实平台/GUI/G6。
- 原验收基准：auto.local.2，SHA96dc62d7ef9bded5ca45861a9d8d5e0f627f30a365a38590d7cbb541a9867571，94文件。原归档、Mac及Windows8b5ee49/52b3f32收口证据完整保留。
- CI修订归档：同一未发布版本名，独立SHA **7c99d259758fabf1c14853d487904e81ffb51d799dd268e39326b299b372bcfc**，259623字节、94文件，[归档](ci-candidate/openbkn-dsh-business-context-0.2.1-rc.3-openbkn.0.2.1-auto.local.2.tgz)。不覆盖原96dc62d7归档，不能只按版本串识别这两个候选。
- CI解包94/94与本机已做差异验证的修订构建逐字节一致；tgz容器摘要不同，不冒充压缩包整体相同。对原验收基准，只有lib/business.js及两份相关类型声明变化，91文件相同。客户端9d15a9e7、CLI预加载、授权浏览器实现、原生MCP41db8cdb及package.json均不变。

## 必要修复与差异验证

首轮CI40917633768未产出候选：插件655项（654 PASS/1 SKIP），仓库因缺auto.local.2的CHANGELOG节点有1 FAIL。已补根目录CHANGELOG，原失败保留，不修改冻结包中的README或已有记录。

本次独立源码评审另复现P1：平台身份变更并重新授权后、MCP刷新前，旧实例的旧凭据可能沿共享fetch发往新身份。仅在3个生产文件增加授权代次快照/发送前核对，MCP与原生reader都在读取凭据之前绑定代次；不添加token映射/轮询/业务算法或改Host、CLI、OAuth/UI。3项新增回归修复前0/3、修复后3/3，实际编译类的同3项loopback TLS检查3/3；CI的business.js与已验证编译文件SHA同为14c080205500ef09318af272ba1ef4617c0280eb707f516df3c72befc8c6dd8e。详见[独立评审](INDEPENDENT-REVIEW.md)、[差异清单](CI-CANDIDATE-COMPARISON.json)和[CI回执](CI-RECEIPT.json)。

原Mac/Windows受影响UI、取消和持久化等已过项按原身份复用，不写成修订CI包又跑了物理Windows/真实授权或整体正式验收。新增代次隔离只补合成源码/编译交付边界，未新开Host、真实账号、模型或业务调用。原五分钟滞留唯一根因、精确翻转时刻及Windows退出码UNKNOWN继续披露。

## 上游与发布边界

只读刷新：DSH f3803c96974ad4a94195fb97e5c637e9c2a3afe3、SDK fb6f228c7b33aac6227737425c78b60a519c6578未变化；Foundry从7f846a15到c102555dcbe057f0b583180ec5a45ee89b64ab7d的7提交涉及项目发布/需求存储与语义命名提示，不改变本次CLI/OAuth/TLS契约，也未部署。支持Host、实际平台/CLI0.2.0及版本串OpenBKN0.2.1发布标识的口径不变。

本次不推tag、不执行publish=true、不创建npm/GitHub Release或改dist-tag。CI发布步骤及GitHub Release job跳过；latest及本机npm CLI由维护者处理。原formalAcceptanceEligible=false报告不改写；本检查点完成的是PR集成与候选差异核验，后续发布仍须遵守原发布门槛。
