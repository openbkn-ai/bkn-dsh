# G6 评分器与 guard-probe 测试记录（Windows 原生，2026-10-06）

ProbeRoot: C:\bkn-verify\diag6-npm\probe-root（本轮 TestRoot 下；js-yaml@4.3.2 + @deepseek-ai/dsh@0.2.0-rc.2 隔离安装）

## 评分器自测 `node --test eval/run-eval.test.mjs` — 3/3 通过
- ✔ unavailable permission account is excluded and reported separately
- ✔ not-run does not hide observed failures
- ✔ an entirely untested run cannot be reported as successes
（exit 0，duration ~320ms）

## guard-probe CLI 测试 `node --test tests/guard-probe-cli.test.mjs` — 4/4 通过
- ✔ malformed live invocation exits before importing the plugin or taking credentials
- ✔ valid live options retain explicit mode, networks and paths with spaces
- ✔ CLI failures never expose captured credential-like stdout or stderr
- ✔ Windows CLI lookup runs a PATH .cmd and a shim in a path containing spaces and &
（exit 0，duration ~654ms）

## 真实 G6 / live guard — not-run（未伪造）
- 真实模型 G6 问答：需真实平台登录与模型，本机隔离 store 无凭据 → not-run；未生成 g6-marks.json（不得预填）
- guard-runtime.probe.mjs --live：需有效登录 + 两个真实网络 ID → not-run
- Windows 结果不继承 macOS G6 7/10（MAC-ACCEPTANCE.md）
