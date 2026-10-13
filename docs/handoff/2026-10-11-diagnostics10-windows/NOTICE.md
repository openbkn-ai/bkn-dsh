# Windows -10 复测通知

固定 handoff 提交：`e1819acf00f1684a00cb5ab79f20490927fa36a9`。源码/候选身份另见 HANDOFF，不以这份文档提交替换构建源码身份。

```powershell
git fetch origin feat/diagnostics-info-10
git checkout e1819acf00f1684a00cb5ab79f20490927fa36a9
```

入口：`docs/handoff/2026-10-11-diagnostics10-windows/HANDOFF.md`。先执行两形态展示 A0–A4；B1 在独立隔离授权可用时按同 Host 长时条件复现，无根因证据不修。回传独立结果分支，不推进 main，不发布。

CI 38106903958，源码 4daccf6b794ee7e9d55b9c7a45f29f5403c6d2a0；tgz SHA-256 b2d90c19d19bd473de38f519b9a4abb4b8a25c8468cd80195fefb7641e3bcdeb，184146 bytes，70 文件。

Mac 两形态展示/坏导入隔离/产品导出已验证；短时 CLI/MCP 原生边界未复现 B1，不声称修复。Windows 原生 PowerShell verifier 仍需执行，沿用 -9 helper 的身份保护；EPERM、DSH/平台事项和其他 P2/P3 不在本次任务。
