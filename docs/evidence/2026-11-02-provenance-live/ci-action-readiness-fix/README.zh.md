# CI 解释生成按钮就绪竞态修复

2026-11-02。仅修改 `src/client/platform-provenance/scene-list-boundaries.test.ts`，不修改生产代码、其他测试、包、依赖或 pin。

## 失败与受控复现

CI [41403246674](https://github.com/openbkn-ai/bkn-dsh/actions/runs/41403246674)，`f330eff`，Ubuntu / Node 22.19.0：809 项中 807 通过、1 失败、1 Windows 项跳过。前轮两个 heading 就绪用例均已通过；本轮仅 `same-interaction search metadata preserves the mounted evidence view and in-flight generation` 在等待 generate 调用数等于 1 时得到 0。见[安全 CI 节选](./ci-failed-41403246674.safe.log)，完整私有日志与 DOM 未公开。

源码原因：`CurrentExplanationPanel` 初始 `busy=true`，读取已有解释时“查看证据链”按钮已经存在但 `disabled=true`；只有解释读取的 finally 才解除 busy。原测试只等待 `findByRole` 找到按钮就点击，没有等待按钮可用。对禁用按钮的点击会被忽略，之后单纯延长“generate=1”的等待也不会补出一次点击。

修前用 deferred promise 固定暂停初始解释 GET，确认按钮禁用、点击没有 generate 调用，再释放 GET，保留原来的调用数断言。官方 Node 22.19.0 本地稳定得到同一 `0 !== 1`：[修前日志](./scene-before-node22.log)，退出码 1。这个复现不依赖固定睡眠、CPU 负载或猜测调度时长。

## 修复及边界

首项持续保留暂停 GET 的负向路径：禁用时点击不分发；GET 完成也不自动排队生成。随后明确等待该按钮 `disabled=false`，执行一次有效点击，再继续原有全部生成、同 Interaction 搜索、详情保持挂载、detail 读取次数不增加、生成信号不取消及原始结果展示断言。未增加全局或局部 timeout，未跳过、重试测试或修改产品行为。

只读审查同批其他动作测试：

- `provenance-parity-render.test.ts` 两处生成点击均先等 `!busy && status=not_generated` 才出现的空解释提示，已具备就绪屏障。
- 场景分页测试及分析相关 DOM 测试先等“交给 BKN Agent 分析”可用；该条件与“开始分析”共用当前 Markdown 就绪状态，打开侧栏不发起新的 Markdown 读取。
- 复制测试先等待复制按钮可用；下载按钮共用同一 Markdown/loading 条件。原文预览与图谱/全屏控制没有类似解释 GET 的异步禁用条件。

未发现需要扩大修改的同类具体遗漏；不因本次失败批量延长其他等待或修改已通过断言。

## 验证

使用已校验的官方 Node 22.19.0 临时可执行文件，前置同目录 PATH，在插件目录执行：

```sh
node --import tsx --test --test-reporter=tap src/client/platform-provenance/scene-list-boundaries.test.ts
```

修后结果见[日志](./scene-after-node22.log)：两项通过，无跳过。`git diff --check` 通过。此为受影响测试的受控验证；Ubuntu 整套 CI 仍需由后续新提交的运行确认。
