# Windows rc.5 / #63：主会话接收审阅（2026-10-30）

## 文档交付授权（2026-10-30，本PR）

维护者后续明确允许将本轮正式发布收口与Windows公开记录整理为独立文档PR，运行必要非作者评审和CodeQL，通过后合并。此授权只覆盖文档交付；不运行构建/测试/发布CI，不改固定-2、Host/正式0.2.0或数据配置，不重跑已过项，不改latest。下方“仅本地/不推送”等为交付授权前的历史检查点。12个Windows原件按字节保留，接收审阅与正式发布说明单列。


## 维护者后续正式发布决定（2026-10-30）

维护者明确接受两项非阻断遗留，按现有-2正式发布并允许关闭#63。#63现为closed/completed，原Remote品牌/调用阶段及实测形状回归仍UNKNOWN/延后；正常实例诊断导出未见响应仍为未归属观察。这是明确调整发布/关闭标准，不是新增技术通过或根因修复。#62不重测。

现有[GitHub Release](https://github.com/openbkn-ai/bkn-dsh/releases/tag/v0.2.1-rc.3-openbkn.0.2.1-2)已转为正式发布（draft=false、prerelease=false），[发布说明](FORMAL-RELEASE-NOTES.md)已同步；包/tag/目标提交/五份附件不变，npm没有重发。Latest推广仍由维护者处理：本轮清除prerelease虽显式make_latest=false，GitHub仍一度返回-2为Latest；已恢复原-13，npm latest未变，保留该副作用及校正记录。四份台账、CHANGELOG与规则仅本地更新，不提交/推送或跑CI，不改Host/正式0.2.0及数据配置。

以下原接收审阅为此决定前的历史快照，其中“保持OPEN”和“尚未接受”等不覆盖本节；收到的12个文件和原manifest均未改写。Windows范围、未采集字段及私有原件未取回等技术边界继续有效。

## 原接收审阅（决定前快照）


本轮仅接收并核对已有公开证据，不启动Host、平台、OpenBKN CLI、浏览器或模型，不运行测试、构建、CI，不推送或改发布包。维护者要求保留固定-2及所有数据配置。最新结果是 **rc.5安装/实际加载按远程报告接收PASS；#63用户可见行为PASS，原验收的真实Remote品牌/阶段与对应回归仍未满足，保持OPEN**。

## 固定身份与核对范围

- 结果分支：`docs/windows-021-rc5-load-issue63-results-20261030`，完整提交 `c81ab4b894669a4891c8a0ea58c9a9e0acefd31d`；唯一父提交为发布源码 `aa0c43f7e8e45249da312768d458cc9452ca05b2`。相对父提交只有本目录12文件新增，没有包、源码或Host变更。
- 已发布包：`@openbkn/dsh-business-context@0.2.1-rc.3-openbkn.0.2.1-2`，SHA256 `6ce96d5bac3bb83e3b75b42cb217954e8b72f5ea7866e7536154cc12f20ae2d7`，258478字节、94文件。PR117已合并；build-only41039214129与发布41041515570已成功，Release为prerelease。回传`ciRun=null`只表示Windows本轮没有执行CI，不撤销已有发布事实。
- 12个公开Git文件按原始字节接收。10个非自身manifest映射全部匹配；`.gitattributes`没有manifest条目。manifest共52条，其中41条未取回内容，不能称52条全部验证。
- 报告SHA256：`15e776fc79fb300a170e9e475c28797eb4349f47d304c71c0a657f161be846c3`。manifest实际SHA256：`c78c746e692d028d98b266a33daebc1e6f61e0abfc111a164aafbf08ec5c91fa`；其自身条目仍是`8a62e05a…`，不匹配。原manifest不改写，以本接收摘要固定当前文件。
- 正常实例三组件状态/中性故障UI的截图及AX、安装器字节、完整日志、注册表/SID等私有原件未取回。下述实际Windows运行与恢复结论按报告及公开记录的限定范围接收，不冒充主会话本机复现或私有内容独立核验。

## A：rc.5安装与加载

官方安装器尺寸289408544及SHA512-base64、Authenticode验证按报告接收；官方原版CLI安装exit0、peer警告保留，无版本豁免或手工companion。公开校验输出为94/94、无多余文件；正常与恢复后的故障安装均重核94/94。

正常实例PID11392，CIM时间为`2026-10-30T19:44:40.0459970+08:00`，换算UTC为`2026-10-30T11:44:40.0459970Z`；故障实例PID30152，对应`2026-10-30T11:56:40.4074250Z`。两次EXE均为任务rc.5副本。EXE SHA256 `7ae939b5a82b220fbd8ad04dfbafaaedb5a49ab43dc884a5db6381f678dd0cc4`；ASAR `e1b6f25fa937da98086c3e77af77aa14791105963c4d337a1c42179d232c6915`。报告记载随附Node24.21.0/pnpm11.28.5；不补填未单独采集的Electron版本。

正常运行诊断3a62f24a三组件component-loaded、F0表单/设置/诊断可用，按远程报告接收为本轮实际加载PASS。`pluginLoadedVersion`仍未采集，磁盘版本与94文件校验不替代运行时版本字段。未登录是预期，未运行MCP联网/模型/工具或业务。仅覆盖这一个Windows官方rc.5 Desktop安装与加载，不转记全功能、全形态或未来版本兼容。

## B：#63判定

- 旧F7原件不足，Windows按许可只追加一次业务坏导入。公开business.js摘要为`14c080205500ef09318af272ba1ef4617c0280eb707f516df3c72befc8c6dd8e` → `d060c98c0b3a20acdca78be2354adec02ffebe57bafef77d791d853b2ca13216` → 恢复原SHA。
- 用户可见中性提示、不猜测Token/地址、可进入诊断并从故障实例导出报告，按远程报告PASS。公开38bfb050 JSON直接证明bootstrap/diagnostics为host-runtime/component-loaded，business为component/module-resolution-failed。
- `module-resolution-failed`是诊断分类，不是真实Remote拒绝品牌。实际Remote code/品牌/调用阶段仍UNKNOWN，未取得可驱动原DoD所要求回归的实测形状。现有三种合成失败测试意图相符，不能冒充该形状已经采集并覆盖。
- 原报告将“business入口未加载”推为“无Remote调用发生”，依据不足；客户端仍可能尝试调用缺少定义/实现的Remote。审阅结论只接受“现有原件没有记录”，不接受“已证明没有调用”。
- 原提示词允许现成DevTools只读观察，禁止的是新增插桩框架/Node inspector/改Host。报告把DevTools也当作禁令而未打开，因此不把“所有允许观察面均已用尽”作为已验证事实。本轮仍遵守停止条件，不为此重启或扩测。
- #63保持OPEN，不勾选为全部完成，不改原验收标准。后续只有取得真实拒绝形状并核对/补上对应回归，或维护者明确调整关闭标准，才可关闭。当前没有新增源码修复或测试授权，也不主动追加Windows任务。#62保持已关闭，不重测。

## rc.5退出、关联与新增观察

A/故障实例均通过应用菜单退出；X/Alt+F4在此轮rc.5欢迎态触发关闭到托盘，不记作退出。进程/端口收净按报告和公开收态接收；真实退出码仍UNKNOWN，不补0。

After unchanged=False为本轮实测写入dsh handler，按原受限脚本Restore恢复、UserChoice/ACL未动的结论按报告接收；私有四相.reg未取回。不能套用先前rc.3 unchanged=True。

**尚未归属的新观察**：正常实例两次点击诊断导出未见对话框/落盘，故障实例同按钮成功。原因未知；正常导出不记PASS，也不默认归为已接受限制或确定的插件/Host缺陷。它未改变A项的安装/加载范围，保留后续单独分诊，不新增本轮重测或issue。

## 收尾与保留

本次在四份本地计划/合同/待办/兼容台账追加本检查点，原历史原文和收到的12文件保留。#62已completed；平台#2515/#2516/#2517/#2573最新读回均closed，不等于本机正式0.2.0已部署上游修复。tab共用布局已由维护者确认实际可切换并明确保持，不列新开发。latest与本机npm CLI仍由维护者处理；不改固定-2、现有Host、正式0.2.0、数据配置或旧候选。

## 接收文件摘要

| 文件 | 本次Git对象内容SHA256 | manifest核对 |
| --- | --- | --- |
| `.gitattributes` | `27f1c535296dae67c9734ca19ea563de7510d59243fbee9b214331399326f56d` | 无manifest条目；Git对象已固定 |
| `RESULTS-rc5-install-load-issue63-20261030.md` | `15e776fc79fb300a170e9e475c28797eb4349f47d304c71c0a657f161be846c3` | 匹配 |
| `evidence-manifest.json` | `c78c746e692d028d98b266a33daebc1e6f61e0abfc111a164aafbf08ec5c91fa` | 自身条目不匹配，原件保留 |
| `fault-gui-identity.txt` | `1bac6580c9a1c5f5fc51cb5c03af2c8cf01f2d30afe86b7b68fa45301ae7a073` | 匹配 |
| `final-digests.txt` | `3efdd4c210deae819ff4a0af3f795102c93e329102ddae29d0b09104642944d5` | 匹配 |
| `gui-identity.txt` | `1ad196891f3f1bbc24d64f4e5166c8958dab1072af29fde7a72b3d22ee14a290` | 匹配 |
| `records/OpenBKN-diagnostic-fault-38bfb050.json` | `efdc0cfd5b95aafd4991bb9dcb899e9828f211f5b6f735580c67e8e40db3cca4` | 匹配 |
| `records/authenticode.txt` | `4a37ee19f8fea36e338871da5d758a2ae4c15e53f840e4ea56e4a53f627a127f` | 匹配 |
| `records/business-fault-shas.txt` | `5fa854e72f8ecf30962f92e0b03fcd798ca049e8fbc502c6de5e87a07102e77d` | 匹配 |
| `records/exit-sweep.txt` | `a1507c2a25fff14496696d37dc08fb00744a99d34d8a671bcba240a7571e10a6` | 匹配 |
| `verify-published-final.txt` | `1309eb2f21f853fadcc55315b76620b19b55f701fe057b028d2b458a05ec9f08` | 匹配 |
| `verify-published-installed.json` | `bb687646f9ed7dd70e082d879f32f64b39927e738d64c23f50ff1cfd4af7dc14` | 匹配 |
