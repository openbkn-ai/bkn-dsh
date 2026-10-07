# 鉴权恢复验证导航

当前固定 CI 身份与各层证据见 [RESULTS.md](RESULTS.md) 和 [current-acceptance.json](current-acceptance.json)。源码 PR #76 已通过最终 head 独立批准，build-only CI 37570295456，tgz fa168d81…/65 文件，未发布。

- Mac 的 401 面板/同 Host CLI 恢复：`mac-401-panel.*`、`mac-recovered-panel.*`、`mac-recovered-diagnostics.*` 与产品 JSON d867ec03/7a116535。
- TLS/原配置健康：`mac-tls-diagnostics.*`、`mac-normal-diagnostics.*` 与 37de9124/17e1ce66。
- 真实下载：`product-downloads.json`；Git 原始字节一致性单列 `git-product-consistency.json`。
- 官方核心 fixture/live guard：`ci-native-output-runtime.jsonl`、`ci-live-guard.jsonl`，各实际 argv/peer/退出码伴随保留。
- Host/PID/日常 selected-file/patch 收态：`mac-stop-*`、`mac-cleanup.json`、`daily-selected-*`；范围不足处明确标注。
- 旧 Windows 回传复核：`WINDOWS-OLD-EVIDENCE-REVIEW.md`。
- 平台镜像/上游契约：`platform-images.json`、`upstream-contract-check.json`。

原 Host/浏览器授权日志及凭据只留私有隔离目录，不入库。文件全量 SHA 清单 `evidence-files.json` 排除清单自身，作为交付检查材料，不替代真实运行。
