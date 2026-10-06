# 统一 -7：发布决定前补测

日期：2026-10-07，Asia/Taipei。用户已授权本交接提交远端和 Mac 补测；发布、tag、npm dist-tag 仍待用户确认。

- Windows 执行入口：[WINDOWS-HANDOFF.md](WINDOWS-HANDOFF.md)。先做无需账号的 A 批，再在凭据可用时做 B 批。填写 [WINDOWS-RESULTS.template.md](WINDOWS-RESULTS.template.md)。
- Mac 主开发任务及结果：[MAC-TODO.md](MAC-TODO.md)、[RESULTS](../../evidence/unified7-final-verification-20261007/RESULTS.md)。可执行项已测，M3原生交付与M5事实失败；M9混合网络图仍未验证。**暂不建议发布。**
- 完成后剩余内容及暂不处理理由：[REMAINING-DECISIONS.md](REMAINING-DECISIONS.md)，供用户逐项决定。
- 不重新打包：本轮固定版本 `0.2.0-rc.2-openbkn.0.2.0-7`，tgz SHA `6bbab27876e743032572ddce107fcce09e0d681f87bee19fba8d78180e5a63a8`，177442 bytes、66 文件。
- 包源码 `3414bdec3c956cc0d580aebd959ac6f3439bb352`，原验收 CI `37478119730`；主线 `870e26958bde734f64c5af046f9bab134e3512e1` 彩排 `37500800409` 已通过，与实测 tgz 整包逐字节相同。
- Windows 既有证据固定在 `9fb3896b979eff8fdebc1283ecb6316e0a888953`。此次补测新增文件，原报告不覆写，缺失历史记录不事后补造。

本轮结果必须分开记录：实际产品 UI/导出、实际 RPC/工具执行、独立查询、fixture、文件哈希和操作观察。`not-run`、`insufficient-evidence` 不计作通过。

固定kit内manifest保持交付时点的不可变身份；当前验收状态另记 [current-acceptance-manifest.json](../../evidence/unified7-final-verification-20261007/current-acceptance-manifest.json)。不要通过修改kit破坏已核验SHA。Windows可以补固定包的A批证据；B5若复现Mac新增失败，保留原件并回报，不改包来获得通过。
