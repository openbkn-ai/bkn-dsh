# IMAGE-SUPPLEMENT — Windows -13 四张文案图片补齐（copy13img）

- 时间：2026-10-24 10:36Z–10:41Z（本地 18:36–18:41）/ Asia/Taipei（UTC+8）
- 关联原包：english13-copy-cafix2-return.zip（SHA-256 `149508609122885420846415d245fe2c1a827b3318719b28609e97b50122ef14`，原件未动）。原四张裁剪图、旧报告与人工确认字段全部保留。
- **结论：四张图片全部取得并逐张打开核对 PASS**（标题+完整目标句到句号+完整引用行 ID，无边缘截断）。

| 文件 | 形态/语言 | 来源 | 原回合/交互 | 判定 | 引用回执 |
| --- | --- | --- | --- | --- | --- |
| desktop-zh.png | Desktop 中文 | **已有完整原图导出**（cafix2-desktop-zh-scrolled.png 整窗原图，宽幅重裁 640,445,430,230） | 会话"供应商与采购订单关系" / int_00aaa4e012f3c20e268aeebf4eb5b6fd | PASS（逐张打开核对：标题+整句+req_6817309b…/trace_1ea6870f…/receipt_rcpt_2db7…引用行完整） | 沿用 copy13cafix2 回执（desktop/copy13cafix2-host.json 等，无新启动） |
| desktop-en.png | Desktop English | **已有完整原图导出**（cafix2-desktop-en-scrolled.png，宽幅重裁 640,530,430,180） | 同上 | PASS（platform execution facts 标题+整句到句号+完整引用行） | 同上 |
| npm-zh.png | npm/Web 中文 | **重新截图**（cafix2 轮仅存固定裁剪图、无完整原图） | 会话"供应商与采购订单关系" / int_c307c7650a1b644186676b3f1af48f29 | PASS（CDP 元素级宽幅 clip 1267×325：标题+整句+req_36e7f2e1…/trace/receipt 引用行完整） | 本轮新启动：npm/copy13img-host.json、npm/package-copy13img-20261024T103800183Z.json、npm/cleanup-20261024T104111922Z.json（+launch/launch-return/private-console） |
| npm-en.png | npm/Web English | **重新截图**（同上） | 同上 | PASS（同位置英文：platform execution facts+整句到句号+完整引用行） | 同上 |

## 过程说明

- Desktop：未启动宿主，直接从 copy13cafix2 保留的两张未裁剪整窗原图按视觉定位的宽幅区域重新导出（未沿用上次固定宽高；右侧引用 ID 完整包含，右缘文本约 x=1045，裁剪右缘 x=1070）。
- npm/Web：新启动一次测试树（Start-PrivateWebConsole + 持有人已授权的剪贴板接力标准入口，token 零暴露）→ **复用 cafix2 轮的有效登录**（面板直达目录，未重新登录/未设备授权/未点登录）→ 原回合“查看业务溯源→执行溯源”→ 中文宽幅截图 → 宿主设置切 English → 同回合同位置英文宽幅截图 → 恢复中文（查看业务溯源/通用设置均中文，已复核）→ Stop-Host。清理：控制台 19188 身份核验后关闭，取证 Chrome 关闭，端口 18411/9339 零监听零残留。
- 每张最终文件均逐张打开核对（标题/整句到句号/引用行 ID/无截断/无无关业务内容），非凭文件名或历史印象判定。
- 未登录、未重试、未跑全量；未改 CA/环境/脚本/插件配置；npm 标签未查询未改动；未 publish；本包未自动公开上传。

## 新增文件摘要

见 SHA256SUMS.txt（含四张图片、本说明、npm 本轮新回执）。
