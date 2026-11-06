# 冻结 CI6 制品发布收尾

2026-11-06，维护者授权在 50.129 正式平台与 CLI 0.2.1 完成必要增量验收后发布；保持包不变，不重跑已通过项，50.28 不动。

## 发布入口

既有 `release-plugin.yml` 的常规路径会重建并运行完整矩阵。因此增加一个显式、仅 main 可用的 `workflow_dispatch` 路径：同时设置 `publish=true` 和 `publish_accepted_ci6=true`，常规 build/test job 跳过，仅校验并发布原制品。默认及原有 tag 行为保持原样。

专用脚本固定 CI41596006291、artifact13212518096、生产源 f01b316、版本 `0.2.1-rc.3-openbkn.0.2.1-3`，只接受 877732 字节、126 文件、SHA256 `4500fa4357cdcdcb9914a39794aedb9096c948192c2bf0f35ecf4fadb882f046` 的原包。下载前检查官方仓库、成功 run、来源 commit、artifact 身份及未过期；下载后校验 ZIP 内容、包名/版本、完整原字节摘要及源码等价。除评审过的发布脚本、工作流、针对性测试及文档外，源树不得变化。

`docs/evidence/2026-11-03-platform021-compat/FORMAL-RELEASE-ACCEPTANCE.json` 必须为 PASS，固定同一包和生产源、50.129 正式平台/CLI 0.2.1、Mac/Windows 原生增量验收；所列脱敏证据文件须逐个摘要匹配。该文件未完成前不可发布，受控测试或平台部署报告不能代替原插件的原生安装验收。

发布继续使用既有 npm Trusted Publishing/OIDC 与 provenance，直接发布下载的 TGZ 到 `rc`。随后从官方 npm 拉回包，要求原字节摘要仍一致，才创建或核对 Git tag、GitHub Release 和附件；已存在的版本/tag 不同则停止，不覆盖。runner 的 GITHUB_TOKEN 创建 tag 不会再次触发 tag 构建工作流。

GitHub Release 初建时使用 `latest=false`，保留现有 Latest。最后由已认证的维护者 npm 身份推广 npm `latest`，核读 npm 标签后再将对应 GitHub Release 标为 Latest；OIDC 发布与 npm dist-tag 认证能力分别处理，不宣称 workflow 自动具备 dist-tag 权限。任何失败保留已完成阶段，重试必须先核版本和包的不可变身份。

## 验收范围

- 复用此前 CI6 全部测试、两端 Host 和企业版 0.2.0 溯源验收，保留其原范围及限制。
- 仅补正式 CLI 精确版本的插件面板安装、真实检测、129 正常登录/网络同步及受影响只读连接；当前 Mac 和 Windows 会话正在执行。
- 129 为社区版，不能用于企业业务溯源验收，不重跑模型、解释、Agent 分析、CSV、guard 或 SourceText 已通过矩阵。
- 发布流程新增防护仅运行专门针对该入口的测试，不重复产品测试。当前专用测试 14 项通过，YAML 可解析。

正式平台升级证据已在主会话按原件 16577 字节/SHA256 `32bf200d5d679002cc4f44e61c7cb0ce1409ce519915592520b086dcb9006396` 核收；这是环境前提，不替代上述插件验收。第二设备浏览器、Kafka 非零低水位逻辑恢复等平台限制沿用升级报告，不扩成插件发布故障。
