# 进程记录状态说明（复核补证，2026-10-07 晚）

按复核清单第 3 项如实收窄；不事后补造。

## 已归档 pid 原件（8 个，含 creationTicks）

| 文件 | 进程 | 停止核验 |
|---|---|---|
| r1-desktop-host.pid | 4384（desktop Host） | r1-desktop-finish.txt：exe 路径+ticks 匹配后停止，原生输出已归档 |
| r1-npm-host.pid | 19648（npm listener node） | r1-npm-finish.txt：node+cmdline+ticks+18267 归属匹配后停止，原生输出已归档 |
| n1-desktop-host.pid | 22756 | 停止为内联命令（exe 路径核对），原生输出未归档 → insufficient-evidence |
| n1-desktop-host2.pid | 21048 | 同上 |
| n1-desktop-host3.pid | 2952 | dn1-fix/dn2 脚本内 exe 核对停止，脚本原件在档（step-ar-dn1-fix.ps1/step-ar-dn2.ps1），运行输出未归档 → 脚本可证、输出 insufficient-evidence |
| n2f-desktop-host.pid | 21268 | dn2r2 脚本内 exe 核对停止（脚本在档），输出未归档 → 同上 |
| n2r-desktop-host.pid | 11000 | 内联 exe 核对停止 + patch 字节还原 exact=True（会话记录），原生输出未归档 → insufficient-evidence |
| n45-npm-host.pid | 7792（N4/N5 Host，listener 18269） | 操作者内联身份核对（node.exe+diag6-tools cmdline+18269 归属）后停止；**原生停止输出未归档 → insufficient-evidence**；当前态见 n45-post-residual-check.json |

## npm 子进程 pid 原件

- N1/N2 各 run-case 轮的 `W1-npm.pid` / `W1-npm.children.pid` 记录于测试 root
  `evidence/`，随后被 cleanup.ps1 按设计消费；**副本未及时归档、原件已被消费**，
  无法提交 → "npm 子进程 pid 原件全程在档"的说法收窄为：launcher/listener pid 文件
  在档（上表），子进程 pid 原件缺失（cleanup 消费，未补造）。

## N3 命令与退出码

- 实际命令：probe prepare/probe 两条 node 命令行以脚本原件存档
  （step-ar-n3.sh 副本随本次提交入库，含精确 argv 与 work 目录拼接）。
- 退出码：prepare exit=0、probe exit=0 为操作者会话记录（bash echo 输出），
  **未以独立原生命令输出文件归档 → 该两行退出码按会话记录引用，native 存档
  insufficient-evidence**。JSONL 本身（native-output-runtime.jsonl）与 prepare
  JSON（probe-prepare-native.json）为原生在档原件。
