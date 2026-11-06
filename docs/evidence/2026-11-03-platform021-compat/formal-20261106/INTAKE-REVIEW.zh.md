# 正式平台与 CLI 0.2.1 增量核收

2026-11-06。结论：本次发布必需的正式平台/CLI增量已通过，可以推进原 CI6 包的评审合并与发布。此结论结合既有同包验收，不扩大为全部 Host 形态或任意后续版本兼容。

固定插件 `0.2.1-rc.3-openbkn.0.2.1-3`、源码 `f01b316fbfb6be681af81e2267a7b3341e659efd`、CI41596006291、artifact13212518096；原包877732字节、126文件、SHA256 `4500fa4357cdcdcb9914a39794aedb9096c948192c2bf0f35ecf4fadb882f046`。两端原包内容均保持，未构建或重新打包。

| 必要范围 | 核收结果 |
| --- | --- |
| 平台前提 | 50.129正式CE0.2.1部署报告已按16577字节和原始摘要核收；沿用其17Chart、指标原位保留、正常授权和有限恢复证据，不重跑部署验收。 |
| 正式CLI来源 | 两端面板实际安装官方 `@openbkn/bkn-sdk@0.2.1` 到新prefix；gitHead `41e57219ca774e3c9f82050851a39a7e25678e43`，官方SRI与9个发布文件匹配，实际版本0.2.1/exit0。未覆盖日常CLI。 |
| Mac原生路径 | 官方Desktop rc.5，原包设置保存、正常设备授权及面板登录/2网络同步通过。初始超时保留；额外观察器在场时保存失败，移除后正常原包配置成功，唯一原因未知。 |
| Windows原生路径 | 官方Desktop rc.5，面板一次安装、绝对.cmd配置、正常浏览器授权和面板同步通过。当前进程诊断确认MCP工具发布和2网络目录；这是被动运行观察，不冒称新抓包或全目录重枚举。 |
| 正式平台契约差异 | Mac独立隔离元数据采集返回26工具，与留存129目录的解析后完整JSON及全部输入/输出schema相同；原始JSON摘要不同，不称原字节相同。没有tools/call或新工具放行。 |
| 原包Reader | Mac冻结Reader的2网络目录及既有网络summary详情、能力配置校验通过；只读POST不作为业务写入。该采集与原生管理器对象/wire观测分开。 |
| 收态 | 两端正常退出、任务进程和记录端口收净；原包/Host及各自约定保护项通过。保留有限保护范围，不宣称全机或服务端数据零变化。 |

原件均从远程实际 `commandExecution.output.text` 取gzip/base64，检查分块偏移、压缩尺寸、原字节数和SHA256后恢复；未从命令参数或脚本文字复制造证。原件不做换行、编码或结论改写：

| 原件 | 字节数 | SHA256 |
| --- | ---: | --- |
| [Mac JSON](mac/MAC-CI6-FORMAL021-CE129-RESULTS.json) | 12564 | `a7d408e30d53df63db52b83f7e721b578d6ac7678d8a8bfc3dc1c26594e96dae` |
| [Mac 中文](mac/MAC-CI6-FORMAL021-CE129-RESULTS.zh.md) | 5248 | `23048f4e55d6a84cabdd0a088bfea390d245c646b248ae0b1724efc41963fc78` |
| [Windows JSON](windows/FORMAL-CLI021-NATIVE-WINDOWS-REPORT.json) | 26123 | `72dd773a2321dba66d32208f39a34b79aa7219dba2b63951bebd9e76b16928ab` |
| [Windows 中文](windows/FORMAL-CLI021-NATIVE-WINDOWS-REPORT.md) | 4692 | `ef926c59bb36ccddabbcd44c8f3e278bc13ff9f77cc6f7dd62962044abedf728` |

Mac原件的 `formalAcceptanceEligible=false` 原样保留，表示该执行者仅提供本轮边界补证、不独立签整版或授权发布。本主会话根据维护者已明确授权、既有同包验收和两端本次原件，将必要增量汇总为[PASS](../FORMAL-RELEASE-ACCEPTANCE.json)；并未把远程原件改写成全量验收。

社区版不提供企业业务溯源，保留既有企业版0.2.0证据；不以社区版代签企业版。未访问或改动50.28，未重跑已过模型/业务/guard/CSV/SourceText矩阵，未新增解释或Agent分析，不干预平台及模型输出。脚本语法、模块装配、校验器及浏览器控制准备失败均保留；没有据此修补产品或替换原包。

本记录是发布前核收，尚不代表npm或GitHub发布已完成。实际发布通过原包专用入口，核对注册表及Release附件后另行推广两个latest指针。
