# -4 发布执行记录

日期：2026-10-05，Asia/Taipei。用户本轮“OK，执行”授权按发布剩余清单继续；已接受的登录等待限制保持 CHANGELOG 原文，不包含新的包内修复。

## 已完成

- [PR #60](https://github.com/openbkn-ai/bkn-dsh/pull/60) 已 squash 合并。main／发布提交：`a134f5d573e11846bb6665d1c170510149d09d4d`，合并时间 `2026-10-05T00:57:37Z`。
- [main 不发布彩排 run 37249521277](https://github.com/openbkn-ai/bkn-dsh/actions/runs/37249521277) 成功，`publish=false`，ubuntu-latest，构建／测试 Node 22.19.0、pnpm 11.7.0。插件 258 项中 257 pass、1 Windows-only skip、0 fail；仓库／兼容／runtime 57/57；package:check 成功，12 个 exports/main/types 目标均在包内。
- main tgz 对照 run 37202050194 的已验收候选：52 文件、无增删、逐字节相同；压缩包也完全相同，133,806 字节，SHA-256 `c4a8effbe5f84ecb399ee45ddf705c9468ef311910dcf58f62e47a0c71687a02`，tree-hash `f4e90f96d5c82e8b8c8cc505847995c6d3624f9870c58a71d7a3d010f3a5c5ad`。
- 打包后复核版本不存在于 registry；main 仍为核验提交；候选接受之后包内 src/README/package.json、runtime manifest、依赖／锁文件无差异。
- 已创建并推送 annotated tag `v0.2.0-rc.2-openbkn.0.2.0-4`，指向已核验提交。发布 [run 37249979001](https://github.com/openbkn-ai/bkn-dsh/actions/runs/37249979001) 已完成。
- 发布前上游复核：DSH master `5badb15009ae1756c3afe0ae0cef1faafc290ccc`、OpenBKN main `ff9b33adf47d29d5e8fc9380e1e4c84c74d6a49a` 与本轮发布审查基线一致。支持／验收宿主仍 DSH 0.2.0-rc.2，OpenBKN 平台与 CLI 0.1.5；最新可用上游并不等于本次测试版本。本轮未升级或部署。

## 发布后核验

- [发布 run 37249979001](https://github.com/openbkn-ai/bkn-dsh/actions/runs/37249979001) 的 build/test/publish 与 GitHub Release 两个 job 均成功；tag 构建 artifact 也与已验收候选完全相同。工作流使用 Node 24.19.0／npm 12.0.2 做 OIDC 发布，并记录 provenance 写入透明日志。
- npm 发布时间 `2026-10-05T01:13:12.627Z`；registry dist-tag 当前 **rc=-4、latest=-3**。npm tarball：133,341 字节、52 文件；SHA-256 `53ce847b8d884ba7f1cb43048b5e60380c0c297142671a2b9d0abbea9692a013`；tree-hash `cea1c64149ca947503be79db24b0929edd823466bbe35fa4960aa36dc00e79ff`。已校验实际下载内容的 SHA-512 integrity 和 SHA-1 与 registry 一致。
- 发布包对候选：无增删，仅 package.json 键顺序／格式改变，解析后的内容相同；其余 51 文件逐字节一致。这是 CLAUDE.md 允许的发布改写，不产生新候选或重复原形态验收。
- [GitHub Release](https://github.com/openbkn-ai/bkn-dsh/releases/tag/v0.2.0-rc.2-openbkn.0.2.0-4) 的 tgz 与 npm tarball 全字节相同，配套 .sha256 文件正确；Release notes 与该提交的生成器输出相同，包含用户接受的已知限制。
- registry 提供 SLSA v1 provenance attestation；声明中的 subject SHA-512 与下载 tarball 一致，workflow/tag/源提交/invocationId 分别指向 release-plugin.yml、-4 tag、a134f5d 与 run 37249979001。此项核验声明内容与 CI 记录，不声称本地另做了密码学签名验证。
- GitHub Release 被工作流标记为 GitHub latest；这与 npm latest 独立，后者本轮没有移动。

机器可读结果见 [发布核验记录](2026-10-05-rc4-publish-verification.json)。比较工具见 [tarball 比较脚本](2026-10-05-rc4-compare-tarballs.py)；工具不解包到磁盘，拒绝重复／非普通文件条目，按路径集与 SHA-256 检查 52 文件，published 模式只允许 package.json 的 JSON 等价改写。

可复核命令（候选与发布资产下载到独立空目录）：

```bash
gh run download 37202050194 --name plugin-tarball --dir <candidate-dir>
gh run download 37249521277 --name plugin-tarball --dir <main-dir>
gh run download 37249979001 --name plugin-tarball --dir <tag-dir>
gh release download v0.2.0-rc.2-openbkn.0.2.0-4 --repo openbkn-ai/bkn-dsh --pattern '*.tgz' --pattern '*.sha256' --dir <github-dir>
python3 docs/evidence/2026-10-05-rc4-compare-tarballs.py <candidate-tgz> <main-tgz>
python3 docs/evidence/2026-10-05-rc4-compare-tarballs.py <candidate-tgz> <tag-tgz>
python3 docs/evidence/2026-10-05-rc4-compare-tarballs.py <candidate-tgz> <published-tgz> --package-json-key-order
python3 docs/evidence/2026-10-05-rc4-compare-tarballs.py <npm-tgz> <github-tgz>
```

这里的 `<…>` 是要替换的实际路径，不是可直接原样执行的 shell 字符。npm tarball 和 attestation 的实际 URL、摘要与构建标识在 JSON 记录内。

## 后续

Windows C3 安装行为任务位于 `../handoff/2026-10-05-windows-rc4-c3-install.md`；需要真实 Windows 回传，不能由 macOS 的命令／脚本检查代替。C3 前保持 npm latest=-3；收到并核对后最后移动 latest。既有候选形态验收不因发布包与候选内容一致而重跑。

本轮没有改用户原 checkout 的 CLAUDE.md／AGENTS.md 或原用户 profile。受保护的旧 release 分支删除仍交维护者，不阻塞 tag 与 rc 发布。
