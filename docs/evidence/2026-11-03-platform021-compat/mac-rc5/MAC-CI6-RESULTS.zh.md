# Mac CI6 续验回执

本轮为 **PARTIAL／预发布范围**：新平台安装、真实授权、受管理查询和 CSV 字节链已完成；旧 S1–S3 仍 NOT_RUN，不默认降级或记成通过。formalAcceptanceEligible=false。

固定源码 f01b316fbfb6be681af81e2267a7b3341e659efd；build-only CI41596006291/publish=false，artifact13212518096。候选 0.2.1-rc.3-openbkn.0.2.1-3，TGZ877732字节、126文件，SHA2564500fa4357cdcdcb9914a39794aedb9096c948192c2bf0f35ecf4fadb882f046；ZIP877818字节/SHA256ab75ba75ea60a6ec2281015d2a863a8f27063e8f9cbce3524e7daf10580cf5ac。相对CI5恰8文件改变、118不变；不是本地参考包。官方Mac Desktop rc.5严格签名通过，GUI安装126/126后正常退出0，再冷启动17741；新CLI021选项实际渲染。已加载版本诊断字段未采，不由磁盘补填。

| 项 | 结果与证据等级 |
| --- | --- |
| R0/R1 | 原保护/旧证据保留；官方GUI安装、冷启动及实际新UI通过。 |
| R2/R3 | 官方CLI0.2.1-rc.1归档完整性通过，独立复制依赖共1084文件。真实版本显示、021安装选项、已有020不覆盖均通过；精确正式021公共包404，正式安装NOT_RUN。 |
| R4 | 产品原生device flow最终完成，持续打开的面板自动显示成功及实际2网络。相关本机信息卡登录在内存操作；专用浏览器不可自动操作，因此把同一owned授权URL接力到可操作浏览器，未关闭TLS、未保存密码。此前超时、独立CLI接力阶段均保留，不与最终产品流程混算。正常取token通过；未观测强制/过期续期。 |
| S1/S2/S3 | NOT_RUN。原答案仍绑定50.28/正式020；切新默认平台时UI真实拒绝PLATFORM_MISMATCH。恢复旧origin后仍需旧平台授权，目前仅有129卡，已请求28卡路径。不改绑定、不造新答案。没有采到正文/边缘hover、留驻1s/3s、键盘后首hover或尺寸调整；不用DOM事件替代原生pointer。 |
| C1 | 独立官方SDK raw tools/list完整1页26项，26份input/output schema，末页无cursor。源码准备33项中7项未部署；共同9项投影schema一致。drill仍拒绝，未扩权。 |
| C2 | 官方rc.5 ASAR工具runtime＋实平台：KN/context/drill拒绝通过，一次有效库存小页查询通过。遗漏version收到真实平台错误，该负例在上游记录failed，不能声称它未dispatch。当前库存定义没有披露related_metrics及发布版本，因此正向version/query未猜测执行，保留待验。 |
| C3 | 受控官方runtime＋实平台：已有BOM发布函数仅显式一级，exit_code0、9行；候选export_csv交付1030字节，与平台SHA256cd5715e7bba287d274f5a517f6f72d78ed2c006e4b1ecfc9091c424f416fd61a完全一致。Interaction正常completed。不是GUI文件点击或完整BOM/G6复跑。 |
| R5 | GUI菜单退出0；Host/授权浏览器及端口56957收净。7保护文件、229旧证据和126安装文件不变；公共任务YAML、系统关联逐字节恢复。新授权、真实治理记录和CSV保留。 |

新平台实际是 https://192.168.50.129，health为0.2.1-main.20261103005009.sha0acbbb4；bkn-backend/agent-retrieval/ontology-query为该main镜像，observability为0.2.1-main.20261103005108.sha1e6be4d，Studio为0.2.0-main.20261103121236.sha6480d49。完整部署镜像清单及摘要见JSON；首尾health/镜像视图一致。CLIrc.1/npm源1cd2839652733e2ce6690b14e76ff8e9d73861dc，不能替最终正式021验收。

**404与UI边界**：对真实新Interaction int_baa39f5f03996a54e0e5aa407b46186e，候选Reader GET `/api/agent-observability/v1/business-provenance/interactions/<I>` 和该路径 `/markdown` 均404；conversation/rounds未执行。标准 `/api/agent-observability/v1/interactions/<I>/operations` 为200，只有9项安全投影，不能据此称旧UI完整input/output可见或EE已安装/许可。未构造同origin的DSH答案handle，129原生UI整体Core回退未验证；旧GUI的实际结果是平台不匹配保护。404根因UNKNOWN，不凭旧提示唯一归因。

受控装配遇ASAR解析/初始stdin关闭等环境失败，原始工具输出及收据保留。首个只读元数据Interaction int_3827b5924f92df039b48c28c3a55af68 已通过官方SDK取消；后续成功Interaction单独记录。stop调用了不存在的ctx.destroy，受控进程随后中断退出1，与真实GUI退出0分列。没有把这些当插件修复。没有新模型问题、解释生成或Agent分析；有2个明确标注的无模型治理probe Interaction、1份平台CSV及1份本地交付，不宣称全机/数据库/浏览器profile零变化。

只作一次已授权加密Git交接：handoff/ci6-platform129-card-46b70b7f8319 @7ef885a8dd0bac11944fdbe79c7b379b1139ab55。仅密文JSON/README/.gitattributes三文件；密文1468字节、SHA256498236307d857c99f2a5433a28d82ba10109a403f8a2b5cc940442209c6e5418。没有明文卡、私钥或明文摘要，未改当前E2E分支/包/平台，无PR/合并/tag/发布/latest，未跑新CI。

后续只补明确缺口：官方正式CLI可得后的精确安装；平台提供已发布指标/版本后的单次正例；同I原生路由可用后的只读核对；取得50.28本机卡后按原S1–S3续验。不重跑本轮已过项，发布影响由主会话按具体边界判断。私有业务正文/截图留本机，凭据存储与原卡不入证据清单。
