# SourceText 修复的上游只读核对

2026-11-03，由只读评审子智能体通过 GitHub Git/Contents/Compare API 查询。未fetch、切换checkout、升级pin或请求实际平台。远端源码身份与运行中部署身份分开；本次不扩大兼容范围。

| 来源 | 本次身份与变化 |
| --- | --- |
| Studio release/0.2.0 | 仍为 `90d3b92a909a3b98ad3e74b78b08ecf4fbdc3535`，Scene blob `5db193c8b16a76364bf5014cc2e624160f48111b` |
| Studio main | 从 `31b33b2c12ee13eb02de181604cab838be90d32b` 到 `6e64f2c1c2c64fb4da56d3b13e43cb842f79f9c5`，compare ahead9；Scene blob仍 `eb286d7b6fec6f5a7585fc6ae0caa5c06e01fe3c` |
| Foundry release/0.2.0 | 仍为 `81d5752826f3b3f3f72f3ad4cb1e22d45e99ab4b`，GitHub Latest仍v0.2.0 |
| Foundry main | 从 `cf98755f7a0953ba436936c07724e4b2a5bdd193` 到 `78011f5919fa65610f7960b21fa40dd35a4bae61`，compare ahead14 |
| DSH官方rc.5 | tag仍为 `dsh-v0.2.1-rc.5` / `b830ec950faba0a46dda564be3e2d854afed94f1`；最近发布列表首项仍为该prerelease，releases/latest返回404，不补造正式Latest |
| DSH master | `ce7073d51254c26cd63b22a60835b8f948deb447`，不作为本次实机验收宿主 |

[Studio release Scene](https://github.com/openbkn-ai/bkn-studio/blob/90d3b92a909a3b98ad3e74b78b08ecf4fbdc3535/src/modules/bkn-trace/business-provenance/BusinessProvenanceScene.tsx)及[本轮compare](https://github.com/openbkn-ai/bkn-studio/compare/31b33b2c12ee13eb02de181604cab838be90d32b...6e64f2c1c2c64fb4da56d3b13e43cb842f79f9c5)：选定business-provenance/evidence-chain/MarkdownText没有本轮新增变化。SourceText仍为基础Antd hover/click，没有可直接移植的局部Escape修复，也没有DSH父modal；这不证明平台现场同序列行为。

DSH完整recursive tree未截断，选定Contents对照显示Modal.tsx两端同为 `e7fa7faa2eb40ec86d4f9ea4c0cf1d6fc4fe020d`；ui-slots renderer/store两端分别同为 `e6ed27a9ef037381cee4811f2e9b0cfb1a7043ec` / `907762b7b48673b4b95588d28a8983b8e882817b`。useModalLayer blob从rc.5的 `dff4a226972b117e7fa5aa2a7c6a70b8249410ff` 变为master的 `2942c992f077bbcdacce058ffa62baf0d0450106`，差异涉及保留dialog的焦点恢复。插件此处使用自己的useDialogFocus/useOwnedLayerFocus，不将其当作现场根因或升级理由。见[rc.5 useModalLayer](https://github.com/deepseek-ai/deepseek-harness/blob/b830ec950faba0a46dda564be3e2d854afed94f1/packages/client/ui-primitives/src/useModalLayer.ts)、[master useModalLayer](https://github.com/deepseek-ai/deepseek-harness/blob/ce7073d51254c26cd63b22a60835b8f948deb447/packages/client/ui-primitives/src/useModalLayer.ts)、[release元数据](https://api.github.com/repos/deepseek-ai/deepseek-harness/releases?per_page=4)。大compare包含2508commits，不能用有限compare文件列表证明全仓无变化。

[Foundry本轮compare](https://github.com/openbkn-ai/bkn-foundry/compare/cf98755f7a0953ba436936c07724e4b2a5bdd193...78011f5919fa65610f7960b21fa40dd35a4bae61)：选定evidencesvc/summary.go变化为读取增加SummaryOnly；未发布main的query_metric schema新增is_approximate并更新cursor快照说明，不能称上游工具合同整体不变。本次只改客户端弹层，不迁移未发布合同，不改变Host/网络/权限守卫，不扩大平台兼容声明。真实部署、live tools/list和原生加载身份本轮未重新采样，仍沿用原回执的证据及UNKNOWN。
