# Desktop F8：实际绑定后的管理器卸载/重装

在 F7 真实工作区/会话绑定后，从原生插件管理器卸载整个插件，确认条目与侧栏入口消失；在中间不重写配置的窗口立即采集 `immediate-after-uninstall.json`。随后通过“添加插件”安装同一固定 CI tgz、启用，三条目 v-8 恢复运行，实际面板列网 2 与既有工作区关联恢复。

`before.json` → `immediate-after-uninstall.json` → `reinstalled-enabled.json` 的七个选定用户文件（profile patch、工作区索引、工作区绑定、CLI token store/version/state、会话绑定）字节/哈希全部一致，见 `preservation-check.json`。这里只记录敏感 store 的路径/哈希，未归档内容。自动生成 cordis.yml 单列，不算用户文件哈希不变承诺；未覆盖整个 home 或全部历史会话。

最终两个形态 66/66 包内容核验见 `../../mac-processes/final-installed-identities.json`。此前无绑定的第一轮 Desktop F8 原件保留，不能将本轮绑定证明追溯到前一轮；官方 CLI 对 Desktop 重装的拒绝原件也保留，最终重装走实际产品管理器。
