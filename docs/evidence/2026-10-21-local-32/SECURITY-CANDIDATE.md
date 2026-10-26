# 正式 0.2.0 安全影响与本地回补候选

检查日期：2026-10-21，Asia/Taipei。当前平台仍运行官方 `v0.2.0` / `81d5752826f3b3f3f72f3ad4cb1e22d45e99ab4b`。本文件是待审阅的本地候选说明，不是部署完成证明。

本机已确认受到新安全修复针对的问题影响：`run_code` 的 Python event 含调用者 token，正式 Sandbox ORM 把整个 event 写入 `t_sandbox_execution.f_event_data`。只读聚合检查共670条执行，其中395条含非空 token 字段、8种不同值；未读取或导出 token 值，未测试其有效性、未测试越权访问，也未证明外泄。现场两个 Python 文件摘要与正式源码一致。当前 operator tracing 配置为关闭，但不能消除数据库持久化问题。

另外，正式 operator 源码会把 event 放入 span，并在依赖安装失败时附加整个请求；正式 SQLAlchemy 没有隐藏参数，超大代码写入 TEXT 失败时存在参数被错误格式化的路径。公开 ExecutionResponse 没有 event_data 字段，不能据本次证据推断任意浏览器能读取这些凭据。

## 候选范围

只回补上游 `ba8909564fa90c5ffee18e7c77862c31c155cab9` 和 `bafd352f8a1acf64ffa7f7756b32fc1a351f6f20` 的四个文件，测试采用 `207da1429e3fb4c7abc869d5c353c4b07b3bc585` 的 span 回归。补丁见 [proposed-security-backport.patch](./proposed-security-backport.patch)。

- Sandbox：新执行不再持久化 event；数据库错误隐藏参数；执行历史代码限于65535字节并保留尾部、原始长度及SHA256。实际发给执行器的代码不截断。
- Operator integration：移除 event span 属性及错误的完整 request_params。
- 不改 schema、业务函数、权限、原数据或历史执行记录；不自动清除已有395条记录，不自动轮换凭据。

两个镜像均基于当前正式镜像的同一 ARM64 manifest，在本机 Docker 构建，没有推送：

| 服务 | 本地候选 | Image config ID |
|---|---|---|
| agent-operator-integration | `openbkn-local/agent-operator-integration:0.2.0-security-r32` | `sha256:44c064fd695eb32dadc4582d9ffe2eb9466ccf15b9cdbc26fe1e934c8866d54c` |
| sandbox-control-plane | `openbkn-local/sandbox-control-plane:0.2.0-security-r32` | `sha256:8f7ab9a1fc798d6f548a437e89db334aee64287ab156521dcac9ae24ed0b2481` |

Operator 使用官方 `golang:1.25.14` Linux/ARM64 编译，保留正式构建的 CGO 和链接参数，二进制SHA256为 `a92fe467f2a1eb24d65f6aae06d7302ba0c563d6e5bcc71d03fa0ec03ea5e096`。不是新的官方发布版，也不能与未改动正式0.2.0混称同一验收基线。

## 已完成的本地验证

- 正式/回补 ORM 与 SQLite 的合成凭据、UTF-8长度和数据库错误格式化检查：7项通过；上游存储测试7项通过。
- 上游两个 Go 凭据测试在正式源码上按预期失败，在回补源码上通过；受影响 sandbox Go 包29项通过。
- 实际候选镜像离线检查通过：正式基底层和运行配置保留，二进制/三个Python文件摘要一致；非root operator 的 ELF 加载及系统库解析通过；镜像内真实 ORM 写入 SQLite 不保留合成token，超大UTF-8历史字段符合预算，执行输入原样保留。
- 当前业务12张原表78635行及选定业务配置与第31轮一致。平台服务镜像尚未替换。

这些是本地测试与镜像验证，未替代两服务上线后的实平台验收。

## 待确认的执行范围与回滚

若获明确授权：仅把这两个候选导入 `kind-bkn-test-015-lan`，更新 `openbkn` namespace 中对应两个 Deployment 的 image，保留现有 `IfNotPresent`、环境变量、ConfigMap/Secret、PVC和其它工作负载。沿用部署策略，可能短暂中断相关服务。先验证新执行不落库token、源代码/镜像身份与读写兼容，再恢复需要Sandbox的G6和Desktop模型验收。只记录新执行的聚合/字段存在性，不输出凭据。

如 readiness 或受影响接口验证失败，使用已保存的原Deployment规格恢复这两个原镜像，保留全部数据与配置：

- Operator原ARM64 manifest：`swr.cn-east-3.myhuaweicloud.com/openbkn-ai/agent-operator-integration@sha256:f1b14403f455177ad42db3b70062980de43026903f885341408ffb0c7f389b8e`；正式多架构索引 `sha256:c65183be891efc9d2a6c36f59d8f2f7e805f9047520e77427b227b8a76977856`。
- Sandbox原ARM64 manifest：`ghcr.io/openbkn-ai/sandbox-control-plane@sha256:ff3f4db46623c5ef51a66f8b127c7f2200b0400655bf5f9fe9c8fe2464c99806`；正式多架构索引 `sha256:58dfae8e1a3575bdf0f673b66dfbf5aeb260ac77333a6c3b1b740392c9bb164e`。

用户要求“不自动升级平台”，因此本次镜像替换必须另获明确授权；确认前维持正式0.2.0，暂缓可能调用 `run_code` 的模型验收。仓库提交、推送、CI、PR、合并和发布均不在本候选执行范围。
