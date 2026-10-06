# 三入口、API 与配置迁移

当前交付的是原 -5 诊断开发修正后的 -6 CI 候选。历史 -5 保留作升级基包；要给原故障用户安装的是带 S2 隔离及新界面的固定 CI tgz，其身份以 source commit、CI run 和 SHA 为准。

## 三入口是什么

同一个 npm 包在 DSH 内自动注册三个插件 row：

| 入口 | row ID | 作用 |
|---|---|---|
| 包根 `@openbkn/dsh-business-context` | `openbkn-business-context-bootstrap` | 最小启动入口，让 Host 持续提供本包浏览器端；不执行平台业务 |
| `@openbkn/dsh-business-context/business` | `openbkn-business-context` | 原有登录、绑定、会话工具与业务溯源 |
| `@openbkn/dsh-business-context/diagnostics` | `openbkn-business-context-diagnostics` | 独立采集诊断报告 |

用户安装一个包即可，不用手工添加三行。界面仍只有一个 OpenBKN 侧栏入口；点击后右上角显示“诊断”。业务入口 import 失败时，启动入口和诊断入口继续工作。整包根或共享文件被破坏不属于单个业务 row 的隔离范围。

## API 迁移是什么

只影响直接从这个包导入业务代码的开发者。原业务值改从 `./business` 导入，例如：

```typescript
// 旧写法
import { AuthCoordinator, OpenBknPlatformReader } from '@openbkn/dsh-business-context'
// 新写法
import { AuthCoordinator, OpenBknPlatformReader } from '@openbkn/dsh-business-context/business'
import type { AuthSnapshot, BusinessNetworkBinding } from '@openbkn/dsh-business-context/types'
```

包根已变成 bootstrap，不能继续当原业务 API 使用。`./types` 是 Remote 边界类型面，不是第四个插件入口。普通安装用户不需要改代码。

## 配置迁移是什么

原业务 row 的 ID 和 config 字段保留。若 patch 只有 `id`，无需迁移：

```yaml
- id: openbkn-business-context
  config:
    baseUrl: <保留原平台地址>
    cliPath: <保留原 CLI 路径>
```

若旧 patch 还写了 `name: '@openbkn/dsh-business-context'`，Host 会把它当作 row 名称断言。新业务 row 从 `/business` 加载，旧断言不匹配，整段 override 会被跳过。因此须删除 `name` 行，或改为：

```yaml
- id: openbkn-business-context
  name: '@openbkn/dsh-business-context/business'
  config:
    baseUrl: <保留原平台地址>
    cliPath: <保留原 CLI 路径>
```

这些值是示意占位符，不直接复制执行。只调整匹配方式，保留原地址、CLI 路径与其他配置；不要把 Token 或 API Key 写入该 patch。升级后在实际 Host 确认 canary/config 生效，不能仅看安装成功。
