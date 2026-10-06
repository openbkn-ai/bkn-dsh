# R9 npm 操作原记录（2026-10-06 晚，端口 18281/18282）

1. W1 Host（18281）：插件 → 查看 @openbkn/dsh-business-context → "共 3 个 · 3 运行中" → 卸载 → 确认
2. 卸载后：页面 @openbkn 文本=无；侧栏 OpenBKN=0
3. 磁盘核验：profiles/web/package.json dependencies 为空；node_modules/@openbkn 文件数=0；cordis.patch.yml 保留
4. 重装：隔离 dsh.cmd plugin --profile web install <固定 -7 tgz>，exit 0
5. 新 Host（18282）确认：侧栏 OpenBKN=1；插件详情"共 3 个"、版本 v0.2.0-rc.2-openbkn.0.2.0-7
