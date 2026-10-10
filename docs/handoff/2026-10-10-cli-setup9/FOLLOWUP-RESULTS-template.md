# -9 CLI 收尾：Windows 受影响复测结果

交接完整 commit：待填。执行时间（UTC 起止）：待填。

source `6b372ff703d773a4c47ff3cf13972a047fa81ebd` / CI `38058120767` / 版本 `0.2.0-rc.2-openbkn.0.2.0-9` / tgz SHA `dd2d50a2fdda8e55f1ff355b6121113fc6106aeeb6664463bc218cb9b366c887` / 183344 bytes / 69 files。

结论：待填；区分通过、候选缺陷、环境/操作偏差、未测。本轮不发布。

## 环境与固定输入

| 项 | 实际值 / 原件 |
|---|---|
| OS / 架构 / PowerShell / Node / npm | 待填 |
| Desktop / npm DSH 实际路径与版本 | 待填 |
| 两隔离 root / prefix（含空格）/ registry / PATH fixture | 待填；不含凭据 |
| 原生 verifier / 独立 exit / 清单完整 SHA | 待填 |
| 两形态安装件（69/69，missing/different/extra） | 待填 |
| 开测 before 清单与范围 | 待填 |

## 逐项结果

| ID | Desktop | npm | 输入 / 证据路径 / 未测边界 |
|---|---|---|---|
| F90 身份 | 待填 | 待填 | 待填 |
| F91 目录与逐字输入 | 待填 | 待填 | 待填 |
| F92 缺失主面板引导 | 待填 | 待填 | 待填 |
| F93 一次真实安装与安装中重开锁定 | 待填 | 待填 | 待填 |
| F94 已保存提示 / patch 字段与哈希 | 待填 | 待填 | 待填 |
| F95 登录边界 / 卸载保留 SDK与patch | 待填 | 待填 | 待填 |
| F96 PS5.1 canonical verifier 与 CRLF | 待填 | 待填 | 待填 |
| F97 listener 错误/空记录拒绝及实际停止 | 待填 | 待填 | 待填 |

C98 既有 CLI/auth 失败保留：待填；无自然输入则保持未构造，不借凭据补造。

## 证据来源与字节对照

逐件列完整 SHA-256、字节、实际保存路径、来源（产品 UI下载 / Host API / DOM / 截图 / 转录 / fixture / native）。对当前文件真实读 Git blob 比较；逐字节一致、CRLF→LF 归一一致、原件已清除分别记。该清单不要包含自己的待定哈希。

## 偏差 / 收尾 / 剩余项

待填每个 Host 的 PID、创建时间、exe、listener 记录、内部 Log、外层全流、退出码及停止后检查；自退出另列。待填 after 同清单比对与范围；不延伸为整个机器未改动。待填本轮相关进程/端口终态及 prefix 保留。

未运行项及原因：待填。测试 Key 撤销/宿主隔离属于外部状态，本轮不借用或输出 Key。

回传独立证据分支与完整 commit；不改候选/helper/源码/main，不发布、不打 tag。
