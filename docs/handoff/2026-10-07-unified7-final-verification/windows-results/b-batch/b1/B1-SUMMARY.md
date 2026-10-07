# B1 真实登录两形态结果（2026-10-07 晚）

## desktop（unified7-fidelity-desktop）

- **登录方式**：产品内 OpenBKN 面板 → "使用 OpenBKN CLI 登录并同步" → CLI 设备授权流
  （client_id=openbkn-sdk，https://192.168.50.28，NODE_EXTRA_CA_CERTS=kit CA）→ 用户在默认
  浏览器完成授权（/device/success）→ 面板自动进入已登录态。
- **凭据落点**：隔离 root `bkn-config\platforms\<base64(https://192.168.50.28)>\users\<uuid>\token.json`
  （sha256 前16=4C66A756CA8EEA08）+ state.json/version-check.json；未触碰日常 ~/.dsh。
- **列网**：找到 2 个网络——supply_ontology_hand（供应链本体知识网络-手工版）、
  worldcup_vega_catalog_bkn（Fjelstul 世界杯·Vega Catalog 绑定（占位符））。
- **绑定**：supply_ontology_hand → 新建工作区（原生目录对话框选
  `C:\bkn-verify\unified7-fidelity-desktop\workspace-supply`）；侧栏出现 workspace-supply，
  会话区出现 "OpenBKN business session entry / 了解「供应链本体知识网络-手工版」知识网络"。
- **刷新（重开面板重取）**：supply_ontology_hand 显示
  "已关联工作区 · C:\bkn-verify\unified7-fidelity-desktop\workspace-supply" 且排列首位
  （"已关联本地工作区的网络优先显示"生效）；worldcup 仍为尚未关联。
- 证据：b1-desktop-logged-in-axtree.txt/.png、b1-desktop-bound-axtree.txt/.png、
  b1-desktop-refresh-axtree.txt/.png；Host pid 2256（B1-desktop-host.pid）。

## npm（unified7-fidelity-npm，dsh web 0.2.0-rc.2 @18267）

- **登录方式**：按交接允许的"已有授权的隔离配置复用"——将 desktop root 的 bkn-config
  （隔离 store，token.json sha256 前16=4C66A756CA8EEA08，与 desktop 同哈希）复制到 npm root；
  run-case W1 全新启动 Host（launcher cmd 13228 / node 20900 @18267，pid 原件
  b1-npm-093822-W1-npm*.pid.txt；原生输出 *>&1 采集 b1-npm-093822-runcase-W1-native.txt）。
  未借用任何日常凭据（~/.dsh 的 desktop/work profile 未参与）。
- **列网**：找到 2 个网络（同 desktop）。首开面板快照 b1-npm-webui-openbkn-panel-snapshot.txt。
- **绑定**：supply_ontology_hand → 新建工作区（Host 派生 node 22108 的原生目录对话框选
  `C:\bkn-verify\unified7-fidelity-npm\workspace-supply`）；侧栏出现 workspace-supply 并自动切换。
- **刷新（重开面板重取）**："已关联工作区 · C:\bkn-verify\unified7-fidelity-npm\workspace-supply"，
  排列首位；worldcup 仍为尚未关联。快照 b1-npm-webui-refresh-snapshot.txt。
- 过程附带：web UI 首启出现预览版说明与"添加 API Key"向导，均以产品 UI 正常跳过（稍后配置）。

## 判定

B1 desktop：pass；B1 npm：pass（登录/列网/绑定/刷新四要素齐备，产品 UI 原生流）。
限制：npm 复用的是同一用户在 desktop 形态完成的设备授权 token（交接明示允许），非独立第二账号；
worldcup_vega_catalog_bkn 为占位网络，未用作第二授权网络（B4 若需第二网络另行评估）。
