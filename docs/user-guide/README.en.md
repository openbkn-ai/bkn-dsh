# bkn-dsh -9 Illustrated User Guide

[中文](README.zh.md) · [HTML](guide.en.html) · [Chinese PDF](bkn-dsh-9-user-guide.zh.pdf)

DSH 0.2.0-rc.2 · Plugin 0.2.0-rc.2-openbkn.0.2.0-9 · 2026-10-11

Install · Sign in · Supply-chain Q&A · Provenance · Diagnostics

Screenshots use the Chinese UI. Match the red numbers to the legends. Account labels, platform addresses, local paths and execution identifiers use examples; controls and business results are unchanged.

## Contents

- [Start here: three entry points](#start)
- [01 · Install and verify the plugin](#install)
- [02 · Configure the platform address](#config)
- [03 · Check OpenBKN CLI availability](#cli)
- [04 · Sign in to OpenBKN](#login)
- [05 · Select a network and create its workspace](#network)
- [06 · Ask a business question and read the answer](#ask)
- [07 · Execution provenance: what happened in this turn](#execution)
- [08 · Business context graph: referenced business elements](#graph)
- [09 · Evidence chain: locate platform receipts](#evidence)
- [10 · Continue a conversation or start a new one](#continue)
- [11 · Diagnostics and export](#diagnostics)
- [12 · Troubleshooting quick reference](#faq)
- [Appendix · What this guide verifies](#scope)

<a id="start"></a>

## Start here: three entry points

bkn-dsh connects an OpenBKN business knowledge network to DSH. Ask in natural language: the plugin connects the platform, scopes network access, and records business operations. OpenBKN supplies business data and calculations; the model writes the answer.

1. Plugins (插件): install, enable, and check the plugin version.
2. OpenBKN: configure the platform, sign in, select a knowledge network, and open diagnostics.
3. Conversation: use Standard mode (标准模式), ask a business question, then inspect business provenance.

![The DSH desktop home screen. Red numbers identify controls to use.](images/01-home.png)

*The DSH desktop home screen. Red numbers identify controls to use.*

**1** Plugins · **2** OpenBKN panel · **3** Standard mode

<a id="install"></a>

## 01 · Install and verify the plugin

Install and sign in to the DSH desktop app first. This guide targets DSH 0.2.0-rc.2 and plugin 0.2.0-rc.2-openbkn.0.2.0-9. Screenshots were captured in an isolated macOS environment.

1. Open Plugins (插件), then choose Add plugin (添加插件) at the top right.
2. Enter the pinned package `@openbkn/dsh-business-context@0.2.0-rc.2-openbkn.0.2.0-9` in the package/address field. Alternatively, enter the absolute path of the .tgz downloaded from the official release.
3. Select an accessible registry and choose Install (安装). If already installed, check that the package is enabled.
4. Open the installed @openbkn/dsh-business-context entry. Confirm the version ends in -9 and all three components are running.

![Plugin management: add the package and inspect its installed entry.](images/02-plugins.png)

*Plugin management: add the package and inspect its installed entry.*

**1** Open Plugins · **2** Add plugin

![Installation form example; no installation was submitted for this screenshot.](images/03-install-form.png)

*Installation form example; no installation was submitted for this screenshot.*

**1** Package spec or absolute .tgz path · **2** Registry · **3** Install

![The installed plugin version and running component states.](images/04-version.png)

*The installed plugin version and running component states.*

**1** Version ends in -9 · **2** Package enabled · **3** Component states

> -9 is published. Get the pinned package from the [official release](https://github.com/openbkn-ai/bkn-dsh/releases/tag/v0.2.0-rc.2-openbkn.0.2.0-9). The filled installation form demonstrates the controls; the plugin was not reinstalled during screenshot collection. You do not need a source build or a discontinued Runtime archive.

<a id="config"></a>

## 02 · Configure the platform address

Ask your administrator for the full platform URL. Use HTTPS for remote platforms; HTTP is suitable only for loopback addresses. The example deployment is https://openbkn.example.com; replace it with your own address.

1. Choose OpenBKN at the bottom left, then Settings (设置) at the top right of its panel.
2. Enter the complete URL in OpenBKN platform address (OpenBKN 平台地址), including the scheme.
3. Choose Save and continue (保存并继续). A saved setting confirms configuration, not successful connectivity or authorization. Sign in next.

![The platform settings form.](images/05-config.png)

*The platform settings form.*

**1** Settings · **2** HTTPS platform URL · **3** Save and continue

> The example uses a development certificate. DSH was started with NODE_EXTRA_CA_CERTS pointing to an administrator-provided certificate, with TLS verification enabled. Ask your administrator to prepare trust for a private CA. Existing conversations keep their original platform/network binding; changing the address does not rebind them. Wait for an active business turn to finish before changing settings.

<a id="cli"></a>

## 03 · Check OpenBKN CLI availability

The OpenBKN CLI is the local program used for platform sign-in. Version -9 provides detection and an explicit install action.

1. Expand Advanced settings (高级设置) in Settings.
2. If CLI 0.1.5 is available (可用), continue. The example environment already had a working CLI.
3. If the CLI is missing, choose Detect and install CLI (检测并安装 CLI). The plugin looks for an existing executable first. It installs fixed SDK 0.1.5 through local npm only when eligible and missing.
4. Wait for an available result. Discovery fills the path draft; if it is not saved, choose Save and continue (保存并继续).
5. If you already have a CLI but DSH cannot find it, enter its absolute executable path. On Windows, point to openbkn.cmd, not its directory.

![Advanced settings: CLI 0.1.5 was actually detected as available.](images/06-cli-ready.png)

*Advanced settings: CLI 0.1.5 was actually detected as available.*

**1** Expand Advanced settings · **2** CLI executable path · **3** Available state · **4** Save and continue

> Automatic installation requires usable Node/npm and a writable global npm directory. Supported Node versions are the 22 series at 22.19+ or versions 24+; Node 23 is excluded. The automatic installer pins SDK 0.1.5 for a 0.1.5 platform. Follow network, certificate, or permission messages if installation fails. Closing the panel does not cancel an accepted installation; reopen Advanced settings to inspect progress.

<a id="login"></a>

## 04 · Sign in to OpenBKN

DSH sign-in and OpenBKN sign-in are separate. DSH gives you model access; OpenBKN determines which business knowledge networks you may use.

1. Choose Sign in with OpenBKN CLI and sync (使用 OpenBKN CLI 登录并同步).
2. Complete normal platform sign-in and authorization in the browser that opens. Enter passwords only on the platform sign-in page.
3. Return to DSH and wait for the business knowledge network list. Use Refresh state (刷新状态) if needed.

![Start OpenBKN browser sign-in from DSH.](images/07-login.png)

*Start OpenBKN browser sign-in from DSH.*

**1** Check the platform address · **2** Start browser sign-in · **3** Refresh after returning

> You do not need to paste a token into YAML, a conversation, or this guide. Signing in again can recover expired authentication, but insufficient permissions require administrator access.

<a id="network"></a>

## 05 · Select a network and create its workspace

The selected network defines the business scope of the conversation. Bind the supply-chain sample through the panel before asking questions.

1. In OpenBKN, search by name, ID, or description. Search for the supply-chain network (供应链).
2. Choose View (查看) and check its name, ID, and description. The sample ID is `supply_ontology_hand`.
3. If it has no workspace, choose New workspace (新建工作区) and select a dedicated local folder in the system picker, for example `/path/to/supply-workspace`.
4. Before the first message, select Standard mode (标准模式). A recommended question helps you start: click it, check the draft, then send.

![Inspect the supply-chain network, then create its dedicated workspace.](images/09-network-detail.png)

*Inspect the supply-chain network, then create its dedicated workspace.*

**1** Search networks · **2** Confirm the network name and ID · **3** New workspace

![The new bound conversation: workspace, Standard mode, and recommended question.](images/10-bound-session.png)

*The new bound conversation: workspace, Standard mode, and recommended question.*

**1** Dedicated workspace · **2** Standard mode · **3** Recommended question

> Business conversations in this version do not support PTC. Once a PTC conversation has messages, its mode cannot be switched; create a new Standard conversation in the bound workspace. The workspace is a local folder, while business knowledge stays on the platform.

<a id="ask"></a>

## 06 · Ask a business question and read the answer

Start with business objects, fields, and relationships. Check that the model accesses the selected network before asking more specific questions.

1. Enter a question. The real demonstration used the Chinese equivalent of:

```text
Using the current supply-chain knowledge network, explain the key fields of purchase orders and their relationships to suppliers and materials. Query the network before answering, and explain in plain language for business users.
```

2. Confirm Standard mode, choose the upward arrow at the bottom right, and wait for completion.
3. Check object definitions, field meanings, relationship directions, and data scope. Ask for query evidence, sample counts, and aggregation rules when needed.
4. Read the limitations at the end, then choose View business provenance (查看业务溯源).

![The business question before it was sent.](images/11-question.png)

*The business question before it was sent.*

**1** Confirm Standard mode · **2** Enter a business question · **3** Send

![The real answer explains purchase-order fields and business meaning.](images/12b-answer-top.png)

*The real answer explains purchase-order fields and business meaning.*

**1** Bound knowledge network · **2** Turn completed · **3** Read field explanations

![Limitations and the provenance entry at the end of the answer.](images/12-answer-provenance-entry.png)

*Limitations and the provenance entry at the end of the answer.*

**1** Read data and capability limits · **2** View business provenance

> The real turn completed in 26 seconds using network definitions and a small instance sample. One run_cypher call was refused by the plugin, after which managed instance queries succeeded. The answer described 3 order lines, 3 purchase requests, 2 suppliers, and 2 materials. This is not a full-population statistic; completed does not mean the business conclusion has passed human acceptance.

<a id="execution"></a>

## 07 · Execution provenance: what happened in this turn

After opening business provenance, start with Execution provenance (执行溯源). Local execution events and platform execution facts appear separately.

1. Choose Execution provenance and check the Interaction ID and terminal state, such as completed.
2. Scroll through the local timeline to inspect call order, successes, failures, and subsequent recovery.
3. Scroll further to platform execution facts. Each Operation can show request, Trace, and Receipt references.
4. Distinguish local failures from platform failures. A completed final state does not erase a failed intermediate call.

![The local execution timeline; scroll to read all nodes.](images/13-execution.png)

*The local execution timeline; scroll to read all nodes.*

**1** Execution provenance tab · **2** Terminal state · **3** Inspect the timeline

![Platform execution facts further down in the same pane.](images/13b-platform-operations.png)

*Platform execution facts further down in the same pane.*

**1** Operation state · **2** Request reference · **3** Trace reference · **4** Receipt reference

> The demonstration has 10 local timeline nodes and 6 platform operations. The Interaction associates business access with this answer. Operation, Trace, and Receipt references support further investigation and serve different purposes.

<a id="graph"></a>

## 08 · Business context graph: referenced business elements

Choose Business context graph (业务上下文图) to inspect the elements the platform disclosed for this answer. They help explain which business objects and relation types the answer used.

1. Switch to Business context graph.
2. Choose an element such as Purchase order (采购订单) to view details on the right.
3. Check the knowledge network, source Operation, and resolving tool to connect the element to this turn.
4. Read the graph alongside the answer. No drawn edges does not mean the whole network has no relationships.

![Select Purchase order to inspect its source and disclosed scope.](images/14-graph.png)

*Select Purchase order to inspect its source and disclosed scope.*

**1** Business context graph tab · **2** Choose Purchase order · **3** Element details · **4** Projection scope

> This turn shows 12 formally referenced elements and 0 visual relationships. It is the disclosed projection for this turn, not the complete network graph. A relation-type element is also different from an edge drawn between nodes.

<a id="evidence"></a>

## 09 · Evidence chain: locate platform receipts

Choose Evidence chain (证据链) to identify platform receipts associated with the answer. Use their IDs when further verification is needed.

1. Switch to Evidence chain and check each receipt source and state.
2. Record or copy the Receipt ID you need to inspect.
3. For independent verification, ask an administrator or use the command shown in a correctly configured platform CLI environment.
4. If receipts are absent, undisclosed, or unauthorized, follow the specific pane message. Do not assume execution failed or data does not exist.

![Six platform receipt references with further query instructions.](images/15-evidence.png)

*Six platform receipt references with further query instructions.*

**1** Evidence chain tab · **2** Receipt ID · **3** CLI query instruction · **4** Check the source · **5** Check the state

> The pane displays receipt references; it does not run openbkn trace receipts get automatically. The demonstration opened the pane but did not independently verify every receipt through CLI. completed is not proof of answer correctness.

<a id="continue"></a>

## 10 · Continue a conversation or start a new one

Continue the same conversation for the same business topic. Start a new conversation for a different topic while retaining the supply-chain workspace binding.

1. Open OpenBKN and expand the associated supply-chain network.
2. Choose Continue conversation (继续会话) to return to the existing conversation, or New conversation (新建会话) for another question.
3. Specify objects, conditions, dates, and desired output. Example: “Which field links purchase orders to suppliers? Show the evidence for the modeled relationship.”
4. For counts or amounts, specify deduplication, order headers versus order lines, and date range. Ask the model to state missing capabilities or missing data explicitly.

![An associated network offers Continue and New conversation.](images/16-continue.png)

*An associated network offers Continue and New conversation.*

**1** Confirm the associated workspace · **2** Continue conversation · **3** New conversation

> To switch networks, use OpenBKN and enter the other network’s dedicated workspace before creating a conversation. Merely mentioning a different network in the question does not reliably change the binding.

<a id="diagnostics"></a>

## 11 · Diagnostics and export

For configuration, connection, sign-in, network-list, or provenance problems, choose Diagnostics (诊断) at the top right of the OpenBKN panel.

1. Check the report ID, collection time, and recorded versions.
2. Read passed, failed, and unknown results together with the current error to locate CLI, authentication, network directory, or provenance problems.
3. After recovery, choose Collect again (重新采集). This summarizes observations already made; it is not a new full end-to-end business test.
4. Choose Export diagnostic report (导出诊断报告), select a location and filename in the save dialog, and provide the report together with steps, time, and the error when asking for help.

![Report information, disk plugin version, and recorded observations.](images/17-diagnostics-top.png)

*Report information, disk plugin version, and recorded observations.*

**1** Report ID and collection time · **2** Plugin version on disk · **3** Authentication history and recovery

![At the bottom: export the JSON report or collect observations again.](images/18-diagnostics-export.png)

*At the bottom: export the JSON report or collect observations again.*

**1** Export diagnostic report · **2** Collect again

> All 10 checks in this exported report passed. Collection is passive. Authentication history has failureCount=1 and recovered=true, showing a recovered earlier failure. Unknown DSH or loaded-plugin versions mean the collector did not obtain them; the demonstration confirmed versions separately through the app metadata and plugin details.

<a id="faq"></a>

## 12 · Troubleshooting quick reference

| What you see | What to do |
| --- | --- |
| OpenBKN entry is missing | Check installation, the enabled switch, and running components in Plugins. Restart if DSH requests it, then export diagnostics if still missing. |
| CLI missing or installation fails | Use Advanced settings. For an existing CLI, enter its absolute executable path. Check Node/npm, network, certificates, and global-directory permissions. |
| No networks after sign-in / platform-mismatch | Check HTTPS, port, and the intended platform. Save, sign in again, and refresh. Confirm the account has network permissions. |
| Certificate error | Ask the administrator to configure trusted platform certificates or CA trust. Use the administrator-provided startup method for development certificates. |
| Cannot switch an existing PTC conversation | Create a new conversation in the network workspace and choose Standard mode before the first message. |
| Answer finds no data | Check the network badge, object names, filters, and permissions. Ask the model to explain the empty result and query scope. |
| Platform capability is unsupported | Keep the error and provenance, then use available managed capabilities. Do not replace platform statistics with local guesses. |
| Provenance is not ready / turn unfinished | Wait until the turn ends. Cancellation or a missing finish can affect terminal state and completeness. |
| Unauthorized / undisclosed / platform unavailable | These are different causes. Follow the pane message: ask the administrator about access or check platform URL/service for connection problems. |
| No graph edges or no receipts | Only the displayable content for this turn is limited. Compare execution facts; do not infer that the entire network has no relationships or data. |
| Unknown versions or historical failures in diagnostics | Check time and recovered state. Unknown means missing collected evidence; Collect again is not an active test. |

1. First-success checklist: running plugin → available CLI → correct platform URL → successful sign-in → bound network → Standard mode → real question → inspect provenance.
2. For help, provide reproduction steps, time, the error, and the diagnostic report. Passwords and tokens are not needed in a conversation.

<a id="scope"></a>

## Appendix · What this guide verifies

This guide records an actual isolated macOS desktop workflow captured on 2026-10-11. The sample is supply_ontology_hand. Substitute your own platform and local workspace.

1. Actually completed: installed-version checks, CLI detection, HTTPS platform sign-in, supply-chain network selection, folder binding, a real business question, all three provenance tabs, and diagnostic export.
2. The installation form demonstrates control locations. The plugin and CLI were not reinstalled during capture. Windows UI, full-population statistics, and independent CLI verification of every receipt were not tested for this guide.
3. Example platform: https://openbkn.example.com. Network: 供应链本体知识网络-手工版 (Supply-chain ontology knowledge network, manual edition) / supply_ontology_hand.
4. Answer screenshots contain real model output from this turn. Verify fields, filters, sample scope, and platform results before treating a conclusion as a business fact.
5. Read Markdown directly on GitHub and click images for larger views. Download HTML for offline reading, image enlargement, and printing.
