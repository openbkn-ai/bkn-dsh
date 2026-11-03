# 当前 MCP 目录与旧基线信息缺口

2026-11-03。Windows本轮只读完成25项当前工具目录及schema采集，分页结束，零tools/call/模型。最终[原件与无损完整目录已核收](./windows-rc5/ci5-anchor-session-audit/INTAKE-REVIEW.zh.md)；本说明同时记录主会话独立固定源码旁证，不将源码投影或历史环境冒充此次live采集。

## 三处差异的判断

旧正式基线来自Foundry `v0.2.0 / 81d5752826f3b3f3f72f3ad4cb1e22d45e99ab4b`，由[提取脚本](../../../scripts/capture-context-loader020.py)生成[正式source投影](../../../packages/openbkn-business-context/tests/fixtures/context-loader-tools-v0.2.0-release.json)。来源独立于插件allowlist，但递归删除`description/title/examples/$comment`会连同同名数据属性一起丢失，不能视为完整无损schema或历史live字节。

Windows差异与以下固定正式源码指针相符；三个字段在原正式源码已存在，均为可选字符串输出字段，不是当前平台新增必需输入。

| 工具 | 正式源码output_schema JSON Pointer | 源文件SHA-256 |
| --- | --- | --- |
| list_knowledge_networks | /properties/entries/items/properties/description | 7b755b50573f6f905d60acdda318bc19ec4c0e5df705e177ea1bf40603da8389 |
| list_skills | /properties/entries/items/properties/description | af24edc5eff681471c10e0f4f1d3248b04a3d4f1e8a6b17e1036459f2f510040 |
| search_capabilities | /properties/capabilities/items/properties/description | 14d5efd9e54260e3f42b495b97e0596a5b62d2d6a5da3c864bd19d3350acbc22 |

文件均在固定ref的`adp/context-loader/agent-retrieval/server/driveradapters/mcp/schemas/`，名称为工具名加`.json`。主会话只读子智能体已用git show核源码与摘要。此为静态旁证，不修补或伪造旧live样本；也不宣称所有schema完全相同。调用路径未将这些可选输出字段用作核心输入，当前无由这三处支持的破坏性合同证据，归为基线信息缺口，不作为产品发布阻断。

## 目录与策略边界

正式source投影为Community full-profile、skill.executeEnabled=true、无EEextras，26工具/24 inputSchema；inline-PTC的正式[run_code live schema](../../../packages/openbkn-business-context/tests/fixtures/context-loader-run-code-v0.2.0-live.json)有单独来源。旧50.28准备镜像的25项live目录不是本次正式部署的完整oracle。数量相同或不同本身都不证明兼容或不兼容。

当前插件仅投影实际已注册目录并保留执行guard。未知工具默认deny；条件execute_skill未声明kn_id时隐藏/拒绝；Host-local openbkn_export_csv不属于平台tools/list。declaresKnId检查属性存在，不代表自动识别任意schema类型失配，实际类型仍需核。数据属性不能因为名字碰巧叫description而在当前平台响应中被删除；本轮没有改写平台schema或模型输入输出。

真正需要阻断的是核心lifecycle缺失/变化、当前调用不能满足的核心名称/必需参数/类型变化、网络或bkn_context边界不能验证，或禁止工具意外暴露/可执行。已审排除项、条件工具未启用、Host-local工具不在平台目录，以及这三处旧提取器信息损失不能直接判成核心故障。本轮元数据核对不替代业务调用成功证明，既有通过项也不重跑。

## 非阻断的验证工具维护项

后续应将提取器改为按JSON Schema位置处理注释，并补`properties.description`等同名业务属性的回归。旧投影的丢失信息不能声称已恢复，应保留其来源与限制；新基线需记录完整实采/固定source及摘要。这是测试工具质量维护项，不要求当前插件包重建。本轮只记录问题，未修改提取脚本、fixture、allowlist或现有包。

接收方补核：当前run_code的inputSchema与outputSchema与上述独立正式历史live fixture全部键值及数组顺序相同，CSV caller使用code+bkn_context、exit_code/stdout形状相容；未新增执行。主source投影仍缺inline定义，不改其历史UNKNOWN；run_shell已审排除，不因旧schema未采再设硬门槛。
