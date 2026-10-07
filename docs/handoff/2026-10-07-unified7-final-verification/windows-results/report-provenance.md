# A 批 6 份诊断报告 provenance（修正补交，2026-10-07）

按复核要求补交每份报告的来源（5 UI + 1 Host API）、归档绝对路径、SHA-256 与
Git 一致性。对比基线：`docs/unified7-final-verification-windows` @ a6c9459
（本地 `git show HEAD:<repo-path>` 的 blob 与本地归档文件逐一 SHA-256 对比）。

| # | 报告 | 形态 | 采集通道 | 归档绝对路径 | SHA-256 | Git 对比 |
|---|---|---|---|---|---|---|
| 1 | A1-desktop-W4fault-88487be9.json | desktop | 产品 UI「诊断→导出」原生保存对话框 | C:\bkn-verify\unified7-final-evidence-20261007\A1-desktop-W4fault-88487be9.json | 8C54632E0326D6DFF5F4F183282CEB6089440B19C7816ACB1D91CAD61B957705 | identical（1285/1285 字节） |
| 2 | A1-desktop-recovered-659d6bc5.json | desktop | 同上 | C:\bkn-verify\unified7-final-evidence-20261007\A1-desktop-recovered-659d6bc5.json | 98EF0B649DD64624DE519E466CE63071D20C4E08CE20EDC4B75A4E96EFD13342 | identical（1850/1850 字节） |
| 3 | A1-npm-W4fault-be8eccbe.json | npm(web) | 浏览器 UI「诊断→导出」→ ZCode 子窗口原生保存对话框 | C:\bkn-verify\unified7-final-evidence-20261007\A1-npm-W4fault-be8eccbe.json | 4E22ACB1051EB3B38B5DE5795F13B04920FEE256776A044F09F49B5829185C4D | identical（1285/1285 字节） |
| 4 | A1-npm-recovered-53df4e9b.json | npm(web) | **Host API**：`/?token=`（303+cookie）后 POST `/api/openbknDiagnostics/getReport`（client-request/getReport，args 空），脚本 C:\bkn-verify\step-final-host-api.mjs | C:\bkn-verify\unified7-final-evidence-20261007\A1-npm-recovered-53df4e9b.json | 67077BC7214B4485B0722BA64B48D4AE11E2FB9F10F1283277C8570800C87DD7 | identical（1854/1854 字节） |
| 5 | UIexport-20261006T205400290Z-76ea8184.json | npm(web) | 浏览器 UI 导出（文件在 ZCode 宿主重启后延迟落盘，已回收归档） | C:\bkn-verify\unified7-final-evidence-20261007\UIexport-20261006T205400290Z-76ea8184.json | 46AE759B4AA864D52245EFE74DD6100D8F0F6CBBD91DECED6ADD24020C918A79 | identical（1850/1850 字节） |
| 6 | UIexport-20261006T205507714Z-3d9ab6c1.json | npm(web) | 同上 | C:\bkn-verify\unified7-final-evidence-20261007\UIexport-20261006T205507714Z-3d9ab6c1.json | B2D88AA95B2212D7D5276EA4E426D26B86F72300ED632C36BACF45CDDE08A063 | identical（1852/1852 字节） |

Git 仓库相对路径均为
`docs/handoff/2026-10-07-unified7-final-verification/windows-results/<文件名>`。

## 说明与限定

- 5 份 UI 导出是产品自身导出通道（产品 UI 触发、原生保存对话框落盘，文件名在
  对话框中设定）；1 份（53df4e9b）是 Host API 通道。两通道取的是同一 Host 的
  诊断快照，但**判定一致不等于字节一致**：#4(1854B)、#5(1850B)、#6(1852B)
  字节数即不同（报告 id/时间戳等字段差异），只宣称 business/bootstrap 等判定项
  一致，不宣称 byte-equal。
- #5/#6 的落盘时间（20:54/20:55Z）晚于 UI 点击时刻：期间观察到 ZCode 宿主进程
  重启（13788→2384）与保存对话框机制失效同时发生。**下载延迟与该重启的因果
  关系未证实**，仅记录时间顺序观察；为免证据缺口，恢复态先以 Host API 取 #4，
  其后 UI 导出恢复可用时补采 #5/#6。
