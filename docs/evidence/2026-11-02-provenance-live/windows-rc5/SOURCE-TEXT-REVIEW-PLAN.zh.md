# Windows 原文弹层专项复核计划

2026-11-03。用户明确表示已将原 Windows 会话从 terra 切换为 gpt-6.1-sol / MAX，并授权按建议继续定向复核。主会话发送任务时也显式指定该模型和推理档位。**专项已完成并原字节核收：输出原文重叠点击后的Escape留驻连续两次复现，两个键盘例正常关闭子层；两条纯hover均关闭父详情，输入hover-click因点击已关层未发Escape。不改变旧回执的FAIL或UNKNOWN，也不称六例全通过。** 见[独立接收复核](./source-text-review/INTAKE-REVIEW.zh.md)和[原报告](./source-text-review/WINDOWS-CI4-SOURCE-TEXT-REVIEW.zh.md)。以下保留原计划。模型配置来源是用户声明及工具请求，运行时metadata仍未知。

目标会话为[0.2.1业务溯源win](codex://threads/01a19c6a-e785-7f82-a5b4-cda473951fa6?hostId=remote-control%3Aenv_e_6abf8babb404832890d7c5124118ed3c)，启动回合`01a19d15-4f51-7d63-9846-49e357df608a`。继续官方DSH Desktop0.2.1-rc.5及原隔离profile/userData、真实历史会话；不测试更早Host。插件固定CI4/a520329、run41444758077、TGZ `cf9abdf4ac085506793501f5f4c7e2d3f6ff4bc8c873e07c4b6b401064ec6b8a`、126文件，不重新构建。

## 六个基础序列

| 编号 | 字段 | 操作 |
| --- | --- | --- |
| IN-HOVER | 输入原文 | 纯hover打开，保留自然键盘焦点，不主动聚焦trigger |
| IN-HOVER-CLICK | 输入原文 | hover后点击，确认实际命中位置和点击后的开关状态 |
| IN-KEY | 输入原文 | 鼠标停中性区，Tab及Enter/Space键盘打开 |
| OUT-HOVER | 输出原文 | 纯hover打开，保留自然键盘焦点，不主动聚焦trigger |
| OUT-HOVER-CLICK | 输出原文 | hover后点击，确认实际命中位置和点击后的开关状态 |
| OUT-KEY | 输出原文 | 鼠标停中性区，Tab及Enter/Space键盘打开 |

每例先重置旧弹层并记录前景窗口/PID/创建时间、所选轮次、指针位置和可取得的UIA焦点。click不是独立pin；若hover后click已经正常关闭，记录事实，不将随后父层Escape误判为Popover异常。纯hover不接管焦点，不能用鼠标位置代替键盘事件归属。

弹层实际打开后按Escape并保持指针不动，记录实际输入时刻、即时及约0.5/1.5/3秒后的画面、父详情状态及焦点去向。采样目标不等于实际采样时间，应标明工具延迟；仅有离散截图时，不能排除间隙内短暂关闭后重开，该部分保持UNKNOWN。工具不支持DOM activeElement/keydown目标时不补造。

若异常复现，仅对对应序列再确认一次，必要时区分指针留在trigger与popup内部，不扩张全量矩阵。若已有合法平台会话可访问，可对同记录、同字段、同序列只读对照；焦点、命中位置及宿主外层差异须分开记。可选平台对照不可用则UNKNOWN，不换记录、重登或生成数据。

## 输出及边界

结果分为REPRODUCED、NOT_REPRODUCED或INCONCLUSIVE，附实际事件顺序、可见状态和证据摘要；一次未复现不抹掉旧FAIL，静态候选机制不当作现场根因。新报告独立命名`WINDOWS-CI4-SOURCE-TEXT-REVIEW.json/.zh.md`，不覆盖原始回执；私有截图和业务正文留远程，公开报告经原bytes/base64/SHA传输后独立核收。

**本轮新增业务问答0、依据生成0、BKN Agent分析0、业务写入0。** 不重跑已通过的安装、复制/保存或分析焦点用例；不修改生产或测试源码，不裁决/改写平台和模型输出。保留既有任务授权，必要的rc.5隔离环境恢复可继续，但不动日常应用、账户和原会话，不覆盖缺Before数据、关TLS或全局kill。

完成后正常菜单退出任务实例，按新Before/After/current守卫核对归属、端口、协议关联及既定可读清单；旧2文件变化、39不可读和42项mtime观察不被新基线覆盖。无额外CI、commit/push、merge/tag/publish/latest操作。主会话负责文档接收和更新；复核后是否需要最小修复依据证据决定。
