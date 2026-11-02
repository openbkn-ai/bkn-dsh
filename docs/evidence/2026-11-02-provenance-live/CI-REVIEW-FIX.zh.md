# 首轮 CI 与独立评审修正

2026-11-02。首轮源码a7ab632、CI41400870217的原始失败保留；不是把失败重跑成成功。新源码冻结后将提交新commit、完整build-only CI并重新交付产物。

## 首屏就绪等待

两个新测试文件首项在默认1秒findByRole等待内未等到首次异步详情就绪。合法1200ms mock conversation延迟稳定复现相同错误；只为原就绪条件增加10秒有界等待，保留该延迟为回归，键盘、焦点、无POST断言原样保留。无skip、自动重试或固定睡眠。官方Node22.19 Mac专项10/10；不能将模拟延迟当作完整复现Ubuntu CPU/调度根因。见 [修前后证据](./ci-readiness-fix/README.zh.md)。

## 恢复既有逐pane降级

PR121独立评审5732897920确认：总注入原生adapter后，旧getTurnProvenanceView入口不可达。原生conversation404、Trace关闭/无锚点等本应仍能展示当前回合已有local timeline，却被通用失败挡住。新增回归最初26项为18失败/8通过，再补13个直接敏感边界。

最小修复仅触及ProvenanceOverlay和4对固定中英文文案；不改Host、认证、共享focus hook或平台业务逻辑：

- 原生可读时仍采用平台详情，旧load调用数为0，不双取。
- 只有生产TransportError的NATIVE_NOT_AVAILABLE/TRACE_DISABLED/TRACE_UNAVAILABLE/BINDING_REQUIRED/AUTHENTICATION_REQUIRED明确分类允许降级。缺Interaction、Trace已明确不可录制、旧handle缺conversation时只交给既有受信Host判定，不补造平台ID或业务记录。
- IDENTITY_CHANGED、平台不符、未披露、ACCESS/LICENSE拒绝、未知/非生产异常等不自动降级；只呈现固定安全分类及文案，不透传任意error.message。
- 旧Host返回的Interaction须严格匹配（包括undefined），已知conversation须匹配；没有返回view仍按已有不可读状态显示。客户端不修正返回身份。
- requestId/key、render ownership、active+AbortSignal覆盖切轮、关闭、同answer重开以及迟到原生失败/旧view结果，不能在新窗口显示旧数据。
- 原始view对象序列化保持不变。降级只是可读范围选择，不重新裁决invalid、不修改原问答、平台或模型输出。

专项101/101（新fallback39及现有controller/locale/selection/ui），client tsc退出0、scope2/2。另一个agent对冻结Overlay与locales独立只读复核并在官方Node22执行39/39，无新增必修项。红绿、类型和范围日志留在本目录；完整Node22测试与Ubuntu CI另行记录，不能由专项代填。

## 包元数据与公开说明

- 原包license只写Apache-2.0不能准确描述本次复用Studio。改为npm标准的`SEE LICENSE IN LICENSE`；包LICENSE保留完整Apache文本并明确附录Studio OpenBKN条款，licenses/openbkn-studio.txt逐字节不改。README中同时说明两部分归属，不把Studio重许可为Apache-only。
- 包中两版README新增 -3 未发布/从核对CI tgz安装提示，保留已发布 -2 的npm安装命令，避免指向尚不存在的版本。注册表检查 -3 返回404，不执行发布操作。
- 内联UI库的重复runtime依赖树是独立评审列出的非阻断体积项；本次保留现有固定依赖图，未进行依赖升级或重分类。已存在第三方声明和许可证继续保留。

本修正仍不批准合并、打标签、发布或latest变更；新的CI产物必须由远程在隔离Host和样本上执行E2E，包括用户已明确允许的生成/更新依据与BKN Agent分析。

完整官方Node22.19.0本地验证现已完成：808通过/1专项跳过（809总）、仓库79/79、scope2/2、包审计126文件通过。本地参考e68bd4d9…，Host编译资产不变；客户端降级修复必须以新CI包在真实Host复验。
