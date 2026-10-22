# -12 Windows 增量复核结果

测试人：
日期/时区：
人工已逐项查看本轮证据（manualConfirmed）：false
本轮总体结论：待维护端复核（不代表全量/正式发布通过）

## 身份与基线

- 候选版本：0.2.0-rc.2-openbkn.0.2.0-12
- CI：39791127284；插件源码：5519645d58a8537c27c73626bc2dae7d90ddc242
- ZIP SHA-256：43abbacd0018763057c540ad823bf229abc33e79e0e0aa0c77ecdad8b34996c0
- tgz SHA-256：30a94300994296513b8d391acda69933acf1f4a77440e9da53486a0de5bd1a44
- Windows/PowerShell/Node：
- Desktop、独立 npm Host、CLI、平台实际版本/地址：
- 相对 -11 的环境变化：未核对（填写 无 / 已知变化 / 未知，以及证据；不凭版本号断言契约相同）
- -11 基线：english11-return.zip，SHA-256 6a80537bce081b15f11aea16326363ed58ad723b8eaeac38b76d2e85a20d0ec4。
- 引用旧证据的路径/案例：
- 当前 Host/package 回执：Desktop：；npm：。（本轮各一套，不交双语重启全套）

## 本轮实测

状态填 PASS / FAIL / BLOCKED / NOT_RUN，缺数据必须保留 BLOCKED。D4 的可见文案/页签、动态计数和图选择分项说明，不能把未观察项写 PASS。同一相对路径可引用多次。

| 形态 | 组 | 状态 | 实际观察（含切换方向、保留值/ID、是否点击过 Refresh） | 证据相对路径 |
| --- | --- | --- | --- | --- |
| Desktop | D1 表单/错误/目录搜索状态 | NOT_RUN | | |
| Desktop | D2 一次真实登录合并时序 | NOT_RUN | | |
| Desktop | D3 诊断保持/显式重新采集 | NOT_RUN | | |
| Desktop | D4 同一回合溯源显示 | NOT_RUN | 文案/页签：未测；动态计数：未测；图选择：未测 | |
| npm/Web | D1 表单/错误/目录搜索状态 | NOT_RUN | | |
| npm/Web | D2 一次真实登录合并时序 | NOT_RUN | | |
| npm/Web | D3 诊断保持/显式重新采集 | NOT_RUN | | |
| npm/Web | D4 同一回合溯源显示 | NOT_RUN | 文案/页签：未测；动态计数：未测；图选择：未测 | |

D2 已有精确 -12 实测记录时填写原记录位置，不强制重新授权。未测部分仍写 NOT_RUN。失败/超时记录位置：

## 沿用与未补测（均不是本轮新 PASS）

| 内容 | 既有依据/状态 | 本轮处理 |
| --- | --- | --- |
| -11 Desktop E00/E01/E04/E08/E09/E10；npm E00–E05/E08–E10 | 原包中的实际 PASS，仅作基线引用 | 未变部分沿用；受影响部分以本轮 D1–D4 为准，不整体重跑 |
| -11 Desktop E05 | FAIL | 必须以 D2 本轮真实结果说明是否修复；未测不得沿用为 PASS |
| -11 Desktop E02/E03 | BLOCKED | 本轮 D1 验证关闭→切语言→重开，未测仍保留未验证 |
| -11 两形态 E06/E07 缺动态计数/非空图 | BLOCKED | D4 只测现有可用数据；缺项继续 BLOCKED，不找数据刷通过 |
| 中英文冷启动/完整业务或 G6/完整契约/无插件 Ctrl+C 对照 | 本轮 NOT_RETESTED | 引用原件与维护端记录；未宣称本轮执行 |
| 纯语言切换零新增 RPC 专项 | 本轮 NOT_RETESTED | 未新建抓包验收，不自动认定通过 |
| Windows runner/Ctrl+C、本地 error/平台 completed 等旧异常 | 原异常继续保留 | 只记录本轮自然复现情况，未改写为已解决 |

## 进程、清理与 npm 标签

- Desktop：pending/completed 进程快照：；清理回执：；剩余进程/监听：
- npm：pending/completed 进程快照：；清理回执：；剩余进程/监听：
- 当前 Host 回执若因重启失效：说明原因并补该次真实身份，不伪造 restart-en/restart-zh。
- npm dist-tags 验收前：；验收后：；证据：
- 本端执行 npm publish：否（如事实不同必须改正并说明）
- 本端修改任何 npm dist-tag：否（如事实不同必须改正并说明）
- 本轮新异常/自然复现旧异常：无记录（据实填写；包含最小原始错误、时间/ID和相对证据，不含凭据）

## 打包

- 回传 ZIP：english12-delta-return.zip
- SHA-256：
- 实际文件数：
- 维护端可访问的链接/共享路径：
- 已检查不含 token/设备码/授权 URL/凭据/整份用户目录：未检查（据实填写）

本模板是增量协议，不传给全量 Review-Results.mjs；维护端将独立核对身份/证据/基线。不能因范围缩小将历史 FAIL/BLOCKED 或本轮未测项目改为 PASS。
