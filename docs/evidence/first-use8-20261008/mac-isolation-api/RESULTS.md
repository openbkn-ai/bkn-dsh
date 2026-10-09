# -8 受控故障隔离验收（S2/S4）

结论：两个故障变体均通过官方 npm DSH Host API/HTTP 层隔离验收。未操作浏览器，未宣称 UI 通过。未改源码、固定候选或发布状态。

固定基包：`0.2.0-rc.2-openbkn.0.2.0-8`，CI `37725960498`，SHA-256 `6a946030a6152d2899609fac95c66cd246e36cca5a8ce4e5f87ed379cbe706ea`，66 文件。`variants.json` 记录 exports 定位、两个变体 SHA 与目标文件前后完整哈希；每个变体只改一个文件，其余 65 文件不变。安装后逐文件比对各自变体均 66/66 一致。

- **S2（business 坏导入）**：报告 `714bb382` 返回 `business-entry fail/module-resolution-failed`；bootstrap 与 diagnostics active。配置 API 仍可读取，`baseUrl=""`、`configured=false`；因业务 row 无法导入，诚实返回 `editable=false/entry-inactive`。这不代表故障业务 row 可编辑。
- **S4（diagnostics 坏导入）**：bootstrap 与 business active；没有业务 URL，业务处于首次设置等待状态。diagnostics 与同属该 owner 的配置 API 返回 `gateway/service-unavailable`。没有执行业务平台请求或问答，不延伸为完整业务功能证明。
- **客户端供给**：两场景均在认证后的 Host index boot 清单中保留本包，目标 JavaScript HTTP 200；仅证明 Host 供给链，未执行浏览器客户端。
- **收态**：自有 PID 35176/35175 按 creation/argv/listener 校验后停止（原生输出留存），事后 PID 不存在，端口 18322/18323 无 listener。仅涵盖本轮 owned PID/端口，不宣称全机零残留。无模型、无 OpenBKN token、CLI store 空，没有登录/模型/平台请求。

## 执行偏差与日志

准备阶段错误地在没有隔离 env 时运行了一次 `dsh plugin --profile web --help`，它转发 pnpm help，新增日常 profile 的空日志：`/Users/kalias/.dsh/profiles/web/.plugin-manager/logs/operation-WN3DUX/pnpm.log`。文件大小 0，mtime `2026-10-08T13:16:42.195579+08:00`，SHA-256 `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`。日志保留；未删除以制造零触碰结论。近期文件扫描仅发现该日志，没有日常 profile before 快照，不声称其全部内容未变化。后续所有 CLI 调用显式隔离，helper 未修改。另一次未指定 profile 的 help 返回 required-profile 错误；未用于验收。

临时 root 使用 macOS TMPDIR 的实际路径（见 `variants.json`），均为本任务独立目录，不涉及其他 Host。`helpers-provenance.json` 记录原有两 helper 和新增只读 HTTP 核验脚本 SHA。全部安装/启动/API/停止原生输出留在各自 root；`native-logs-manifest.json` 记录路径、字节和完整 SHA。含本地 launch token 的原 Host 日志/URL 权限 0600，不复制进安全结果目录、不导出内容。

## 证据文件

`RESULTS.json` 汇总判定；`s2/s4-installed-identity.json` 为安装件比对；`s2/s4-pluginInventory-list.json` 为官方 inventory 原始 RPC；`s2/s4-openbkn*.json` 为诊断/配置 RPC；`s2/s4-host-supply.json` 为 boot 清单与脚本供给；`s2/s4-owned-processes-before-stop.json` 与 `s2/s4-cleanup.json` 为 owned 进程收态；`s2/s4-start.json`、`s2/s4-install.json` 为操作起止；`FILES-MANIFEST.json` 为安全结果逐文件清单（不含自身）。
