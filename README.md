# Windows 最小交接：-31 UI / 原 -30 生命周期

本次只交付独立产物，分支 `handoff/windows-local31-ui-life30-20261024`；执行前使用主会话提供的完整固定提交，不跟随 tip。没有开发分支同步、工作流、PR、tag 或发布。不采用、合入或影响另一路 -11。

| 角色 | 版本 | SHA256 | 字节/文件 |
|---|---|---|---|
| UI | 0.2.0-rc.2-openbkn.0.2.0-31 | 22ba0e17235ccb3c93d585f2811604f5221375ac9e3496e92e6d8c1756196e4a | 231535 / 82 |
| 生命周期 | 0.2.0-rc.2-openbkn.0.2.0-30 | 6d95ff7517dbe409875fd398784fe01049ba26d2b97c43fad65c817d3ea18ee9 | 231075 / 82 |

`kit/lifecycle30` 是 fac4db78a1a974192fa13fdbe62063331cf04ec1 的 r3 kit 逐字节副本（KIT-FILES SHA256 7daaca61691706ef476ce007eb4c49e8a8f538a30dc73764fea6f6a4281308d0）。`kit/ui31` 复用未改 helper/校验器/SDK/CA/pins，仅候选和对应清单不同。两候选只差 `lib/client.js`、`lib/types/client/locales.d.ts`、`package.json`；Host/Remote 相同。顶层 `kit/KIT-FILES.json` 覆盖两个子 kit 和所有本轮输入。

固定旧/新 Desktop 分别0.2.0-rc.2/639ed015397290b3745d163aafe02ffee4aa3f84、0.2.1-rc.2/687f282e8625c6b8d11ff58211a90524be2e4317。不采用新rc.3，不重装或升级。系统任务 Node24.19.0；Electron 自带 Node 如实记录不替换；SDK0.2.0。

先执行 WINDOWS-TASK.md。先用原 -30 做 W-LIFE 预检和至多一次正常登录；若受阻直接保留。退出任务 Desktop 后按 PROFILE-COPY.md 复制现有任务 home，安装 -31，再 W-UI：A 受影响项，B 只做受影响 Escape/Tab/文案快查。不要原地升降包或重跑旧矩阵。

原 kit 的历史 HANDOFF/FOLLOWUP、argv/B1/web 工具仅存档；当前范围以根任务和 W-* 为准。所有结果写 kit 外；Windows 无任何推送/CI 授权。正式0.2.0及既有数据/配置不变。

本地开发预验收：`ciRun=null`、`formalAcceptanceEligible=false`。617pass/1Windows skip（两基线各自）、3项实际打包客户端检查和4组原-30受控生命周期证据均来自 Mac 控制环境；不替代 Windows/真实 Job/模型/最终 CI 验收。
