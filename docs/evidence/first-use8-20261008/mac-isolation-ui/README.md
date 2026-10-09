# S2/S4 的 Chrome 产品界面补验

同一固定 -8 基包与 `mac-isolation-api/variants.json` 的单文件故障变体。使用官方 npm Host、独立 root，重新按标准启动 URL 打开 Chrome，未注入浏览器脚本或改源码。两轮自有进程 88522/89745 已按 creation/argv/listener 身份停止。

- S2：OpenBKN 面板实际可打开，点击诊断得到报告 `98b95ece`；bootstrap/diagnostics 通过，business 为 `module-resolution-failed`。点击下载没有取得 Chrome 文件，未把 API 导出算作下载。
- S4：诊断页面明确显示服务不可用，无导出按钮。初始空地址时业务仍待设置；配置服务与失败的诊断 owner 一并不可用，这不等于正常首次配置表单可用。为核对已配置业务回退，仅向隔离原生 patch 添加合法地址及 CLI 0.1.5 路径；独立 CLI store 仍空，不复制 Token。业务面板实际显示“使用 OpenBKN CLI 登录并同步”，配置 API 失败不阻断健康业务条目的登录入口。未在此故障 root 登录平台或进行模型问答，不宣称完整业务链通过。测试 patch 随后精确还原。

`s2/s4-ui-observation.json` 记录实际观察，`s4-ui-configured-precondition.json` 记录前提写入方法与 patch 哈希，`s4-configured-inventory.json` 为配置后的真实 Host inventory。原 API 轮历史证据保持独立，不追溯改写为 UI 验收。
