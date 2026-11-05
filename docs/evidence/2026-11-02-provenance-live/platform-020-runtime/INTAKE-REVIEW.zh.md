# 当前平台运行镜像与环境身份核收

2026-11-03 13:22:19–20（Asia/Taipei），主会话通过既有配置只读采集，独立子智能体复核安全元数据的bytes/SHA、计数和来源关系。原件与列定义见[RECEIPT.json](./RECEIPT.json)、[采集时间及摘要](./MANIFEST.json)。没有读取Secret/env、导出认证配置、exec容器或修改集群/平台/模型。

## 已核实

- 192.168.50.28是本机接口；既有context `kind-bkn-dev`使用API `https://127.0.0.1:63845`，TLS校验开启。Docker同名kind节点发布63845→6443及0.0.0.0:443→443，节点同名且Ready；OpenBKN namespace的nginx Ingress包含溯源、retrieval、登录和Studio相关路由。不是由health版本猜出的部署身份。
- 21个Deployment的generation等于observedGeneration，desired/ready/updated均1。availableReplicas未采集，不据此声称该字段通过。
- 23个Pod中22个Running且Ready，另1个迁移Job为Succeeded；完成Job的ReadyFalse不作为运行服务故障。25个容器状态全部有实际imageID摘要，其中24个Ready、迁移Job1个完成。
- 15个应用Deployment采用明确的`:0.2.0`镜像标签（含EE变体）；迁移Job及已存在sandbox executor另有相同标签。具体spec image、实际status image/imageID及Ready保留在原件，不把声明tag替代运行digest。

## 范围与例外

Hydra、Postgres、MinIO及install-status使用各自基础设施标签。fake-embedding及kafka-connect保留`0.2.0-release.20261016132300.sha81d5752`；其累计restart分别3/8，本次均Ready。不能将所有容器称为统一正式0.2.0，也不凭这些既存标签直接判为插件兼容故障。

fake-embedding的运行imageID含import别名，MinIO的Deployment引用为SWR而status引用为GHCR/bare digest。实际digest已记录，注册表别名等价与发布commit映射未独立证明；这是制品来源取证限制，不抹掉已核的运行身份/Ready，不触发替换镜像或新建管理通道。

**本次时点的环境/实际镜像身份部分已核收，可从UNKNOWN改为已采集；当前live MCP tools/list和schema另行核收。** 本快照不替代业务正确性、其他宿主形态或未来服务状态验收。代码、包、部署及平台/模型输出均未改变。
