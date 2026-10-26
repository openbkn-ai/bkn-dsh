# 正式平台升级与验收前提

日期：2026-10-19，Asia/Taipei。用户授权升级本机 `192.168.50.129` 到正式 0.2.0，并保留现有数据及配置。升级和数据保留验证已完成；用户随后重新登录，正式 CLI 和 live MCP 实测成功。后续插件候选及真实问答见[持续验收证据](2026-10-19-ci-41507f9-acceptance/RESULTS.md)。

## 现场结果

| 层次 | 本轮证据 |
|---|---|
| Foundry 来源 | 官方 `v0.2.0`，解引用 commit `81d5752826f3b3f3f72f3ad4cb1e22d45e99ab4b`，独立 worktree |
| 部署版本 | 官方 OCI Chart 0.2.0 共 16 个；保留 bkn-sample-studio 自有版本 0.1.0；17 release deployed |
| 实际运行 | 平台/resource 共 27 个运行 Pod Ready；正式 core-data-migrator Job Complete；实际 ARM64 image config 与注册表 manifest、正式 tag CI 摘要对应 |
| CLI | 正式 npm `@openbkn/bkn-sdk@0.2.0`；registry resolved/integrity 与 lock 相同；实际 `/Users/dominiczhang/.local/bin/openbkn --version` 为 0.2.0 |
| 数据层 | 原 8 个 PVC UID/volumeName 保留；供应链 12 表 78,635 行、世界杯 27 表 81,200 行，逐表行数相同 |
| 业务配置 | 选定 KN、模型、类型、工具、发布、Skill 和能力绑定表的排序数据导出逐字节一致 |
| Trace | 原 5 Conversation、10 Interaction、33 Operation、33 Receipt 主键全部保留 |
| 对象存储 | 两个 bucket 真实 S3 读取成功；13 个 Skill 文件 SHA256 相同；Sandbox 原 4 个空目录标记保留 |
| 配置与 TLS | 原非 Helm Secret 数据无变化；原部署配置、TLS、独立凭证逐文件相同；主机通过原 CA 验证 HTTPS 302、HTTP 308 |

备份包括逻辑数据库、停机卷、MinIO、Helm/Kubernetes 和本机配置；校验通过，未执行完整恢复演练。原始数据及凭证证据仅保存于本机权限受限的 `test-deploy/formal-020/`，不复制到本仓库。

## 实际异常及处理

Sandbox 自动恢复原会话时，kind 拉取 GHCR 出现 EOF，继而出现 ImagePullBackOff/409 恢复冲突。宿主下载同一正式 ARM64 模板并预载节点后，原会话恢复，控制器健康检查 healthy=1、failed=0。恢复期间移除的两个旧空会话目录标记依据备份补回，只创建缺失的零字节目录，没有覆盖当前 key。原基线没有 Sandbox 业务载荷文件。

原 MinIO 版本、Kafka 版本和 1Gi 限额保留。安装器保留原实例身份，未进行 EE 许可迁移。维护入口已改为正式清单，旧准备快照脚本和源码修改仍保留。

## 后续验收状态

- 默认 CLI 已刷新有效登录，live initialize/tools/list/schema 已执行；两版实际 DSH ToolRuntime 的开启/关闭采集守卫各 20/20，采集已恢复 enabled。独立旧测试 profile 的过期凭证未迁移。
- 用户已明确授权 -11 和后续空态修复 -12 的 build-only CI。之后按用户最新指示先完成全部本地开发、构建与验证，再统一同步分支和执行最终远端 build-only。
- 双宿主完整 Mac/Windows Desktop/npm 组合、G6 非空原生溯源、B1 同 Host 重新登录及完整人工质量项仍开放。两版 Mac npm CLI web 已实际运行，真实问答有失败；不能写成整体通过。
- 平台浏览器首页已登录；浏览器仍显示不安全标记。主机 CA 验证不代替浏览器信任。第二台 LAN 设备、完整恢复演练及旧宿主 MCP SDK 安全门槛未关闭。

平台升级阶段未修改插件包代码；后续实际 UI 缺陷的小范围源码修复和测试单独记录于持续验收证据。没有发布、迁移 dist-tag、合并 PR 或升级用户安装的 DSH。
