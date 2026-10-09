# Windows -8 首次使用结果

日期/起止时间与时区：待填。证据分支/固定 commit：待填。执行文档固定 commit：待填。**只写实际完成的事实；pass/fail/not-run/insufficient-evidence 分开。未经主开发复核不宣称发布。**

## 固定身份与环境

| 项 | 实际值 / 原件 |
|---|---|
| 候选源码完整 SHA / CI run URL / publish=false | 待填 |
| 插件版本 / tgz 路径、字节数、完整 SHA-256 | 待填 |
| 逐文件清单路径/SHA/数量 | 待填；不预设 66 |
| 下载/原生 verifier 输出与退出码 | 待填；若没有独立 verifier 不填通过 |
| Desktop 应用/CLI：版本、路径、profile/root | 待填 |
| npm 官方 CLI：版本、路径、profile/root/端口 | 待填 |
| source：DSH commit/版本、Node/CLI 路径、profile/root/端口 | 待填 |
| Node/pnpm/OpenBKN CLI：实际版本与路径 | 待填 |
| 平台部署/工具契约基线、CA 指纹来源 | 待填；不得凭 URL 推断版本 |
| 每形态安装清单：actual/missing/diff/extra | 待填，提供机器可读原件 |
| helper commit/SHA / 与原件 diff | 待填；本轮启动操作偏差另列 |
| 首次空 CLI store、后续授权/模型来源 | 待填，区分 fresh login 与 restored store，凭据不入库 |

## 场景结果

| 项 | Desktop | npm(web) | source(web) | 输入/操作、UI/报告/原生输出引用 |
|---|---|---|---|---|
| F0 无预设 URL/未登录/待配置/独立诊断 | not-run | not-run | not-run | 待填 |
| F1 空/非法 UI 提交及 patch 不变 | not-run | not-run | not-run | 待填 |
| F1 独立非法持久化配置隔离分类 | not-run | not-run | 不要求 | 待填 |
| F2 URL/非默认 cliPath 保存与重启 | not-run | not-run | not-run | 待填 |
| F2 其他字段保留/高优先级覆盖拒绝 | not-run | not-run | 不要求 | 分列实际测到的两项 |
| F3 CLI 缺失→路径修复 | not-run | not-run | not-run | 待填 |
| F3 产品首次真实授权与列网 | not-run | not-run | not-run | 待填；restored store 不能替代 |
| F3 明确401→同Host真实重登恢复 | not-run | not-run | 不要求 | 故障输入、真实login exit0、恢复报告分列 |
| F4 TLS/CA恢复、网络失败、403 | not-run | not-run | 不要求 | 三项分列，没条件不得合并算通过 |
| F5 关闭/重开/重载旧请求 | not-run | not-run | not-run | 记录延迟窗口与事件，不能只引用单测 |
| F6 空闲地址变更/忙时拒绝 | not-run | not-run | 不要求 | 保存结果、patch/绑定SHA |
| F6 新地址Token围栏/旧观察与资源释放 | not-run | not-run | 不要求 | UI/API/受控探针不同证据层分列 |
| F7 Standard真实问答/溯源/重启续接 | not-run | not-run | 不要求 | completed与事实正确分别判定 |
| F7 业务坏导入/诊断坏导入隔离 | not-run | not-run | 不要求 | 变体元数据与恢复固定包 |
| F8 UI卸载/紧邻哈希/固定包重装 | not-run | not-run | not-run | 三哈希、依赖/row/文件核验 |
| F8 CLI卸载最小轮 | not-run | not-run | 不要求 | 待填 |

配置已保存、CLI已授权、MCP连接、目录已解析、模型已完成、事实正确分别记录，不能互相替代。首次未配置时 `configuration-required/not-run` 是预期；未测连接不要求全绿。以下均维持独立状态：受限账号 G6 not-run（用户决定）、其余模型评测/历史平台超时落库/Token拒绝根因，不在本轮顺带修复。

## 产品导出与变体清单

每份产品 JSON 一行，副本/重复 reportId 也列出，数量按实际统计，不预填：

| 形态/场景 | reportId | 下载绝对路径 | 字节数/完整SHA-256 | UI/API/其他 | 原件仍在？ | Git blob：identical/normalized/unavailable |
|---|---|---|---|---|---|---|
| 待填 | 待填 | 待填 | 待填 | 待填 | 待填 | 待填 |

| 变体ID | 固定base tgz SHA | variant tgz SHA | exports目标/实际文件 | before/after SHA | 安装差异/恢复固定包证据 |
|---|---|---|---|---|---|
| 待填 | 待填 | 待填 | 待填 | 待填 | 待填 |

## 用户文件与进程收态

- before/after 原件路径、同清单唯一文件数、存在/缺失/差异：待填；只覆盖选定文件，不延伸为整个 home 不变。
- F8 每形态用户 patch/绑定/工作区：卸载前、卸载后立即、重装后完整 SHA 与采集时点：待填；其间任何受控写入明确披露。
- owned PID 全表：形态/轮次、pid、创建时间（UTC/local注明）、exe、端口/listener、pid原件、停止身份核验、退出与原生输出路径：待填。被 cleanup 消费前是否存副本：待填。
- 终态进程/端口扫描、日常 profile after、隔离 store/session保留范围：待填；任何 skip/缺档如实 insufficient-evidence，不用当前零残留补历史停止证明。
- 凭据扫描命令/范围/结果：待填；Git字节比较和换行/编码归一规则：待填。

## 偏差、缺陷与待确认

逐项写真实症状、场景/包身份、复现输入、原件、影响、临时处置和最终状态。浏览器重启/下载延迟只说明观察顺序，不推断候选或平台根因。真实缺陷不得改候选后沿用原身份；未测/证据不足列具体原因与下一步。未改源码/helper/main、未发布/tag/dist-tag的实际边界：待填。

回传：固定 commit、主 RESULTS 路径、全部新增/修改文件清单、未测项与主开发需处理问题。commit/PR内容用英文；会话说明用中文。
