# Security Policy

## Reporting a vulnerability

Please report security issues privately to the OpenBKN maintainers. Do not include credentials, OpenBKN access tokens, business-network data, trace payloads, or customer identifiers in a public issue.

## Security boundaries

The plugin keeps OpenBKN credentials in the OpenBKN CLI credential store. Tokens must not enter browser code, model context, DSH session events, tool arguments, logs, release archives, or diagnostics. The plugin exposes only fixed Host-owned operations and binds each DSH session to one authorized business knowledge network.

## Supported release posture

Only releases that pass the package audit, unit tests, and the documented DSH/OpenBKN compatibility verification are supported. Production deployments should keep TLS verification enabled and use a least-privilege OpenBKN account.
