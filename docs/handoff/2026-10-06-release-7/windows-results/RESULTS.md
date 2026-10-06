# Unified -7 Windows retest results

Date / operator / report commit: 2026-10-06 晚 / Windows agent（ZCode，kalia 机器）/ 本次回传分支 docs/unified7-fidelity-windows-results

## Fixed identity

- Candidate version / source commit / CI run / tgz SHA / ZIP SHA:
  `0.2.0-rc.2-openbkn.0.2.0-7`；源码 `3414bdec3c956cc0d580aebd959ac6f3439bb352`（PR #72）；CI 37478119730（publish=false）；tgz SHA-256 `6bbab27876e743032572ddce107fcce09e0d681f87bee19fba8d78180e5a63a8`（177,442B/66 文件）；交付 commit `1fcffa9227d14bac7ff8d628ebd0f8398a965675`；ZIP SHA `df0016c6d2b511c009f932402dd80155248c4ac61260cbd3cad70ecb483cef54`（248,434B/31 项，实际下载核验 size+SHA 均匹配）
- Desktop / npm DSH / Node / PowerShell / pnpm / CLI versions:
  Desktop 0.2.0-rc.2（随附 node 24.18.1/pnpm 11.7.0，桌面 dsh.cmd --version=0.2.0-rc.2）；npm 形态用隔离官方 @deepseek-ai/dsh 0.2.0-rc.2 + Node v24.21.0 + pnpm 11.7.0；原生 PowerShell 5.1.19041.5848；OpenBKN CLI 0.1.5（实测 --version 输出）
- Actual new roots / profile / CLI / executable / isolation proof:
  新建 `C:\bkn-verify\unified7-fidelity-desktop`（desktop profile，Desktop exe 原生启动）与 `C:\bkn-verify\unified7-fidelity-npm`（web profile，隔离 dsh.cmd web，端口 18271-18282）；各自独立 DSH_HOME+BKN_CONFIG_DIR；工具树复用已核验 diag6-tools；全程无 WSL/inspector（developerTools:false）
- W0 static file hash match / actual Host load proof (separate):
  静态：两形态安装后与 candidate-files.json 逐文件比对 **66/66 一致（missing=0 differs=0 extra=0）**，installedVersion=-7；verify-kit.ps1 通过。实际加载：插件管理器三 row "共 3 个 · 3 运行中"、v0.2.0-rc.2-openbkn.0.2.0-7（desktop R9 前后两次 + npm R9 后一次），报告 pluginDisk=0.2.0-rc.2-openbkn.0.2.0-7

## Results

| Case | Desktop result | npm result | Evidence level and path / report id / SHA | Limitation |
|---|---|---|---|---|
| W0 | pass | pass | 逐文件哈希 + 插件管理器身份 | 静态与加载分列如上 |
| R1/W1 | pass | pass | 产品导出 JSON：desktop `W1-desktop-89815bc6`；npm `W1-npm-4484d6cf` | 三 entry pass、cli pass、login-state fail/not-logged-in（真实未登录）；侧栏单一入口、右上角仅"诊断"；npm 平台地址显示正常。无凭据不要求 Context Loader 全绿 |
| W2a | pass | pass | JSON：desktop `21d979e6`；npm `785aa906` | 两形态 `business-entry fail/configuration-invalid/configField=baseUrl`，诊断可开可导出 |
| **W2b** | **pass** | **pass** | JSON：desktop `c391a9d0`；npm `380f2566` | **非法 URL 在 configuration 阶段拦截（-6 缺陷已修复）**：两形态 `fail/configuration-invalid/configField=baseUrl`；npm 轮确认非下游 network 失败（无 network-unreachable/tls-failed） |
| W2c file:/// | pass | pass | JSON：desktop `471f926a`；npm `d46c681b` | 非 HTTP(S) 同样 configuration 拒绝 |
| W2c relative | pass | pass | JSON：desktop `9808646a`；npm `1f8e01d4` | 相对路径同样拒绝 |
| W2c recovery | pass | pass | JSON：desktop `26bc3445`；npm `67e954e6` | 恢复合法 URL 后 business 加载成功、报告中无旧 configuration-invalid 残留；为重启配置恢复，不冒充同进程在线恢复 |
| W3 | pass | pass | JSON：desktop `e6455961`；npm `0f3240ad` | 基包不变（变体 SHA 由 run-case 记录于各 root evidence）；外框保留、诊断独立、`fail/module-resolution-failed` |
| W4 | pass | pass | JSON：desktop `e10ad569`；npm `d1c48003` | `fail/initialization-failed`；诊断独立保留；后续 W2c-recover 轮证明撤销故障后恢复 |
| W10 | pass | pass | 产品 UI 观察（降级态无导出按钮，如实不造 JSON） | 业务入口保留（登录 UI+平台地址）；"诊断服务不可用（诊断入口未随插件启动或连接中断）"如实降级；无 raw error |
| W9 | pass | pass | JSON：desktop `bc6e7538`；npm `c2fe2ef7` | canary baseUrl/cliPath/伪造 token（含短凭据别名 CANARY-SHORT-AB）在导出 JSON **grep=0**；UI 亦无 canary；observed:cli=fail/cli-missing（canary cliPath 不存在，如实） |
| H01 | pass | pass | desktop W1 JSON：hostForm=`desktop`；npm W1 JSON：hostForm=`unknown` | npm 形态真实身份另证：隔离 dsh.cmd CLI + web profile + 端口监听者命令行；不以 Node 存在推断 npm（-7 修正后行为） |
| R9 | pass | pass | UI+磁盘核验+CLI 重装（操作记录） | 卸载后：三 row/UI 消失（desktop+npm 插件管理器实测）、deps 清空、@openbkn 空壳、用户 patch 保留；CLI 重装 exit 0；新 Host 三 row 恢复"共 3 个 · 3 运行中"、版本 -7。未做旧版升级（按通知） |
| F02 controlled runtime | n/a | **pass（6/6）** | `fidelity-runtime.jsonl` + prepare 输出（包件 66 文件核验、官方 npm DSH 0.2.0-rc.2 peers） | 六场景显式 pass：corrected-same-turn / second-mismatch-errors / unbound-unaffected / full-question-summary-rejected / headerless-cached-reprint / scoped-inventory-cached-repair；受控 fixture，不替代真实问答/权限验收 |
| F01 | not-run | not-run | — | 需真实登录授权业务图；无凭据，未用模拟 fixture 冒充 |
| G6 | not-run | not-run | — | 需真实模型/平台凭据；未被要求不产生费用；不继承 macOS 三题结果 |
| live guard | not-run | not-run | — | 需有效登录 + 两个真实网络；不以模型自觉替代 |

## Failures / deviations

- 无候选缺陷发现。本轮全部可测项通过。
- helper：**零修正**（kit 三脚本与 Windows `54f6669` helpers-fixed 逐字节一致，diff=0）；verify-kit.ps1 本轮更新版原生执行通过。System32 前置 PATH 仅作子进程环境（GNU tar 不认盘符路径），未改任何 kit 字节。
- 过程偏差 1 例（非候选、已纠正）：W9 desktop 轮的 boot.pid 记录行因脚本内引号错误失败（W9 桌面应用改由身份核验后手动停止：pid 6788 exe 路径匹配后 Stop-Process）；不影响任何判定证据。
- 设置向导每次启动重现（DSH 应用层既有观察，-6 轮已记录，根因仍开放）；本轮通过"添加 API Key→稍后配置"路径稳定进入主界面。

## User state and cleanup

- 状态哈希：两 root 各 case before-*.json + after-matrix.json（仅隔离 root 内 profile 文件，collect-state-hashes 输出）
- 用户状态：验收开始与结束时用户 ~/.dsh/profiles 均仅 desktop、work（mtime 扫描未发现变化；不以 mtime 证明内容未变）；本轮所有进程经身份核验停止（children 记录 pid:port:creationTicks，cleanup 输出 "listener verified"）；结束态本轮 node/DSH 进程 0、端口 18271-18282 全释放
- canary 伪造凭据与 canary patch 已清除，两 root patch 复位健康配置；根目录保留（R9 终态=已重装 -7 候选）
- 未回传 private/ 下 web 启动日志（含访问 token）

## Acceptance boundary

- 未做旧版升级（按通知：完全移除后重装）；未合并/未 tag/未 publish/未动 dist-tag/未改 main；仅新增本证据分支
- 已验证：W0/W1/W2a/W2b/W2c×3/W3/W4/W9/H01（两形态产品 JSON）、W10（两形态 UI）、R9（两形态操作记录）、F02（npm 受控 6/6）
- 未测（无凭据，如实）：F01、真实 G6、live guard、真实登录链路；受限账号项保持 not-run
- 平台 #2029（深层库存超时）、历史故障机器根因、设置向导重现根因各自保持开放
- 发布门禁由主 agent 复核后决定；本报告不宣称发布
