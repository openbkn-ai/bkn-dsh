# -8 首次使用改动：开发与候选验证

日期：2026-10-08。范围仅为 [首次使用计划](../../plans/2026-10-08-plugin-first-use-quick-fix.md) 第一批 A0–A5。未发布；本文件按证据阶段更新。

## 源码与检查

- 基线 main：`4995109330a800060c523509cdaca8403744cd86`；分支 `fix/plugin-first-use-8`；插件版本 `0.2.0-rc.2-openbkn.0.2.0-8`。
- 维持 DSH `dsh-v0.2.0-rc.2`、三个组件条目与 bootstrap 零导入；无 Runtime 发布、无新配置存储、无平台算法或答案纠错。
- 未设置地址时业务条目正常启用，但不创建认证/MCP/业务服务。独立诊断将连接类检查记为 `not-run/configuration-required`。
- 通过独立配置 Remote 调用当前 profile 的 DSH 原生 `configEditor.edit`，仅改 `baseUrl`/`cliPath`，保留高级配置。有效地址保存与实际连接成功分开。
- 普通界面采用 CLI 登录；历史内部 `configureToken` 方法保留，完整无 CLI 模式仍暂缓。
- 配置重载释放旧业务所有者的策略/客户端；变更平台清除旧检查，同平台恢复保留历史。取消、旧地址与已销毁所有者的迟到结果不覆盖新检查。
- 业务回合和短绑定落盘阻止设置修改；设置保存期间阻止新的绑定写入。已有会话平台/网络不改绑，新实例只使用当前平台经 CLI 验证的 Token。

本地检查：typecheck exit 0；插件 381 项（380 pass / 0 fail / 1 skip）；仓库 suites 60/60；package audit 66 files；diff-check exit 0。原生输出随本目录归档。skip 为既有有条件平台用例，不能视为通过。

## A0 官方 npm Host 原生预验

证据：[native-config-editor-preflight.json](native-config-editor-preflight.json)。环境为官方 npm DSH `0.2.0-rc.2`、隔离 home/profile、无 inspector。使用本地构建包，**只证明原生配置链可用，不是固定 CI 候选的 UI/登录/发布验收**。

首次无地址三组件正常启用，连接检查未执行。非法 `file:///tmp/invalid` 提交返回 `openbkn/configuration-invalid/configField=baseUrl`，profile patch 哈希不变。合法地址与非默认 CLI 路径经原生编辑器写入、重载后可读回；独立配置接口和诊断继续存活。没有把组件加载 pass 当作连接成功。

## 审核收尾与候选状态

首轮 build-only run `37723949454` 在 `f6bc2228154d1ddf388468b73ab2f131c04ee7b0` 通过。随后新增原生 Context 回归并修复配置重载期间既有工作区关联恢复的 admission 边界，以及 fork 绑定落盘窗口；该首轮包不再作为最终验收包。重新构建最终候选。独立评审后补充历史溯源无已验证 CLI Token 的鉴权降级、会话销毁后父所有者 effect 解绑，以及复用线性的地址归一化函数；新增真实调用链/原生 effect 回归。配置层继承核对正常，见 configuration-layer-preflight.json；设置/诊断读取 ACTIVE fiber 的原生解析值，修复已有 !!js 配置的误判，不新增表达式解析。

本地界面预验（官方 npm DSH、全新无地址 profile）：单侧栏入口 → 地址表单 → 空值/非法地址就地提示 → 诊断明确未执行 → 通过表单保存合法地址及不存在的 CLI 路径 → 保存成功与缺 CLI 指引分别显示。未取得该预验浏览器的导出下载文件，不把点击导出记作下载通过；最终 CI 候选仍需实测。

平台实际容器镜像已重新只读采集，见 `platform-images.json`。旧隔离 CLI 凭据本地状态已过期；其失败不推断平台根因，后续使用正常授权验证。

## 固定候选验收与待完成项

固定候选：source `23ac2daa6d3538235f33a9627a8178a48f3e1ebf` → build-only run `37725960498`（success，publish=false）→ tgz `6a946030a6152d2899609fac95c66cd246e36cca5a8ce4e5f87ed379cbe706ea`，175800 字节、66 文件，见 candidate-manifest.json / candidate-files.json。源码独立评审 APPROVED、CodeQL 通过；当前未发布。Windows Desktop/npm 及用户源码构建 web 的受影响矩阵使用同一固定候选，单独 handoff；旧 -7 的实机证据不替代 -8。

既有受限账号未测、平台超时/落库、Token 重复拒绝根因、原故障机器根因沿用既定开放范围。后续完善项不进入本轮。


## 最终包的已执行验证

- 两个 Mac 隔离 profile 安装后均 66/66 字节匹配（missing/different/extra 全空），见 `mac-host-api/*installed-identity.json`。包版本/磁盘身份核验与真实界面验收分别判断。
- 官方 npm Host API：待配置时三条目 active；五个连接/配置检查 not-run；四种非法提交无写入；合法地址/非默认 CLI 路径经原生编辑器保存，重启可读回；三个高级字段保留；ACTIVE fiber 的 native expression 值正确识别；home 高层覆盖拒绝且 profile patch SHA 不变。原件见 `mac-host-api/`，属于实际 Host API，不能算点击 UI/授权通过。
- 官方 CLI remove/reinstall：已停止的隔离 Host 上，profile/home 两个选定配置文件在卸载前、立即卸载后、重装后 SHA 完全相同。未执行真实绑定文件或管理器 UI 的 F8，范围见 `cli-uninstall-preservation.json`。
- 最终包 + 官方核心库受控运行：原生回答/工具结果保留及 guard 八场景 8/8；所有者生命周期 6 条记录全部 pass（含身份、重载移除旧贡献、同会话重挂、会话释放父注册），见 `controlled-runtime/`。初次 lifecycle helper 的传递依赖查找失败发生在任何候选场景前，修正 helper 解析后通过；保留 attempt-1 原件。此证据不是实时平台/模型或完整 Desktop UI。
- 日常 profile 选定的 8 个 JSON/YAML 文件同清单内容哈希均未改变；不延伸到全部日常用户数据，见 `daily-selected-content-check.json`。

## 当前阻断与进程状态

Computer Use 返回 Mac 已锁屏，已请求用户手动解锁。先前测试模型 Key 已撤销；仅从本轮新隔离 home 移除了复制的旧引用，未改原凭据或共享 CLI store；已请用户在隔离应用配置可用模型，不能把模型未测算通过。Mac 最终包 UI 导出、首次真实授权/401/TLS 恢复、真实标准模式问答/溯源、运行中设置围栏、管理器 UI 卸载等仍待实测；G6、live MCP catalogue/guard 也待新隔离 CLI 正常授权。没有使用旧 -7 实机结果补 pass。

为用户配置与续测保留本轮隔离 Desktop（记录 PID 4582）与 npm Host（记录 PID 8357、18320）；PID 仅是本次记录，续测/停止前须重新核对创建时间、命令与 listener。单独 Host API-case root 的 5 轮进程已经身份核验停止，原始 owned-stop / process-history 已归档，18321 已释放。不宣称整台机器零残留。

Windows 固定交接已远端推送（文档提交 `59ac630784ac3a6d8cfce3eecc47e5f283cd1882`），可与 Mac 并行。Windows 回传、Mac 上述验收及 main 彩排包一致性仍是发布门槛，本次没有 tag/npm publication/dist-tag 更新。
