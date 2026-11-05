# Windows CI6 指标前提与自然续期补充

结论：**正常SDK自然续期通过；指标正例保持NOT_RUN，缺少可读的已发布指标元数据。** 本次只访问50.129，原三份CI6公共原件保持，不重跑对象查询、guard、CSV或原生旧UI矩阵。

| 项目 | 结果 | 实际依据 |
| --- | --- | --- |
| 自然续期 | PASS_NORMAL_SDK_RENEWAL | 2026-11-03 20:54:13 +08:00 正常调用官方 currentTokenFresh；调用前已自然过期，返回新token并正常持久化，身份相同、expired=false。 |
| 世界杯KN指标目录 | HTTP404 | worldcup_vega_catalog_bkn，已披露branch=main，官方SDK collection查询published/offset0/limit20；18字节非JSON“404 page not found”。 |
| 供应链KN指标目录 | HTTP404 | supply_ontology_hand，已披露branch=main，同一官方有界查询；18字节非JSON“404 page not found”。 |
| 指标定义/version/query | 未披露 | 没有可选metric_id，未猜ID/version、未改用猜测路径或循环枚举。 |
| query_metric正例 | NOT_RUN_PREREQUISITE_UNAVAILABLE | 实调0次，新受管Interaction0个；未开启Interaction，因此无待finish记录。 |
| 原件保全 | PASS | 原3份CI6公共文件bytes和SHA逐一保持。 |

本轮使用已安装的 @openbkn/bkn-sdk@0.2.1-rc.1 和原Windows受管129凭据generation。旧到期时间 2026-11-03T09:44:12.496Z；正常SDK调用后为 2026-11-03T13:54:13.599Z。tokenChanged=true、sameStoredIdentity=true，未改时钟、expiry或手动刷新策略。这里只证明独立官方SDK正常权威调用的状态，不代填原生Host再次登录/同步/续期；refresh及版本检查HTTP未单独抓线，两个目录GET不是全部内部网络调用计数。

两个目录请求均来自原包官方 listObjectMetrics 的固定collection约定，并通过原有129精确证书pin连接；未使用50.28、未加TLS/版本绕过、未启动Desktop Host或安装升级包。路径及原始返回bytes/SHA详见JSON。采集器在收到404后尝试JSON解析产生SyntaxError，原输出保留；补充解释从已保存404原件派生，未为补状态重复请求。

这两次404只说明已查询的官方目录未提供元数据，**不证明这两个KN没有指标**。当前仍缺可读目录或现成已发布样本的 metric_id、正整数version、branch及有效query条件；取得前提后才可做唯一一次原参数透传正例。本次没有创建/发布指标、修改业务数据、调用模型或重做已通过矩阵。

原CI6报告中的自然续期NOT_RUN保留其当时事实；本补充新增稍后自然到期窗口的SDK通过记录，不覆盖旧原件。候选源 f01b316fbfb6be681af81e2267a7b3341e659efd，CI41596006291；没有提交推送、merge/tag/release/latest操作。

[完整补充JSON](./WINDOWS-CI6-METRIC-SUPPLEMENT.json)
