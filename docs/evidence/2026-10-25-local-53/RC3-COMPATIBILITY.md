# 新版兼容目标：DSH 0.2.1-rc.3

按用户本轮指示，当前目标改为 **0.2.0-rc.2 + 0.2.1-rc.3**。固定旧构建/生成器保持 `0.2.0-rc.2`；不是把任何现有 Host 升级为 rc.3。

| 项目 | 当前固定身份 |
|---|---|
| 旧目标 | `dsh-v0.2.0-rc.2` / `639ed015397290b3745d163aafe02ffee4aa3f84`，Cordis4.0.4 / Schemastery3.18.4 |
| 新目标 | `dsh-v0.2.1-rc.3` / `1f81c047fc48fa190a683e469daa699857e9afe8`，Cordis4.0.5 / Schemastery3.18.5，pnpm11.28.5 |
| MCP SDK | 新目标仍为2.2.0；原 MCP bundle SHA256仍为758d8fc473b700b5d351158d06ce9f9e92c16e8b25497b08bb7bd2122a87f5dd，不能据 rc.3 版本名认为 #105 已修 |
| 后续源码元数据 | 插件 -32；未构建 tgz，未固定 CI 候选。没有重包或修改 -30/-31 |
| 本轮运行输入 | 冻结 -31 的82文件复制，只改 package.json 中 private/version/peer metadata，版本明确为 `0.0.0-local53-rc3-probe`；81个其余文件及所有JS/Remote不变，不是-32产物 |

## 差异评审

使用完整 git 对比而非截断的 API compare：rc.2→rc.3 共640文件，61个执行源码文件。MCP、subprocess、Typert protocol、Gateway、Remote/access、credentials、connection、slots核心、locale这十个已定位源码包均无执行源码差异。原完整清单和分类见 [rc3-contract-review.json](rc3-contract-review.json)；不宣称对全部上游代码做安全审计。

主要需要注意的消费合同变化：

- 新增侧栏/会话 View/右侧 Guide 的 More 菜单和 pin 状态。插件依赖的 footer action、header action、dock、assistant action、tool view slot 保留，新增 owner props 不要求本插件实现整个原生外壳。
- DraftInitializationOptions 新增可选 whenDraftExists，保留 clearPreviousDraft；submission analytics 新增状态字段，插件不构造该事件对象。Host/Client 整体类型检查通过，但不能据此证明新的菜单焦点和可发现性。
- 原生 Menu/Tooltip 和入口呈现有变化，rc.3 真实 UI 仍需受影响范围验证；不直接沿用 rc.2 的视觉/键盘结果。
- provider/model-listing 变动单独归类，不启用新 provider，不执行模型；没有推断其已修复 runner/Job 或平台问题。

## 本轮已验证

1. 新隔离目录安装官方 rc.3 npm 运行包及精确依赖。注册表声明/实际 package version固定rc.3；注册表未给gitHead，因此不伪造npm构建提交等价证明。源码tag及registry integrity分别记录。
2. 原-31源码复制到独立目录，针对实际rc.3依赖进行Host和Client类型检查，均通过。首次工具根未声明zod导致回退到用户目录旧zod类型；仅在新任务根显式声明插件要求的4.4.3后通过，原失败保留。未改变用户目录、既有Host或全局Zod。
3. 私有派生fixture在rc.3官方服务上六项受控检查通过：formal guard、capture-disabled、legacy guard、CSV、native output、Remote。Remote包含无授权principal拒绝。外部平台和模型由受控seam代替，没有执行真实G6/BOM/CSV或Sandbox。
4. 官方rc.3 CLI的 `plugin --profile web add` 安装到全新任务home。官方profile resolver、Node resolver及依赖遍历检查通过，实际profile共用同一物理Cordis4.0.5和Schemastery3.18.5，插件Zod4.4.3与Host各自声明分开校验，未加全局Zod override。
5. 修正校验器从CLI installation anchor解析app-boot，支持实际npm包装安装；没有为解决测试缺包而要求Host额外顶层依赖。活跃校验器和Remote principal分支已同步rc.3，历史rc.2交接保留自带校验器。
6. 九项兼容/闭包/混版检查通过；修改校验器后的三项闭包检查及旧peer pair拒绝检查分别定向复核。隔离shadow在pnpm11.28.5下的frozen lock检查和230项供应链策略检查通过，主lock逐字节保持；最初离线metadata缺失不算兼容失败，也没有关闭或绕过策略。

## 仍未验证

- 没有构建-32候选，也没有对-32做安装、UI或发布验收。
- rc.3 Mac npm浏览器真实UI、Mac Desktop、Windows Desktop/npm均未验；本轮npm受控/profile通过不是完整产品PASS。
- 真实平台/模型G6、BOM/CSV、Function/run_code、CE非空和低权限门槛保留既有阻断；正式0.2.0及其配置/数据不替换。
- -30/-31仍是旧rc.2目标的冻结产物，Windows继续d20a266既定范围；这些结果可用于自身issue和历史缺陷判断，不能转记rc.3兼容验收。

兼容元数据、精确peers、验证脚本和当前计划/合同表格已改rc.3。已通过的历史项不因新目标被抹去；最终同候选实机、人工和build-only CI门槛继续开放。
