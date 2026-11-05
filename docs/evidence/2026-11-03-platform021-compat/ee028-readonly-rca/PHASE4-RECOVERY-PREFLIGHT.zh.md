# 原记录最小恢复：阶段 4 只读预检

本回执补充阶段 3，不覆盖既有原件。新增核验仅使用已授权私有 metadata 中的真实 ID；未读取备份或平台正文，未执行平台写入。

## 已证结果（受当前查询可见范围约束）

| 核验 | question | result |
|---|---:|---:|
| 原 artifact ID 符合固定契约语法 | 是 | 是 |
| 原 I 匹配目标，operation_id 缺省/空 | 是 | 是 |
| 当前配置 artifact index 按真实 doc ID 查询 | HTTP 404 / found=false | HTTP 404 / found=false |
| 原 owner 与目标现有 6 receipts 匹配数 | 6/6 | 6/6 |
| 原 request ID 与 6 receipts 匹配数 | 0/6 | 0/6 |
| 原 trace ID 与 6 receipts 匹配数 | 0/6 | 0/6 |
| 原 trace 推算 aggregate doc 查询 | HTTP 404 | HTTP 404 |
| 原 trace_id 精确 metadata 搜索 | HTTP 200 / total=0(eq) | HTTP 200 / total=0(eq) |

目标 receipts 已按 exists receipt_id + 精确 I 有界 size16 查询，total=6(eq)，全部 completed/durable，owner 一致。所有请求为原生 OpenSearch GET，_source 仅元数据白名单；未调用应用 artifact GET 或 EnsureIndex。按 docID 查询未命中仍限定于本轮 HTTP 身份及可见范围，不等同绝对物理删除；服务端有效 principal、DLS/FLS 未单独审计。

原 trace 查询为空，所以原 trace event/request/link-role 现场比较为 UNKNOWN，不能把“无对象可比”表述为“类型角色错误”。当前正式 Summary 的 q/r ref 实值仍未读取；本轮核的是备份中的真实 artifact IDs，不以 closure.answer_ref 代替 Summary.ResultArtifactRef。

## 静态条件推演与最小恢复范围

固定 Core 81d5752826f3b3f3f72f3ad4cb1e22d45e99ab4b 的 opensearchcoreprojection/source.go552–578 会把同 I 且 operation_id 为空的 terminal artifact 复制到该 I 的 receipt traces，在内存里重新设置 RequestID/TraceID；582–612 再附 question/result 的正确角色事件。question 对应 agent.interaction.started.question_artifact_ref，result 对应 claim.created.result_artifact_ref。summary.go301–319 的 request/role/type 条件因此可以成立，随后474–500生成原文引用。

因此，本轮看到原 request/trace 与 receipts 不同，不意味着需要补造旧 Trace、改 receipt.artifact_refs/closure、重写原 artifact 的 IDs 或修改模型输出。按上述固定算法及 receipt 授权条件，恢复两条原 terminal artifact 是合理的最小候选范围；应保留原 artifact ID、I、request/trace、owner、内容类型、时间及原标量内容。该结论是源码推演，实际运行 716cea 镜像尚未定位到源码 commit，原生导入的完整契约验证、恢复和读回均未运行，不能宣称 2 条恢复已经完成真实验收。

## 备份内容证据的措辞校正

阶段 3 中“完整非空 string”的“完整”超出已取得证据，应限定为“content_json 可解码为非空 string”。源任务的私有固定算法核验表明两条原标量内容与备份 stored content_hash 各自相符；若包装成 {text:...}，两条 hash 均会改变。这里没有公开或保存 hash 值，也没有运行完整 NormalizeArtifact/native validator 或与旧 Mac 原问答逐字比较。长度一致、hash 自洽都不能证明原问答从未截断。

## 共享写入前仍须闭合

1. 平台所有者确认现有备份权威性、部署 digest 对应的读入契约及当前查询可见范围；结合源任务正在核对的官方迁移/导入规则，确定保留原标量内容与 hash 的正式流程，不能自行包装正文以绕过冲突。
2. 形成精确可审阅的 2-doc 恢复方案，包含当前目标元数据预检、冲突即停、不改已有其他记录、读回验证与回退边界；禁止全量重迁移、删索引、改 alias 或共享配置作为默认措施。
3. 方案获授权后才执行平台写入。恢复后需原生只读读取验证真实 q/r ref、类型/owner/原文字段，并完成实际 DSH/Mac S1–S3；静态预检不替代这些验收。

本阶段未导入、PUT/bulk、迁移、重建索引、改 alias/config、Pod exec、DB SELECT、模型调用或修改插件。新增 localhost port-forward 已关闭，生命周期见 stage4-port-forward-preflight.json。
