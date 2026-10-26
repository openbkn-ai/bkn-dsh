# 第52轮：#105 发布影响与最小修复准备

#105 适用于本次 0.2.1 的固定 Host / -30/-31 调用路径，不能沿用另一发布线 -13 的风险接受。本轮已准备一行拒绝重定向补丁，完成真实 SDK / 官方 Electron 运行时合成验证；没有把草案应用到 Host、插件或冻结交接。安全门槛及 #105 保持开放。

详细范围、补丁、同源兼容差异和后续最小门槛见 [MINIMAL-REMEDIATION.md](MINIMAL-REMEDIATION.md)；[VALIDATION.json](VALIDATION.json)区分 SDK/factory 执行与实际 Host/平台验收。60 个候选跨源场景第二源请求为 0；现有策略对照证实 session/自定义头及 307/308 合成工具体风险，不能据此断言真实 Bearer 泄漏。

没有重跑 UI、B1、G6、BOM/CSV、Function/run_code 或 Windows；没有连接正式平台、读取真实凭据或修改数据配置。正式 0.2.0 和固定 DSH 保持，-30/-31、d20a266 交接和原开发修改保持。补丁仅为独立文本草案，不是正式候选，也没有取得本线风险豁免。无需用户登录或操作。

上游只读刷新：DSH master 仍 `22ddee3792402c3e70ec5f86a63c3e3e895a2f60`，已发布 rc.3 未采用；Foundry 正式仍 v0.2.0，未发布 main 新增两次 trace capture 压缩/有界 integrity retry 变动至 `a4ed5f9cf8972bb4f2c39e321965819bea7baeb3`。对相关压缩/授权读取/迁移增量作定向审阅，不宣称全上游审计；未部署、迁移或采用新 API。

当前 Windows 范围不变，等待固定 d20a266 的 -31 UI / -30 生命周期回传再合并；合成防跳转证据不替代其现场证据。没有提交、推送、CI、发布、issue 评论或关单。当前 `ciRun=null`、`formalAcceptanceEligible=false`。本轮文件保留/监听清理见 [preservation.json](preservation.json)。
