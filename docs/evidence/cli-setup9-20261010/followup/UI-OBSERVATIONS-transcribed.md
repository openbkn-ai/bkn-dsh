# Mac UI 会话观察转录（不冒充独立 AX 原档）

来源：本轮 Computer Use 返回的实时 AX/DOM 内容，操作员按可见文字和状态转录。Desktop Host pid=24636，官方 `0.2.0-rc.2`，候选 source `6b372ff`。本文件为 transcribed，不是 UI 导出或完整 AX 原档。npm 的两张 PNG 是产品截图，已逐张查看；native 进程/版本/安装计数证据另见 JSON。

反复调用 getAXState 的默认增量模式使若干 `.txt` 只有“界面未变化”和焦点行；原文件保留，不把它们单独当可见文案证明。表中 Desktop 安装生命周期来自工具实时返回，不延伸为原档已经完整归档。

| 顺序 | 形态与动作 | 实时可见观察 |
|---|---|---|
| D1 | Desktop 输入现有 `/private/tmp/bkn-cli9-followup-mac/desktop` 目录 | cliPath 字段可编辑，文字“此路径是目录，请填写 CLI 可执行文件的路径。”；点击检测后仍相同，独立 install 计数为零 |
| D2 | Desktop 恢复 openbkn，并保存 URL 与默认命令 | 主面板显示“当前 DSH 尚无法使用 OpenBKN CLI。请点击右上角‘设置’→‘高级设置’，使用‘检测并安装 CLI’”，并提示该处查看安装进度 |
| D3 | Desktop 显式点安装（真实 npm 前 60 秒 fixture） | cliPath disabled；“正在安装 CLI 0.1.5 并验证是否可用…可以关闭面板，安装将在当前 DSH 中继续。”；安装/保存按钮 disabled |
| D4 | 安装中关闭面板→重开主面板→设置→高级设置 | 主面板显示新引导；高级设置仍“安装中…”，cliPath 与保存仍 disabled。重开观察的工具记录时刻为 2026-10-10T14:38:24.555Z |
| D5 | Desktop 安装完成、未保存 | 草稿为 `/private/tmp/bkn-cli9-followup-mac/desktop/CLI Prefix/bin/openbkn`；“CLI 0.1.5 可用。路径已填入，请点击‘保存并继续’应用。” |
| D6 | Desktop 保存→重开设置/高级设置 | 保存路径回读正确；仅“CLI 0.1.5 可用。”；保存后的主面板仍要求 CLI 登录，未当成已登录 |
| N1 | npm 38 个逐字符输入目录 | 逐字符 DOM 字段回读记录可编辑/聚焦；目录提示见 `npm-directory.png`；install=0 |
| N2 | npm 安装完成，未保存→保存→重开 | 未保存要求应用路径；保存后仅“CLI 0.1.5 可用。”，完整 AX 与截图见 `npm-ready-saved.txt/png` |

`desktop-installing.txt` / `desktop-reopened-installing.txt` 仅为重复 AX 的增量回读；不称为完整 installing 捕获文件。npm 安装中关闭/重开的时间没有锁定，不算该瞬间验收；Desktop 现场观察计为转录证据。安装最终成功另有一次真实 install 参数记录、独立 CLI 0.1.5 exit 0 和落盘 patch 字段/哈希。

补采：Desktop pid=29853 在解锁后采集两个完整 AX 终态，分别为 `desktop-directory-full-ax.txt` 与 `desktop-ready-saved-full-ax.txt`。不覆盖原重复回读，不把新 Host 终态倒填到旧 Host 的安装中场景。`desktop-recapture-check.json` 确认 install 总数仍为 1、patch 字节未变；`desktop-recapture-stop.json` 留存停止核验。
