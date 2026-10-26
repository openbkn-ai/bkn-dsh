# #105 Windows 最小差异复验材料 r1（本地准备态）

本目录尚未推送，没有新的Git交接提交。`kit/KIT-FILES.json`固定本地输入；其摘要见第59轮证据。当前 **GUI-ARTIFACTS.json两项均NOT_BUILT、executionAuthorized=false**，不是可直接启动的独立GUI交付。不要把Mac arm64整包或12文件MCP payload当Windows GUI安装器。

- 只使用冻结 -32，SHA256 `46626510825fe9146aef12c27a1724acbb455aeac22aa600358add0fc8e1c9f8`，82文件。
- 保持DSH旧0.2.0-rc.2 /639ed015与新0.2.1-rc.3 /1f81c047，MCP SDK2.0.0/2.2.0，不使用远端 -11。
- 当前另一个Windows会话继续固定d20a266：-31仅U1/溯源/精确800×600；-30单独W-LIFE。本材料不改变或重跑该范围。
- 正式平台仍192.168.50.129原样0.2.0；保留数据、配置和失败证据，不安装到日常目录、不替换现有Host、不推送、不跑CI。

包内包括 -32、官方CLI/SDK0.2.0、两固定基线的MCP payload、源补丁系列、只读输入校验器、原样复用的portable-tar/profile-closure和**尚未在Windows执行**的原生MCP最小探针。不含GUI制品、Windows完整runtime、账号/CLI配置、token、业务记录或私钥。

可在任务Node24.19.0下只做：

```powershell
& $taskNode "$kit\verify-inputs.mjs"
& $taskNode "$kit\verify-inputs.mjs" --require-gui
```

第一条校验文件/包输入，输出不表示执行授权；第二条在当前材料下应exit2并列出缺失GUI，禁止跳过。所有输出保存到kit外。Windows系统tar选择沿用已通过代码，不再跑argv/tar/完整旧矩阵。

正式新交接获授权且补齐制品后，再按 [最小复验矩阵](kit/WINDOWS-MINIMAL-PLAN.md) 与 [会话提示词](kit/WINDOWS-PROMPT.md)执行。缺失前提使用BLOCKED/NOT_RUN；不能改manifest把NOT_BUILT改成BUILT、关闭签名校验或拿旧rc.2冒充rc.3。结果模板在kit内，报告/manifest另存任务结果目录，私有日志不上传。
