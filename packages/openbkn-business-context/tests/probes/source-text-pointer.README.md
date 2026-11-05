# 原文弹层真实指针回归

此显式 probe 用真实 Chromium 渲染完整生产 `ProvenanceOverlay` / 平台式 Scene，使用已有脱敏 fixture 和20段静态长回答构造弹层覆盖触发器的布局。运输层为本地内存替身；任何非本次 loopback 服务的页面请求都会被拒绝并导致验证失败。不会打开 DSH、日常浏览器 profile，或调用平台/模型。

它补充 JSDOM 的事件/焦点测试，不代表 Windows 原生宿主或发布包验收。主矩阵为输入/输出各三种序列：纯 hover、hover 后真实坐标点击、Tab+Enter/Space。扩展边界验证离开组合区后重入、显式点击/键盘重新激活、中性指针的键盘关闭后第一次 hover、父层关闭与卸载重开，以及 popup padding 仍覆盖底下 trigger 时的 Escape。padding 无实际重叠时明确记录 `SKIP`，整体为 `PARTIAL_PADDING_SKIPPED`，不计 padding PASS，也不改布局强造。

前提：仓库依赖已安装、符合仓库要求的 Node、独立的 `playwright-core` 安装和已安装 Chromium。无需改仓库 package/lock，例如：

```sh
npm install --prefix /private/tmp/openbkn-source-text-pointer-deps --no-audit --no-fund --ignore-scripts playwright-core@1.58.2
SOURCE_TEXT_PLAYWRIGHT_PATH=/private/tmp/openbkn-source-text-pointer-deps/node_modules/playwright-core/index.mjs \
SOURCE_TEXT_BROWSER_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' \
SOURCE_TEXT_POINTER_OUTPUT=release/source-text-pointer-after \
node packages/openbkn-business-context/tests/probes/source-text-pointer.probe.mjs
```

Node 的 PATH 由调用者选择，不改全局配置。其他系统需使用对应 Chromium 可执行文件路径。默认视口1920×800；可用 `SOURCE_TEXT_VIEWPORT_WIDTH` / `SOURCE_TEXT_VIEWPORT_HEIGHT` 指定。默认断言输出 popup 确实覆盖旧触发坐标；布局不满足时不能记作覆盖通过。

`RESULTS.json` 记录真实 DOM 命中、事件目标/relatedTarget、自然焦点、矩形及沿祖先计算的可见性，采样0/150/500/1500ms。动画期 DOM 节点存在不等于可见；断言关闭跨越500/1500ms后仍保持。静态 fixture 允许公开报告，无凭据或真实业务正文。

输出重叠点击和输入/输出键盘三条 owned-Escape 路径必须先确认层可见且确已发送 Escape，不能通过提前关闭来跳过验证。嵌套的第一次 Escape 同时断言父详情保留，随后第二次才关闭父层；全部主例及扩展快照的 transport calls 都检查没有生成/分析调用。只有这些断言通过且 padding 实际可执行，才记录 `validationStatus: PASS`。

可加 `--record-baseline` 只记录旧行为，不执行修复后断言。`SOURCE_TEXT_BASELINE_COMMIT=<hex>` 仅将 `BusinessProvenanceScene.tsx` 通过打包插件冻结到指定 Git 版本，其他模块仍来自当前工作树；不是完整旧候选包回放。只有确认其余相关模块未变时，才用它作该文件修前比较。输出含实际 Scene SHA-256。每次使用不同输出目录保留失败原件。

仅定位 padding 回归时可加 `--padding-only`，不重跑其余序列；正式本地回归使用默认完整矩阵。
