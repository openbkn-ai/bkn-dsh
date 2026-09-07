# bkn-dsh

[中文](README.zh.md)

Bring governed OpenBKN business knowledge into DeepSeek Harness conversations.

## Why

Enterprise decisions need trusted business objects, metrics, rules, relationships, and permission-aware evidence. General-purpose chat alone does not provide that governed context.

## What

bkn-dsh is an additive DeepSeek Harness plugin that lets authorized users select one OpenBKN business knowledge network for a conversation, analyze within that explicit scope, and inspect available business provenance for each completed answer.

## Who it serves

- Business users and analysts who need explainable, governed analysis.
- Knowledge-network owners who want their business semantics reused consistently.
- Enterprise AI platform teams that need least-privilege knowledge access without exposing unrestricted data interfaces.

## Business value

- Grounds analysis in authorized business semantics and current platform data.
- Keeps each conversation in one explicit, immutable knowledge-network scope.
- Preserves native DeepSeek Harness workflows while adding traceable OpenBKN context.
- Reduces the cost of reaching trusted business insight without requiring query-language expertise.

The published package README contains the same product overview for package consumers.

## Install and start

Install bkn-dsh through the native DeepSeek Harness plugin manager:

```bash
pnpm dsh plugin --profile web add @openbkn/dsh-business-context
```

Restart DSH Web. In the Web UI, select **OpenBKN** in the sidebar, enter the platform address, and authenticate through the guided OpenBKN flow. The plugin stores the platform address as a non-sensitive DSH setting and keeps the token in DSH credentials. It then tests the MCP connection, lists the networks visible to the signed-in user, and lets the user continue or create a conversation in that network's associated local workspace.

No OpenBKN token belongs in a Cordis YAML file.

## DSH compatibility

This version needs the three compatibility capabilities described in [the RC compatibility package](compat/dsh-0.1.2-rc.1/README.md) when it is used with a source build of DSH `dsh-v0.1.2-rc.1`. The package is intentionally fail-closed: it supports only that exact clean source revision, never a desktop bundle or a different DSH version. Apply and verify the compatibility package before installing the plugin, then build DSH normally.

Later DSH releases that provide these capabilities upstream do not need this patch package.
