# 固定输入：鉴权恢复与原生回答边界 -7

执行 `HANDOFF.md`，回传 `RESULTS.template.md`。固定包及 65 个文件 SHA 已随 kit 提供；验证入口为 `verify-kit.ps1`。kit ZIP 获取/SHA 见交接根 `WINDOWS-NOTICE.md`。

- source: `c91fe090e0aac2dc72a4ff1b3d221d72baa432ba`（PR #76 最终 head 批准后合入 main）
- CI: [37570295456](https://github.com/openbkn-ai/bkn-dsh/actions/runs/37570295456)，build-only，publish=false
- tgz SHA: `fa168d8113e8dd43348ea4751c7e4d297049e2c1ddced9c586e6d3a1f3f0718c`，165804 bytes，65 files

插件负责接入、认证、作用域、Interaction、诊断和溯源。平台负责业务语义/计算，模型负责自然语言回答；不新增插件终答裁决、自动纠错、固定业务报表或重复计算。独立评测保留，`completed` 不代表事实正确。旧 66 文件包和六项纠错探针不再作为本轮输入。

本 kit helper 的旧原生证据不能接受本轮的新输入；新 verifier、65 文件安装、8 项探针及真实 UI 需 Windows 实测。全部未授权真实登录/模型/受限账号项照实 not-run。该交接不授予发布权限。

Mac 的本候选实测见交接根 README：401 → 产品 CLI 正常授权 → 同 Host 恢复、无 CA 的 TLS 分类和恢复原配置健康轮均通过。前一原生输出候选的五题结果单列；两项事实质量失败未宣布修复。先执行 R1 与 N0–N3/N6，再做有本人隔离凭据/模型的 N4/N5 和 E1 历史补正。
