# #98 B1调查的具体内容与本版收尾

原始现象：Host长时运行后，CLI重新登录/同步及列网成功，但新Session/Interaction的MCP返回Public.Unauthorized/token is invalid，重启后恢复。不把无明确HTTP状态码的业务错误记为HTTP401。

已确认部分：第34轮原生Desktop同Host重新登录后复现；Cordis及生产回归确认延迟创建MCP manager时误用调用方root context，使子组件越过business配置owner销毁继续存活。已保存构造时owner context用于MCP子组件管理，失败回归先出现、修复后通过并经原生复验，修复已经纳入本次发布源码。没有增加全局自动重连、token缓存或Host改造。见[原失败与修复](../2026-10-21-local-34/RESULTS.md)。

已有验证：第38轮Mac四组合在同Host持续4小时30秒、凭据自然过期后，正常刷新、真实浏览器重登和owner重载的新Session均普通查询通过，16个不同Interaction独立读回completed/唯一query_object_instance操作。Windows四组合B1按维护者转回的-30回执接收：固定743eb4a09f1577ba4490f1f6ccbaad834d68a43f、同Host重登前后totalCount=40，8个Interaction独立读回completed且各只有一条query_object_instance/completed。该回执为local-development-preacceptance、ciRun=null、formalAcceptanceEligible=false，私有原件留Windows；本轮未重新取回或改记为最终CI候选的B1执行。见[原Mac长时结果](../2026-10-22-local-38/RESULTS.md)；Windows来源为用户在本会话转交的-30四组合总结。

仍未知部分：其他历史长时触发条件，以及登录成功后runner/browser/Job的完整因果。后续未复现不代表这些条件均已修复；明确修复过的owner缺陷与未确认历史分开保留。维护者D5已接受本轮有界收尾，本轮又明确要求“没问题就先关闭”。当前没有新增已确认插件缺陷待修，按调查完成关闭#98，不补长时、W-LIFE、RDP或新登录。新可复现事实另行跟进，原失败/UNKNOWN不修改。
