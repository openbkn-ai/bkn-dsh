# R9 desktop 操作原记录（2026-10-06 晚）

1. W1 轮 Host 内：插件 → 查看 @openbkn/dsh-business-context → 详情"共 3 个 · 3 运行中"（diagnostics/business/bootstrap 三 row 各一）→ 点"卸载 @openbkn/dsh-business-context"→ 确认弹窗"卸载「@openbkn/dsh-business-context」？"→ 点"卸载"
2. 卸载后 UI：整页 openbkn 元素=0（侧栏入口与详情全部消失）
3. 磁盘核验：profiles/desktop/package.json dependencies 为空；node_modules/@openbkn 文件数=0（空壳）；cordis.patch.yml 用户 patch 保留（openbkn-business-context 健康配置原样）
4. 重装：桌面随附 dsh.cmd plugin --profile desktop install <固定 -7 tgz>，exit 0
5. 新 Host 确认：重启 Desktop 应用 → 插件详情三 row 恢复"运行中"（diagnostics/business/bootstrap），版本 v0.2.0-rc.2-openbkn.0.2.0-7
注：本流程为卸载-重装，非升级；未触碰用户会话/模型/无关 patch
