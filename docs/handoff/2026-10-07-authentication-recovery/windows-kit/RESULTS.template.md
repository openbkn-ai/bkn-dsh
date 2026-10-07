# Windows 鉴权恢复与原生回答边界复测结果

- 回传固定 commit / 分支：待填写
- 源码 / CI / tgz：c91fe090e0aac2dc72a4ff1b3d221d72baa432ba / 37570295456 / fa168d8113e8dd43348ea4751c7e4d297049e2c1ddced9c586e6d3a1f3f0718c
- kit ZIP SHA / 下载实际大小：待填写（不是 CI artifact ZIP SHA）
- 实际 Desktop/npm/Node/CLI 版本与路径、平台/model：待填写
- 测试开始结束时间 / root / profile：待填写

| 项 | Desktop | npm | 证据路径 / 原生输出 / 退出码 / 限制 |
|---|---|---|---|
| N0 包/加载身份（65 文件、missing/diff/extra） | 未测 | 未测 | |
| N1 正常入口/诊断/真实导出 | 未测 | 未测 | |
| N2 非法 URL 拒绝与恢复 | 未测 | 未测 | |
| N3 原生输出与 guard fixture（8 项） | 不适用，npm 核心 fixture 单列 | 未测 | |
| N4 原始 BOM 题 native completion / 独立事实 | 未测 | 未测 | |
| N5 原始销售订单题 native completion / 独立事实 | 未测 | 未测 | |
| N6 用户内容 SHA/owned PID/终态 | 未测 | 未测 | |
| R1 MCP 401 → 产品 CLI 登录 → 同 Host 恢复 | 未测 | 未测 | |
| E1 旧回传补正（逐项 pass/partial/insufficient-evidence） | 单列 | 单列 | |

## 单独列出的证据

- verifier 全流与非空身份行、exit code：待填写
- prepare/probe argv、全新 probePackage 路径匹配、起止时间、JSONL SHA、8 个显式场景：待填写
- 每份产品 JSON 原件绝对路径 / id / SHA / Git 内容一致性口径：待填写
- daily selected-file before/after 清单 / 数量 / SHA：待填写
- 全部 owned PID 创建时间 / 端口 / 可执行文件 / 身份核验 / 停止原生输出：待填写
- 受控 patch 写入与保留范围：待填写
- 执行偏差及残留：待填写

事实正确、原生 completed、fixture 通过、真实 UI/导出是四类证据。无真实模型/授权的项目写 not-run；不把无资料写作通过。未修改候选/helper/main（若 helper 改动则附 diff）；未发布/tag/dist-tag。
