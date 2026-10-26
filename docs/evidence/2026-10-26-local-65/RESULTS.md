# 第65轮：Windows真实业务/profile与官方rc.3 GUI最小交接

2026-10-26，用户明确授权本次新独立交接推送。仅覆盖一个已有官方Windows rc.3 GUI实例：冻结-32真实业务Service自动挂载profile层回补、窗口可见及正常菜单退出。不重跑第63轮8/8或已过UI/登录/B1/W-LIFE，不新建GUI发行体系。

## 固定交接

- 分支：`handoff/windows-local32-profile-gui-20261026`
- 完整提交：`5e55d090ee2996fe2a006a59bef012d28f8f278a`
- KIT-FILES SHA256：`5a984dbade28f8cec15dfb59edb86b342af4c75d4e6bac944396d710e132e7e7`
- [完整材料](https://github.com/openbkn-ai/bkn-dsh/tree/5e55d090ee2996fe2a006a59bef012d28f8f278a)；[执行提示词](https://github.com/openbkn-ai/bkn-dsh/blob/5e55d090ee2996fe2a006a59bef012d28f8f278a/kit/WINDOWS-PROMPT.md)
- 冻结-32仍为 `46626510825fe9146aef12c27a1724acbb455aeac22aa600358add0fc8e1c9f8`，231465B/82文件；唯一rc.3 payload `48694ca37f889edbc7c41ed8edd3c08e3dc8c0d9cf87c6c118d96de44556d3e0`，12文件。

这是17文件独立root提交，无开发历史或工作流；未推开发分支/main、未开PR/tag/发布。提交带 `[skip ci]`。新远端clone核对完整HEAD、17个Git原对象和checkout字节，全部相同且checkout干净；检查时该分支workflow运行列表为空。见[远端回读](REMOTE-VERIFICATION.json)。GitHub推送提示默认分支存在Dependabot告警，仅作为远端全局提示接收，未借此扩大本次范围或采用其他发布线。

`local-development-preacceptance; ciRun=null; formalAcceptanceEligible=false`。Windows本轮执行尚未完成，不能转记实际GUI/业务自动加载或正式兼容通过。

## 变化严格限定在补证所需范围

1. 复用原rc.3 payload与冻结-32，未重建。新profile仅从这两个包解开82/12文件，另只读复制既有任务的Zod4.4.3；不复制账号、会话、业务配置、模型或workspace。
2. 观察器调用冻结Service公开configureToken，业务manager自行挂载，之后才核对已注册实例与实际物理文件。没有手动mount、修改解析器或冻结模块。Windows路径用relative/sep核对，不沿用Mac斜杠前缀判断。
3. 一个controller在启动前备份、启动一次原官方GUI、等待同一实例的加载结果和人工正常菜单退出，再保存After与恢复。只有一个loopback夹具，一次合成连接，无重定向向量、真实工具调用或平台访问。
4. 依据 [Electron44.7.0 Windows源码](https://github.com/electron/electron/blob/v44.7.0/shell/browser/browser_win.cc#L474)，注册仅写HKCU dsh协议项的三个值。系统脚本先保存该树和dsh UserChoice对照树的完整.reg或明确不存在状态、原值类型及key存在状态。恢复有账号/备份摘要/After未并发变化/任务EXE守卫，只改三个已知写点；原有key/ACL与UserChoice不写。新建且恢复后为空的相关key才移除，最后再次导出核对。不是全机注册表工具或迁移系统。

当前六组工作沿用第64轮已收敛边界：真实非空溯源、安全G6及最终候选的原要求不删；不增加独立GUI入口、构建、appId、生产签名、公证、更新、安装或迁移系统，不把未知生命周期因果扩为全量调查。窗口/退出与真实业务实例加载合并一轮，不派发旧矩阵或原报告重写任务。

## 本机验证与边界

- 本地与远端回取的输入验证均PASS：kit13项，候选82/82、payload12/12，摘要/大小/版本/清单相等；portable-tar沿用已过字节。
- 五个Node脚本语法检查PASS；离线 `--prepare-only` 创建一个新profile，82/12文件及Zod复制核对通过；没有启动Host/GUI或做模型/业务。
- 官方Mac匹配Electron Node模式只读身份检查PASS，确认原ASAR、stock MCP和版本读取路径可用；不是重复GUI/向量测试。首轮自编reader直接用Electron fs读取ASAR整体遇到ENOENT，已保存旧reader并改用original-fs读取物理归档，修正只在新交接脚本；冻结模块/Host未改。PS5.1 BOM由JSON reader显式处理。
- 本机没有可用PowerShell，**Windows PS5.1注册表备份/恢复及本轮GUI尚未运行**；不伪报为通过。Windows备份失败或守卫不通过则停止，不能弱化执行策略、ACL或UserChoice来凑结果。
- 新文本秘密/个人路径扫描、Markdown链接及Git差异格式检查通过。原始私有运行/注册表证据不包含在分支中。

正式192.168.50.129未访问或替换，现有Host/数据配置未改，-30/-31/-32冻结，不采用-11。只有本次交接分支推送；没有CI、远端issue写入、平台/模型/Sandbox动作或新GUI运行。主工作树HEAD/index/worktree refs保持，原有文件只允许本轮三份计划/合同/入口文档变化，保全见[PRESERVATION](PRESERVATION.json)。

Windows回传只需模板中的输入、真实业务挂载、一个窗口/正常退出、启动前关联备份/恢复及owned收态、证据摘要和受阻项；私有.reg/SID/日志/个人路径留本机，不推结果分支。满足停止条件后即结束，不扩大验证。
