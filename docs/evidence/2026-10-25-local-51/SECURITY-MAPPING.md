# 冻结基线安全适用性

本轮只做源码/实际运行包映射，没有发真实凭据重定向探针，没有修补/升级DSH或重包-30/-31。两官方Mac Desktop实际ASAR和两份同版本npm任务运行包分别携带MCP client2.0.0/2.2.0；DSH transport bundle SHA均758d8fc473b700b5d351158d06ce9f9e92c16e8b25497b08bb7bd2122a87f5dd，创建StreamableHTTPClientTransport时仅传requestInit.headers，没有自定义fetch或redirect拒绝配置。原插件mount源文件与issue105引用的c947287f完全一致，SHA5c6e52dab90a4357a284cdf2cb2ec32de921106725c067523de78a9f2b2c0358；两冻结包Host JS相同。

[官方GHSA-6prh-2h8m-c8cw](https://github.com/advisories/GHSA-6prh-2h8m-c8cw)列@modelcontextprotocol/client受影响范围>=2.0.0,<2.3.0，修复2.3.0。结合实际版本与挂载路径，本线仍适用该风险。这里只确认适用性，未独立复跑跨origin五类合成重定向，更无实际泄漏结论。[issue105](https://github.com/openbkn-ai/bkn-dsh/issues/105)的既有localhost探针是另一发布线的报告；其-13风险接受明确限于该发布，本线0.2.1/-30/-31未据此获得豁免。用户本轮固定Host和冻结包，维持开放，不暗中加fetch代理、改Host或升级SDK。

OpenBKN CLI/SDK0.2.0认证与上述MCP SDK是不同调用链。此前SDK OAuth401可达性证据不等于整个Host安全门槛关闭；本轮没有添加OAuth provider。正式平台0.2.0的Sandbox event-token持久化问题仍独立存在，两个已准备安全候选不部署。可能触发Sandbox的G6/BOM/CSV/Function/run_code验证仍受该前提阻断，不靠改模型计划/隐藏工具绕过。没有再次请求已被用户拒绝的平台替换。
