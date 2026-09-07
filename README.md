# bkn-dsh

[中文](README.zh.md)

Bring governed OpenBKN business knowledge into native DeepSeek Harness conversations.

## Why

Enterprise decisions rely on trusted business objects, metrics, rules, relationships, and permission-aware evidence. General-purpose chat alone does not provide that governed context.

`bkn-dsh` is an additive DeepSeek Harness plugin. It keeps the native DSH workflow intact while OpenBKN remains the authority for identity, permissions, business semantics, and trace data.

## Who it serves and the value it provides

- **Business users and analysts** ask natural-language questions within an authorized business knowledge network, without learning platform APIs or query languages.
- **Knowledge-network owners** get consistent reuse of their curated semantics, functions, and metrics.
- **Enterprise AI platform teams** retain explicit scope and least-privilege access instead of exposing unconstrained data interfaces to a model.

The result is faster access to grounded business insight, with a clear network boundary and platform-backed provenance where the platform provides it.

## Current capabilities

- OpenBKN CLI sign-in with Host-side credential synchronization; a manual-token fallback is available for deployments without the CLI.
- Automatic configuration and connection testing of the OpenBKN Context Loader MCP.
- An authorized knowledge-network directory with local search, workspace status, and incremental loading.
- One local DSH workspace per OpenBKN knowledge network. Native sessions created in that workspace inherit its binding.
- Managed business sessions: a stable `conversation_id` per DSH session and one OpenBKN `interaction_id` per user question.
- Scoped agent guidance and governed OpenBKN MCP access, including published business functions and a read-only `run_code` fallback.
- Per-turn business provenance. Execution facts always render when returned; context graphs and evidence render only from formal OpenBKN projection DTOs, never inferred from model text or raw MCP output.

## Prerequisites

1. A compatible DeepSeek Harness Web profile. This package currently targets the DSH `0.1.2-rc.1` plugin peer set.
2. An OpenBKN platform URL reachable from the DSH Host, and an account permitted to read the target business knowledge networks and use the Context Loader MCP.
3. For the recommended sign-in flow, the OpenBKN CLI must be installed and available on the Host `PATH`. A manual platform token can be used when CLI login is unavailable.
4. For a source installation, Node.js and pnpm are required by both repositories.

## Install from this repository

The following is a local developer installation. Replace the paths with your own checkout locations.

1. Build the plugin:

   ```bash
   cd /path/to/bkn-dsh
   pnpm install
   pnpm --filter @openbkn/dsh-business-context build
   ```

2. Add the package to the DSH Web profile:

   ```bash
   cd /path/to/deepseek-harness
   pnpm dsh plugin --profile web add file:/path/to/bkn-dsh/packages/openbkn-business-context
   ```

3. Configure the platform URL in `~/.dsh/profiles/web/cordis.patch.yml`. The plugin row is added by the preceding command; add its `config` block if it is absent:

   ```yaml
   - id: openbkn-business-context
     config:
       baseUrl: http://localhost:8081
       # Optional only when the CLI is not on PATH:
       # cliPath: /absolute/path/to/openbkn
       # Optional only for a non-standard Context Loader endpoint:
       # mcpUrl: https://openbkn.example/api/agent-retrieval/v1/mcp/
   ```

   `baseUrl` is required. The default MCP endpoint is derived as `/api/agent-retrieval/v1/mcp/`; do not put an OpenBKN token in this YAML file.

4. Restart the DSH Web profile so it loads the updated plugin and configuration.

## First connection and daily use

1. In DSH, select **OpenBKN** from the sidebar.
2. Choose **Use OpenBKN CLI login and sync**, complete the local CLI login, and let the plugin synchronize the credential and verify the Context Loader MCP. For a CLI-free deployment, expand **Manual token** and choose **Save and test connection** instead.
3. Search the authorized network directory and expand a network row.
4. Select **Create workspace** for a network without a local workspace. Choose **Continue conversation** or **New conversation** for an associated workspace.
5. Ask business questions in the native DSH conversation. Every new session in that workspace inherits the same knowledge-network binding.
6. After a completed answer, open its **Business provenance** entry to inspect the OpenBKN execution facts and any platform-projected context graph or evidence.

## Operational boundaries

- A local workspace maps to exactly one business knowledge network. Use another workspace to work with another network.
- DSH local work continues to function if OpenBKN is unavailable or the user is not signed in.
- The plugin does not fabricate provenance. If OpenBKN has not returned a formal graph or evidence projection, the corresponding view remains empty.
- Tokens are kept in DSH credentials or the local CLI credential store, not in conversation history, prompts, browser state, or the profile YAML.

## License

[Apache License 2.0](LICENSE)
