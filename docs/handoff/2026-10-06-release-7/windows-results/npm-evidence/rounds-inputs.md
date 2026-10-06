# 本轮场景输入记录（npm 形态，2026-10-06 晚）
每轮 = cleanup → patch → dsh web（隔离 dsh.cmd，子进程按端口监听者记录 pid:port:creationTicks）
| 轮次 | patch baseUrl | 端口 | 产物 |
|---|---|---|---|
| W1 | https://192.168.50.28 | 18271（child 628） | W1-npm-4484d6cf.json |
| W2a | （无 baseUrl） | 18272 | W2a-npm-785aa906.json |
| W2b | ht!tp://not a valid url with spaces | 18273 | W2b-npm-380f2566.json |
| W2c-file | file:///C:/bkn-test | 18274 | W2c-file-npm-d46c681b.json |
| W2c-relative | relative/path | 18275 | W2c-relative-npm-1f8e01d4.json |
| W2c-recovered | https://192.168.50.28 | 18276 | W2c-recovered-npm-67e954e6.json |
| W3 | https://192.168.50.28（变体 SHA 见 W3-npm.md） | 18277 | W3-npm-0f3240ad.json |
| W4 | https://192.168.50.28（变体 SHA 见 W4-npm.md） | 18278 | W4-npm-d1c48003.json |
| W10 | https://192.168.50.28（变体 SHA 见 W10-npm.md） | 18279 | W10-ui-observation.md |
| W9 | CANARY（见 W9-canary-record） | 18280（child 28864） | W9-npm-c2fe2ef7.json |
| R9 | https://192.168.50.28 | 18281→18282（新 Host） | R9-operation-record.md |
| F02 | 不适用（受控 fixture，不读配置/凭据） | — | fidelity-runtime.jsonl + fidelity-prepare-record.json |
时序注意：同 desktop——W2c-recovered 先于 W3/W4，不作为 W4 后续恢复证明。
