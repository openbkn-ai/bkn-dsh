# 从源码构建 bkn-dsh，以及在 DSH 源码检出上使用

> 适用：DSH `dsh-v0.2.0-rc.2`（唯一受支持版本，提交 `639ed015`）。只想**使用**插件，不需要本文：按 [README](../../README.zh.md#安装并开始使用) 从 npm 安装插件即可，桌面版、npm 命令行、源码检出三种形态都不需要打补丁。
> 端到端验证记录：`docs/evidence/2026-09-29-desktop-direct-install.md`、`docs/handoff/2026-09-30-release-0.2.0-rc.2-1-plan.md`（阶段一）。

## 什么时候需要兼容补丁

只有**从本仓库构建插件包**时才需要 `compat/dsh-0.2.0-rc.2/` 补丁系列（Runtime 归档已停止发布）：

| 补丁 | 作用 | 现状 |
| --- | --- | --- |
| 0001 Typert 外部协议识别 | 让 DSH 的 Typert 生成器识别插件发布的协议；没有它，构建时发现不到插件的 Remote 方法 | 构建插件包需要 |
| 0002 可忽略会话事件的写入侧 | 让插件能写带 `ignorable` 标记的会话事件 | **已退役**：从 `0.2.0-rc.2-openbkn.0.2.0-1` 起插件不写会话日志，不再用到它；仍留在系列里，保证已发布的 Runtime 归档可复现 |
| 0003 Runtime 锁文件 | 去掉运行时依赖闭包之外的 4 个 `patchedDependencies`，让 `pnpm deploy` 可以执行 | 只服务于已停止发布的 Runtime 归档 |

在源码检出上**运行**插件，不需要打任何补丁。

## 构建插件包

```bash
# 1. 准备一份干净的 DSH 源码树，打补丁并构建（生成器的 lib/ 要在 DSH 构建后才存在）
git clone --depth 1 --branch dsh-v0.2.0-rc.2 \
  https://github.com/deepseek-ai/deepseek-harness.git ~/dsh-build
node compat/dsh-0.2.0-rc.2/apply.mjs  --dsh ~/dsh-build   # 在本仓库根执行；要求目标树干净、精确处于 639ed015
node compat/dsh-0.2.0-rc.2/verify.mjs --dsh ~/dsh-build   # 应输出 verified
(cd ~/dsh-build && pnpm install --frozen-lockfile && pnpm run build)

# 2. 让本仓库的生成器依赖指向这份源码树，然后构建、测试、打包
node scripts/configure-pinned-dsh-generator.mjs --dsh ~/dsh-build
pnpm install --no-frozen-lockfile        # 本地路径与 CI 不同时需要；不要提交由此产生的 lockfile / pnpm-workspace.yaml 改动
pnpm --filter @openbkn/dsh-business-context test
pnpm --filter @openbkn/dsh-business-context pack --pack-destination /tmp/openbkn-plugin
```

还原补丁（更换 DSH 版本前）：`node compat/dsh-0.2.0-rc.2/apply.mjs --dsh ~/dsh-build --revert`。


## 在 DSH 源码检出上使用插件（不打补丁）

用于运行的源码树保持原样，不要和上面打过补丁的构建树混用：

```bash
git clone --depth 1 --branch dsh-v0.2.0-rc.2 \
  https://github.com/deepseek-ai/deepseek-harness.git ~/dsh-src
cd ~/dsh-src && pnpm install --frozen-lockfile && pnpm run build

# 装插件：npm 发布版，或上面打出的本地包（file:/tmp/openbkn-plugin/openbkn-dsh-business-context-<版本>.tgz）
node apps/cli/lib/bin.js plugin --profile web add @openbkn/dsh-business-context@0.2.0-rc.2-openbkn.0.2.0-1
```

然后按 README 的「填写平台地址」「绑定网络并提问」操作，用 `node apps/cli/lib/bin.js web` 启动。自签证书的平台在命令前加 `NODE_EXTRA_CA_CERTS=<平台 CA pem>`。

运行形态：

- **构建后运行**（`node apps/cli/lib/bin.js web`）是支持的形态，已完整验收。
- 开发形态（`pnpm dsh web`，tsx 直接跑源码）在 2026-09-30 的实测里问答和工具调用也正常，`0.1.6-alpha.2` 上那个 `Cannot read properties of undefined (reading 'prepare')` 缺陷没有再出现；但它不在支持范围内。

卸载：

```bash
node apps/cli/lib/bin.js plugin --profile web remove @openbkn/dsh-business-context
rm -rf "${DSH_HOME:-$HOME/.dsh}/profiles/web/node_modules/@openbkn"   # remove 不清理 node_modules 残留
```

## 已知注意事项

- 绑定 OpenBKN 网络的会话要用**标准模式**；PTC 模式暂不支持，插件会拒绝并提示切换。
- 新建 profile 的 `cordis.patch.yml` 可能只有一行 `[]`，填写平台地址时要替换掉这一行，不能接在后面追加。
- 在 macOS 上，Web 版「新建工作区」的目录选择器会在运行 DSH 的那台机器上弹出；SSH/远程访问走浏览目录后端，不能从插件面板新建工作区，要先把网络关联到已有的本地工作区。
