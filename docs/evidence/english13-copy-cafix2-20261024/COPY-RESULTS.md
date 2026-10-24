# COPY-RESULTS — Windows -13 CA 修复后场景复测（copy13cafix2，最终确认轮）

- 时间：2026-10-24 08:14Z–10:02Z（本地 16:14–18:02）/ Asia/Taipei（UTC+8）
- 依据：用户在 cafix 复核后指示"根据最新调研情况，重新测试这两个场景点，做最终确认"；操作修正来自复核结论（设备授权窗口≈平台 expires_in 120s，需先就位浏览器再点击、批准后立即确认）。
- 前置核对通过：NODE_EXTRA_CA_CERTS=db332d0c…（修复后 CA 未变）；两根 copy13cafix2 phase 原不存在；启动前零测试进程。
- **结论：两形态场景点最终确认成功——登录均通过，四张目标文案截图全部取得。**

## Desktop（C:\bkn-verify\english12-desktop）

| 项 | 结果 |
| --- | --- |
| Host/package 回执 | copy13cafix2-host.json（08:14:07Z）；package-copy13cafix2-20261024T081407753Z.json（74 文件匹配 -13） |
| cleanup | cleanup-20261024T094419451Z.json（09:44:19Z，应用菜单 Exit 正常退出后 Stop-Host，零残留） |
| 登录 | **一次登录成功**。08:14:27.881Z 点击一次登录；设备授权页弹出后操作者即时确认（预登录就位）；面板直接恢复目录（2 网络，desktop-supply 已关联）。未重试 |
| 中文目标句 | **PASS**——"平台口径的操作状态、耗时与请求 / 追踪 / 回执引用。"完整显示（desktop-zh.png，含"平台执行事实"标题+请求/追踪/回执引用行） |
| 英文目标句 | **PASS**——"Operation status, duration, and Request / Trace / Receipt references recorded by the platform."完整显示（desktop-en.png，同回合同位置，宿主切换 English 后重开） |
| 语言恢复 | 已恢复中文（视觉复核：新建会话/工作区/查看业务溯源均中文；注：原生菜单栏标签有滞后现象，属宿主行为，未影响 Web 内容语言） |
| 原交互 | int_00aaa4e012f3c20e268aeebf4eb5b6fd（会话"供应商与采购订单关系"） |

## npm/Web（C:\bkn-verify\english12-npm）

| 项 | 结果 |
| --- | --- |
| 标准入口 | 沿用持有人授权的剪贴板接力（Ctrl+A/C 复制控制台缓冲→一次性脚本内存提取 URL→CDP 导航→清空剪贴板）；token 零暴露；页面终态干净地址 |
| Host/package 回执 | copy13cafix2-host.json（09:46:50Z）；package-copy13cafix2-20261024T094649845Z.json（74 文件匹配 -13） |
| cleanup | cleanup-20261024T100215192Z.json（10:02:15Z，Stop-Host 按回执终止；控制台 11252 身份核验后关闭；取证 Chrome 关闭；零残留） |
| 登录 | **两次尝试**：① 09:47:24 点击后设备授权未在窗口内完成，CLI 于 121.7s 超时退出（exitCode=2=InputError "Device login timed out."，诊断 428e0467；操作者未及时确认）→ 该次失败如实记录；② 操作者明确授权"再试最后一次"并就位，09:54:40.614Z 点击（经面板"重试"恢复登录表单后）→ 设备页即时确认 → **面板恢复目录（找到 2 个网络，npm-supply 已关联）**。两次均未使用终端 auth 命令、未手工 RPC |
| 中文目标句 | **PASS**（npm-zh.png：标题+整句+req_36e7f2e1…/追踪/回执引用行，元素级裁剪） |
| 英文目标句 | **PASS**（npm-en.png：同回合同位置，宿主设置切换 English 后重开） |
| 语言恢复 | 已恢复中文（查看业务溯源/通用设置均中文） |
| 原交互 | int_c307c7650a1b644186676b3f1af48f29（会话"供应商与采购订单关系"） |

## 其他

- 截图（相对本目录）：desktop-zh.png、desktop-en.png、npm-zh.png、npm-en.png——均含目标句与"平台执行事实/platform execution facts"标题及引用行，避开无关业务内容。
- 证据：desktop\（host/package/cleanup 3 份）、npm\（host/package/cleanup/launch/launch-return/private-console 6 份+失败尝试诊断 OpenBKN-diagnostic-20261024T095143938Z-428e0467.json）、SHA256SUMS.txt。
- 登录/包匹配均不作为文案 PASS 依据；文案判定仅基于四张截图中目标句的完整显示。
- 旧包（copy13cafix BLOCKED 轮及其 REVIEW）与人工确认字段未动；未跑 E00–E10、D1–D4、G6、冷启动、A7、runner、Ctrl+C、CA 专项；npm 标签未查询未改动；未 publish；本包未自动公开上传。
