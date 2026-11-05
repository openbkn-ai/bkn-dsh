# CI4 Mac 官方 Desktop 最小焦点复验

结论：本轮受影响焦点回归 PASS；不等于全局正式发布验收通过。

固定源码 a52032956314cf582c0f39ed3dab2f8e80e91085；CI 41444758077，publish=false，artifact 13141832289。候选 0.2.1-rc.3-openbkn.0.2.1-3，tgz SHA256 cf9abdf4ac085506793501f5f4c7e2d3f6ff4bc8c873e07c4b6b401064ec6b8a，877325 字节、126 文件。相对 CI3 仅 lib/client.js 改变；安装及退出后均 126/126 精确一致，新 client fb12b223…，business bac538d8… 未变。

使用原官方 Mac rc.5、同一隔离 profile/user-data。官方 GUI 更新后正常退出0，再冷启动 PID 98726；不以更新前缓存窗口冒充新候选。诊断的已加载版本字段未采集，不从磁盘补填。

- 既存历史结果→键盘“重新分析”（仅本地回编辑）：原控件移除后焦点回侧栏；直接 Escape 关闭一层并回入口，父溯源场景保留。
- Tab 首控件与 Shift-Tab 末控件环回通过；历史下拉焦点保持，第一次 Escape 仅收下拉，第二次仅关侧栏并回入口。
- 一次键盘“开始分析”：忙碌态及完成态 AX 焦点均为侧栏。开始后零 Tab/点击补救，完成后直接 Escape 正常关侧栏、保留父场景、焦点回入口。CI3 同路径真实 FAIL 保留，不覆盖旧记录。
- 只读重开显示第2条已结束历史；API 从1条到2条，原条目完全不变。新增 analysis a921e0cd-4779-43f2-849e-be4f7c0292a0，completed / not_evaluable / 0建议；仅用于生命周期验证，不判业务质量。没有生成/更新解释或新增业务问答。

两次官方进程均正常退出0；Harness 进程0、任务端口65201释放。Host/日常profile六文件、原始Session均未变。仅dsh关联时间戳变化，经Before/After及当前值守卫恢复，恢复后与Before逐字节相同。任务授权及新增分析保留；仅移除已完成的会话挂接helper，防止冷启动重写CI3证据。CI3两份报告原摘要保持。

边界：观察的是原生AX焦点，未独立采DOM activeElement；未捕获原始SSE、分析POST或provider输入。未重跑复制/下载/CSV/图谱/全矩阵/Windows。知识网络目录布局未改版，不属本轮。无推送、合并、tag、发布、latest、Host升级或平台替换。私有截图和原始记录留本机，凭据存储不入证据清单。
