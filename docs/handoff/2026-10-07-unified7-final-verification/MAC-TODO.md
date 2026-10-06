# Mac 主开发补测清单

固定候选：0.2.0-rc.2-openbkn.0.2.0-7，tgz `6bbab27876e743032572ddce107fcce09e0d681f87bee19fba8d78180e5a63a8`，66 文件。使用已由用户配置模型的隔离官方 Desktop，以及官方 npm DSH 0.2.0-rc.2；不修改包或 Host，不发布。

| ID | 工作 | 状态 | 需要记录的证据 |
|---|---|---|---|
| M0 | 核对固定包、实际安装、上游变化、测试平台 service images/tools-list/CLI0.1.5；采集选定保护文件前态 | PASS | fresh full remove/install，两形态66/66；当前平台28项MCP及服务镜像记录。旧安装33/66原因未知，保留为准备偏差。 |
| M1 | G6：销售订单数量与状态 | PASS | 原题native completed；40张全已确认，独立前后查询一致。 |
| M2 | G6：成品仓库存 | PASS | 原题native completed；苏州325/乌鲁木齐127/哈尔滨82，合计534/9行，仓范围及单位正确。 |
| M3 | G6：独立 BOM 构成题 | FAIL（原生交付） | 313个结构元组可对照ERP；追加库存handoff科学计数法不能无损判定，缓存修正未全量重打印；native error。 |
| M4 | G6：未结采购申请/采购订单 | PASS | 原题native completed；PR/PO分别0，独立两类查询一致。 |
| M5 | G6：销售订单明细 | FAIL（事实） | 原题native completed却答无订单；错查订单/合同号，正确product_code条件稳定40行。 |
| M6 | G6：Token失效 | PASS（受控） | 专用虚构Token触发真实401；零业务访问；恢复原cache后同会话completed。没有撤销账号。 |
| M7 | G6：平台不可达及恢复 | PASS（受控） | 关闭loopback实际网络失败及产品导出；恢复profile/binding、重启Host后同会话completed。不是集群停机或同进程observer恢复。 |
| M8 | 自动Token续期行为 | PASS（临近到期）；自然过期未测 | turn-start→CLI authority自动续期，访问/刷新Token哈希和expiry改变。仅调整本地40秒到期提示，不宣称服务端自然失效验收。 |
| M9 | 跨网络真实业务图来源 | PARTIAL | 同网36元素图的两个来源逐项Trace核对；第二网络27对象/29关系和UI目录确认。第二工作区目录选择未完成，一张真实混合网络图仍未取得。 |
| M10 | npm浏览器面板及产品导出补验 | PASS | Chrome与in-app browser真实UI；3份npm产品下载，登录后报告965afa11七项pass。 |
| M11 | 选定状态内容哈希、owned PID完整清理、原件与Git SHA | PASS（限定范围） | 18个选定文件；日常9项不变，隔离vault正常变化；owned进程树/端口检查及产品原件SHA保留。非整个home声明。 |
| M12 | 更新结果、manifest/累计说明的当前状态，核对包未改变，提交推送 | 完成 | 新RESULTS/验收overlay/剩余清单/唯一累计说明；固定tgz及kit不改，本docs分支推送。 |

真实受限账号仍不存在，`unauthorized-network` 按用户此前决定 not-run。原故障用户机器不在本机，平台大结果落库/深层库存超时修复不在插件授权范围；完成可执行项后逐项列出暂不处理理由供用户确认。

详细结果见 [Mac RESULTS](../../evidence/unified7-final-verification-20261007/RESULTS.md)，未闭合事项及原因见 [REMAINING-DECISIONS.md](REMAINING-DECISIONS.md)。新增七个G6场景五个可接受、两个失败；前轮同包三题保留原日期。事实评分9/10不等于原生交付验收8/10，不建议发布。
