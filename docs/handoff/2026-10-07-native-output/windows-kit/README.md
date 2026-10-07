# 固定输入：原生回答边界 -7

执行 `HANDOFF.md`，回传 `RESULTS.template.md`。固定包及 65 个文件 SHA 已随 kit 提供；验证入口为 `verify-kit.ps1`。kit ZIP 获取/SHA 见交接根 `WINDOWS-NOTICE.md`。

- source: `2813f3ad3e175d94ee747a796f638cc8d1f3e712`（PR #74 批准后合入 main）
- CI: [37562531405](https://github.com/openbkn-ai/bkn-dsh/actions/runs/37562531405)，build-only，publish=false
- tgz SHA: `3c345ef643589fbf79f4958598d4345544c632feac2a3b4f859403db1125b8f0`，165176 bytes，65 files

插件负责接入、认证、作用域、Interaction、诊断和溯源。平台负责业务语义/计算，模型负责自然语言回答；不新增插件终答裁决、自动纠错、固定业务报表或重复计算。独立评测保留，`completed` 不代表事实正确。旧 66 文件包和六项纠错探针不再作为本轮输入。

本 kit helper 的旧原生证据不能接受本轮的新输入；新 verifier、65 文件安装、8 项探针及真实 UI 需 Windows 实测。全部未授权真实登录/模型/受限账号项照实 not-run。该交接不授予发布权限。
