# CI 异步就绪等待修复

2026-11-02。仅修改 `tests/provenance-native-dialogs.test.ts` 与 `tests/provenance-fullscreen-escape.test.ts`；产品源码、平台/模型原文、包、依赖与 pin 均未改。没有跳过、重试测试或删减业务、Escape、Tab、焦点及无分析/生成调用断言。

## 失败依据与复现

build-only CI [41400870217](https://github.com/openbkn-ai/bkn-dsh/actions/runs/41400870217)，提交 `a7ab632`，Ubuntu / Node 22.19.0：770 项中 767 通过、2 失败、1 Windows 项跳过，总耗时 150948ms。两个文件的首项分别在 `evidenceReady()` / `ready()` 等待“本轮业务执行过程”时于约 1198/1209ms 失败，后续同类测试通过。尚未执行到对应键盘/焦点断言。公开[安全节选](./ci-failed-41400870217.safe.log)只保留失败名、耗时、错误文本和汇总；完整日志与 DOM 留在 ignored 的 `release/provenance-live-20261102/` 中。

本地在两文件首项的 mock conversation 读取中各引入一次 **1200ms** 延迟，保持原始默认等待，得到相同 heading 未就绪错误：

- [native 修前](./native-before.log)：Node 24.19.0，选中首项，约 1034ms 失败。
- [fullscreen 修前](./fullscreen-before.log)：本机默认 Node 23.11.0，两项中首项约 1038ms 失败、legacy 后项通过。

这证明默认 1 秒等待不足以容纳这条合法异步初始化路径；可控延迟复现了相同边界，不能当作已经完整重现 Ubuntu 的 CPU/调度条件。没有在共享本机额外施加 CPU 压力。

## 最小修复与验证

`ready()` 和 `evidenceReady()` 对原来的 heading / 分析按钮可用 / 全屏入口就绪条件显式指定 **10000ms 上限**。等待仍在条件满足时立即结束，没有加入“睡够固定时间再断言”的就绪实现，也没有全局延长测试配置。两个首项保留 1200ms 模拟延迟，持续覆盖旧 1 秒窗口之外的初始化路径。

本机未预装 Node 22，故将官方 `node-v22.19.0-darwin-arm64.tar.gz` 解压到临时目录，通过同一官方 `SHASUMS256.txt` 校验 SHA-256 `c59006db713c770d6ec63ae16cb3edc11f49ee093b5c415d667bb4f436c6526d`；没有全局安装或改变项目 Node/pnpm 配置。以该 Node 和前置 PATH 分别执行：

```sh
node --import tsx --test --test-reporter=tap tests/provenance-native-dialogs.test.ts
node --import tsx --test --test-reporter=tap tests/provenance-fullscreen-escape.test.ts
```

结果：[native 8/8](./native-after-node22.log)、[fullscreen 2/2](./fullscreen-after.log)，均无失败、无跳过；两项慢初始化和全部既有断言通过。`git diff --check` 通过。此次仅完成受影响测试的本地验证；Ubuntu 全套 CI 是否通过，由后续新提交的新 CI 结果决定，不以本地通过代填。
