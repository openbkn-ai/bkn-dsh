# Windows final verification results

日期/操作人/handoff commit：
证据分支/固定回传 commit：
包版本/source/原 CI/主线彩排/tgz SHA：
kit commit/ZIP SHA/实际工具路径和版本：
两隔离 root/profile/实际 Host/端口：

| ID | Desktop | npm | 原件绝对路径 / reportId / bytes / SHA / 实际退出码 | 判定依据及限制 |
|---|---|---|---|---|---|
| A0 identity | | | | |
| A1 W4 fail -> recovery | | | | |
| A2 R9 adjacent patch hashes | | | | |
| A3 state and owned cleanup | | | | |
| A4 synchronized F02 | n/a | | | |
| B1 real login | | | | |
| B2 F01 / mixed-network UI | | | | |
| B3 original three questions | | | | |
| B4 live guard | | | | |
| B5 remaining G6 | | | | |

每格用 pass/fail/not-run/insufficient-evidence。旧证据不可当成本轮同步记录，未测不计入通过分母。

## State files and adjacent hashes

选定文件清单/存在性/before SHA/卸载紧邻 after SHA/重装 after SHA/最终 SHA；实际受控写入逐项解释。凭据正文不回传；日常目录 mtime 不替代内容哈希。

## Owned process table

轮次/form/root/Host PID+creationTicks/子 PID+creationTicks/port/身份核验输出/停止 exit/端口释放/原生记录路径。boot.pid 异常和手动停止分别记录，不以 helper 零 diff 消除执行偏差。

## Model/data provenance

模型/High/原题/会话 ID/native turn/end/完整工具轨迹；独立 oracle before/after、数据漂移、BOM字段/标记/记录数比较；F02与真实问答分列。

## Export identity and Git equality

本地原件 path/bytes/raw SHA/Git blob SHA/是否完全相同。发生换行转换时保留两者和转换说明，不能称原始字节完全一致。

## Remaining items

逐项列缺失前提、失败或证据不足，以及后续可执行步骤；真实受限账号缺失维持 not-run。不得据测试通过宣称发布。
