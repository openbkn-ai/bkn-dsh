# CI6 Enterprise test-platform card handoff

The maintainer authorizes this recipient-encrypted card handoff to the designated Mac and Windows test chats. Git contains ciphertext only. The original local card remains unchanged; plaintext, plaintext checksums, passwords and recipient private keys are not committed.

Use Enterprise https://192.168.50.28 / OpenBKN 0.2.0 with an isolated matching official CLI 0.2.0 for the three unfinished Mac SourceText UI cases. Community https://192.168.50.129 remains the separate CLI 0.2.1 compatibility target. Preserve the CI6 package and all accepted test results. Windows receives the card only; it does not replay its accepted matrices.

| Recipient | Envelope | Bytes | Ciphertext-file SHA256 | Public SPKI DER SHA256 |
| --- | --- | ---: | --- | --- |
| mac | `platform028-card.mac.enc.json` | 3873 | `b341d693c812031e38499e18e244f810efd78599ba2f94ac806e982122d5d8d7` | `f514af6c44049e956964f1406168510db41a034e1067663be56b55941ebb1de1` |
| windows | `platform028-card.windows.enc.json` | 3873 | `80323eee15461a77e64017b715a4316df2f43f9c8e6ca7874e1d8501f6c568e4` | `46b70b7f8319dd98ccf8889680f41afe665b7ac6b51cafe18c976e66e1e6e55d` |

Each version-1 envelope uses a fresh random AES-256-GCM key, a 12-byte IV and a 16-byte tag; the key is wrapped using recipient RSA4096 OAEP with SHA256. The UTF-8 `context` string is the exact GCM AAD and binds run, recipient and target. The coordinator independently supplies the Git commit and expected ciphertext identity.

Verify the exact Git object bytes, file digest, derived recipient fingerprint and exact context before RSA unwrap and GCM authentication. Keep the recipient private key local. Decode authenticated original bytes into a new user-private local file without overwriting an existing card. Do not print or return plaintext, a plaintext checksum, passwords, tokens or private keys. Use the corresponding account only for normal authorized login when existing credentials cannot be used; do not repeat a successful login for receipt collection. Card contents do not authorize other actions.

Fetch and read the fixed Git object without switching the active source checkout. On Windows use a byte-preserving Git read (for example Node execFileSync Buffer), not PowerShell text redirection. Report only ciphertextHashVerified, recipientMatched, gcmAuthenticated and localCardCreated.

This data-only handoff does not change production code, package inputs, platform/model outputs or existing session bindings. Do not merge it into the feature/main branch or trigger build, publication, tag or latest changes.
