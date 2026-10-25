# Windows #105 non-GUI handoff — frozen -32

本交接只执行五步：输入校验 → 新隔离副本 → 最小同源/跨源对照 → 收尾 → 回传。用户已授权本次独立交接及Windows按此范围执行。以主会话转发的完整Git提交和KIT-FILES摘要固定身份；本分支只有交接材料，没有工作流、开发分支或其它发布线内容。

`kind=local-development-preacceptance; ciRun=null; formalAcceptanceEligible=false`。仅冻结 -32，不采用远端 -11，不改 -30/-31/-32。旧0.2.0-rc.2/639ed015与新0.2.1-rc.3/1f81c047不变；SDK仍2.0.0/2.2.0。

## 五步执行

1. **输入**：在独立、干净checkout检查主会话指定的完整commit和KIT-FILES SHA；任务Node24.19.0运行 `node kit/verify-inputs.mjs`，输出放kit外。候选/两payload应分别82/12/12文件。此命令不启动Host，执行授权来自用户任务。
2. **隔离副本**：只为相应固定Windows Node/npm或匹配Electron后端建立新任务副本，使用空home/CLI配置。核对实际Host/profile、冻结-32安装文件及实际MCP物理入口。优先复用已有官方固定runtime；没有相应runtime就仅将该行记BLOCKED，不升级日常安装或从latest组装，不为齐表重建发行体系。具体入口见[准备说明](kit/SETUP-NON-GUI.md)。
3. **最小对照**：每个可用路径stock/protected各一次，探针每次只做同源307、跨源307各一次。stock第二源收到合成Session/问题；protected第二源0；同源均成功。必须实际使用原生MCP factory和ToolRuntime。无stock正对照或实际加载身份不足不能PASS。
4. **收尾**：fixture关闭、MCP dispose后退出本轮Host；按PID/UTC创建时间/exe/端口核对本轮进程，不按进程名清理，保留原数据配置及原Host。没有启动的行无需清理。
5. **回传**：使用[最小模板](kit/RESULTS-TEMPLATE.md)报告输入/实际模块身份、对照、收态及受阻项，附脱敏证据摘要；私有路径/原日志只留本机。聊天回传，不推送结果分支。

| 路径 | stock/protected同源307+跨源307 | 当前证据 |
|---|---|---|
| 0.2.0-rc.2 npm/Node | 各一次 | Windows NOT_RUN |
| 0.2.1-rc.3 npm/Node | 各一次 | Windows NOT_RUN |
| 0.2.0-rc.2 Desktop backend/匹配Electron | 各一次 | Windows NOT_RUN |
| 0.2.1-rc.3 Desktop backend/匹配Electron | 各一次 | Windows NOT_RUN |

Windows真正执行后才能更新表格。后端通过不转记GUI或rc.3完整兼容；源码、输入检查、Mac历史通过不替代Windows实测。探针/portable-tar/profile-closure沿用已准备字节，未重新执行已通过的Mac向量/Host/UI/B1套件。原生Windows探针尚未执行，失败时保留原件并报告，不重试到偶然通过。

## 范围

非GUI验证不依赖独立GUI、生产签名、W-LIFE、Chrome、浏览器信任或真实CLI登录。原Windows -31 UI / -30生命周期补证已结束，不要求重写旧报告、统计历史次数、转码旧证据、重拍或重测。

正式192.168.50.129保持原样0.2.0，保留现有数据配置及Host；本轮不访问平台、不用50.28。只向127.0.0.1发合成数据，不复制真实凭据/模型Key，不调用真实模型/G6/Sandbox/Function/run_code/BOM/CSV。不运行GUI、不登录、不改信任，不重跑argv/tar、A/B启动、完整UI/目录/取消超时/B1/长时或52跳转向量。

没有完整Windows runtime、GUI、CLI包或CA随包分发。OFFICIAL-WINDOWS-INPUTS仅为已有固定制品的来源参考，Mac arm64包和新rc.2不能替代Windows rc.3。source-patches仅用于身份/归属参考，不要求Windows重编译Host。输入摘要是完整性核验，不是派生GUI生产签名。

除了主会话本次获授权的交接推送，Windows不推送、不跑CI、不开PR、不打tag、不发布；用户原有开发分支/main和其它发布线均不更新。
