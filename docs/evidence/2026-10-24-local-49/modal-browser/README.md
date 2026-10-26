# 原始浏览器探针输入

这些是release/local-49/modal-browser下实际运行的原始输入副本，用于审阅。相对import按原任务目录布局；真实执行用主仓库release/local-49/build-modal-browser.cjs及modal-server.cjs。React effect/ref seam只驱动已固定的Hook，DOM事件是真实浏览器，不是完整React/DSH运行。旧版先关闭原生父层再关闭插件层；修正仅关闭插件层。最终另测Tab/Shift-Tab回绕及Shift-Escape保留。未改原-30。
