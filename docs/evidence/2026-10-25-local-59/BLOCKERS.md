# 第59轮后的剩余门槛

| 项目 | 当前状态 | 下一步 |
|---|---|---|
| 独立GUI构建/签名路径 | 已完成本轮评审 | 两基线差异、source anchors、工具lock、隔离与签名顺序已列清 |
| GUI隔离源码集成 | 未实施 | 新入口/builder落实独立identity/data/logs/锁、禁止全局CLI/协议与默认debug、固化cold-start runtime、确定自己的更新/手动分发合同；descriptor校验不算实现 |
| 干净全仓GUI构建 | NOT_RUN | 独立源+原lock/工具链+回补patch系列；旧Mac不能套rc.3 unsigned命令；准备后和最终ASAR双重验payload |
| Mac生产签名/公证 | BLOCKED | 本机0 valid identities；真正签名阶段才需要明确主体和受控签名环境，当前不索要私钥/密码 |
| Windows签名与GUI | NOT_RUN | 独立runtime/GUI未交付；原生签名、版本/ASAR与发行签名分开验证；不能沿用原官方ASAR修改前签名 |
| Windows r1输入材料 | 准备PASS，执行未授权 | 82/9/12/12输入核验、KIT-FILES固定；--require-gui正确exit2；探针仅语法检查 |
| 当前d20a266补证 | 等回传 | -31 U1/溯源/精确800×600；-30单独W-LIFE，不扩容，不转记 -32/rc.3 |
| #105源码/完整Host/CLI | 复用已通过范围 | 第53/57/58轮保留，不重跑；不能拼接成独立GUI/Windows/最终候选验收 |
| runner/browser、浏览器信任 | 原边界开放 | 等Windows原补证；未改Job/cancel策略，未调整信任 |
| 模型G6、销售/BOM/CSV、Function/run_code | 原合同待验/受阻 | 正式0.2.0/Sandbox处置不变，不执行可能触发Sandbox的模型题 |
| 非空原生业务解释/低权限 | 原受阻项 | 原生业务路由404、独立低权限账号暂缺 |
| 最终CI/八组合/发布 | NOT_RUN | 当前禁止推送/CI；全部收敛后依授权固定正式候选与最小受影响验收 |

本轮完成“查清构建签名路径、准备Windows最小材料”，没有交付GUI二进制。#105仍OPEN，远端状态未改；已关闭issue按自身标准保持。当前无需用户配合登录/目录选择/凭据，Windows结果回传后统一汇总。
