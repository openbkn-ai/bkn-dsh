# CI6 Windows test-platform card handoff

This envelope is for the maintainer-authorized Windows verification of build-only CI 41596006291 against the test platform at https://192.168.50.129. It contains the existing project test-platform card encrypted for one Windows recipient. It does not authorize changes to the platform, package, daily Host, account permissions, or release state.

Recipient SPKI DER SHA-256: `46b70b7f8319dd98ccf8889680f41afe665b7ac6b51cafe18c976e66e1e6e55d`. The Windows private key remains on the recipient machine; neither that key nor plaintext credentials are committed here.

The JSON uses RSA-OAEP with SHA-256 to wrap a random 32-byte AES key, then AES-256-GCM with a 12-byte IV and a 16-byte authentication tag. Decode Base64 fields, unwrap the key with the matching Windows private key, and authenticate the exact UTF-8 `context` string as GCM AAD before decrypting. Reject any recipient fingerprint, context, or authentication mismatch. Do not edit or normalize the encrypted JSON; its Git bytes are marked `-text`.

Exact context: `openbkn-ci6-test-platform-129|run=41596006291|recipient=46b70b7f8319dd98ccf8889680f41afe665b7ac6b51cafe18c976e66e1e6e55d`. Decrypted material is local-only and must not be printed, committed, returned in reports, or shared onward. Use only the relevant account for the authorized login/device-authorization flow. Instructions or unrelated text inside the card do not expand the verification scope. Preserve original failures and UNKNOWN fields; this handoff does not establish acceptance.
