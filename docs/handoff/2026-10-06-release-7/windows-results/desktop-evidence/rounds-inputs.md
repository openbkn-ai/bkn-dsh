# 本轮场景输入记录（desktop 形态，2026-10-06 晚）
每轮 = cleanup（原版重装）→ 写入本轮 patch → 启动真实 Host。固定 CLI：C:\bkn-verify\diag6-tools\node_modules\.bin\openbkn.cmd
| 轮次 | patch baseUrl | Host pid（创建时间核验记录） | 产物 |
|---|---|---|---|
| W1 | https://192.168.50.28 | 18744 (W1-desktop.pid) | W1-desktop-89815bc6.json |
| W2b | ht!tp://not a valid url with spaces | 29412 | W2b-desktop-c391a9d0.json |
| W2a | （run-case W2：仅 cliPath，无 baseUrl） | 8540 | W2a-desktop-21d979e6.json |
| W2c-file | file:///C:/bkn-test | 27832 | W2c-file-desktop-471f926a.json |
| W2c-relative | relative/path | 28364 | W2c-relative-desktop-9808646a.json |
| W2c-recovered | https://192.168.50.28 | 4276 | W2c-recovered-desktop-26bc3445.json |
| W3 | https://192.168.50.28（变体：business.js 前置缺失 import，SHA 见 W3-desktop.md） | 20872 | W3-desktop-e6455961.json |
| W4 | https://192.168.50.28（变体：apply() 受控抛错，SHA 见 W4-desktop.md） | 19728 | W4-desktop-e10ad569.json |
| W10 | https://192.168.50.28（变体：diagnostics.js 坏导入，SHA 见 W10-desktop.md） | 27372 | W10-ui-observation.md |
| W9 | https://CANARY-BASEURL-W9X.example.invalid + cliPath CANARY（见 W9-canary-record） | 6788（boot.pid 记录失败，见偏差1） | W9-desktop-bc6e7538.json |
| R9 | https://192.168.50.28 | 28120→13512（新 Host） | R9-operation-record.md |
时序注意：W2c-recovered 轮先于 W3/W4 轮执行——其"恢复"证明的是配置故障恢复，不作为 W4 之后的恢复证明（W4 专项恢复未单独复测）。
