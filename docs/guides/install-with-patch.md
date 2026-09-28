# 在自己的 DSH 上安装并使用 bkn-dsh 插件

> 适用：DSH `dsh-v0.1.7-rc.2`（唯一受支持版本）。两样东西：**插件包**（`release/plugin/openbkn-dsh-business-context-0.1.7-rc.2-openbkn.0.2.0.tgz`）与**补丁脚本**（`compat/dsh-0.1.7-rc.2/`）。
> 端到端验证记录见 `docs/evidence/m6-stock-dsh-install.md` 与 `docs/evidence/m6-patched-dsh-and-runtime.md`（2026-09-20）。

## 为什么需要补丁脚本

插件在**未打补丁的原版 DSH**上：能安装、能加载、能绑定知识网络，但插件写入的会话事件不带 `ignorable` 标记——**DSH 重启后这些会话会被拒绝重载**（原版事件白名单为构建期静态集合，插件事件不在其中，即使插件在场）。补丁系列为 DSH 补上该写入侧能力（另含 typert 外部协议识别、锁文件一致性修复）。

## 步骤一：准备打好补丁的 DSH 源码树

```bash
git clone --depth 1 --branch dsh-v0.1.7-rc.2 \
  https://github.com/deepseek-ai/deepseek-harness.git ~/dsh-src
cd ~/dsh-src && pnpm install && pnpm build

# 打补丁（在本仓库根执行；要求目标树干净、精确处于 477b4f42）
node compat/dsh-0.1.7-rc.2/apply.mjs  --dsh ~/dsh-src
node compat/dsh-0.1.7-rc.2/verify.mjs --dsh ~/dsh-src   # 应输出 verified
```

还原补丁（升级 DSH 版本前）：

```bash
node compat/dsh-0.1.7-rc.2/apply.mjs --dsh ~/dsh-src --revert
```

## 步骤二：安装插件包

```bash
cd ~/dsh-src
pnpm dsh plugin --profile web add file:<bkn-dsh>/release/plugin/openbkn-dsh-business-context-0.1.7-rc.2-openbkn.0.2.0.tgz
pnpm dsh plugin --profile web list    # 应列出 @openbkn/dsh-business-context@0.1.7-rc.2-openbkn.0.2.0
```

卸载：

```bash
pnpm dsh plugin --profile web remove @openbkn/dsh-business-context
rm -rf ~/$(DSH_HOME 的 profiles/web)/node_modules/@openbkn   # remove 不清 node_modules 残留，手动清一次
```

## 步骤三：配置平台地址与凭证

```bash
# profile 配置层写入 baseUrl（示例使用本机 kind 集群）
cat >> $DSH_HOME/profiles/web/cordis.patch.yml <<'YAML'
- id: openbkn-business-context
  config:
    baseUrl: https://<你的 OpenBKN 平台地址>
YAML

openbkn auth login https://<平台地址>   # CLI 凭证库登录（插件经 CLI 握手取 token，token 不落插件文件）
```

自签证书环境：启动 DSH 时带 `NODE_EXTRA_CA_CERTS=<平台 CA pem>`。

## 步骤四：启动使用

```bash
pnpm dsh web    # 打开侧栏 OpenBKN 入口 → 选择知识网络 → 新建会话（绑定后问答）
```

**重要——运行形态限制**：

- 源码 dev 形态（`pnpm dsh web` 直接跑源码树）受上游工具派发缺陷影响，**绑定可用但模型工具调用会失败**（`Cannot read properties of undefined (reading 'prepare')`，DSH 自身问题，打不打补丁都一样）；
- **完整问答请使用打包形态**：官方脚本可从补丁树构建 Runtime——
  `node scripts/build-compatible-runtime.mjs --dsh <干净克隆> --output <runtime 目录>`，然后 `node <runtime>/node_modules/@deepseek-ai/dsh/lib/bin.js web`；
- 或直接使用 OpenBKN 发布的 Runtime 归档。

## 已知注意事项

- `dsh plugin remove` 后需手动清理 profile `node_modules/@openbkn`；
- SSH/远程（browse picker 后端）场景下，插件面板「新建工作区」当前不可用（browse 能力无 `pick` 方法）——先在本地把网络与工作区关联好，或直接用「继续会话/新建会话」；
- 升级 DSH 版本前先 `apply.mjs --revert`，再重新对版打补丁。
