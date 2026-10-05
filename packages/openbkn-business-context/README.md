# bkn-dsh

[中文](README.zh.md)

Bring governed enterprise business knowledge into DeepSeek Harness conversations.

## Why bkn-dsh

General-purpose AI can reason fluently but often lacks the trusted business context required for real decisions. Enterprise knowledge is distributed across systems, rules, processes, metrics, and relationships, while access must remain consistent with the user's identity and permissions.

OpenBKN turns that fragmented knowledge into governed business knowledge networks. bkn-dsh makes those networks available where users already analyze and act: the DeepSeek Harness conversation experience.

## What it does

bkn-dsh connects DeepSeek Harness to OpenBKN so an authorized user can:

- sign in to OpenBKN without affecting local DSH work;
- select a business knowledge network they are allowed to access;
- analyze business questions within that network's objects, relationships, rules, and metrics;
- keep each conversation scoped to one explicit business context;
- inspect a layered provenance view per result: a local execution timeline that always renders, platform operation facts (request/trace/receipt ids) and the enterprise business graph that each degrade independently, and a receipt list with CLI verification hints.

The integration is designed as an additive DSH plugin. It preserves the native DSH conversation experience while OpenBKN remains the authority for identity, permissions, business semantics, and traceable evidence.

## Who it is for

- **Business users** who need reliable analysis without learning query languages or platform APIs.
- **Analysts and decision makers** who need to understand not only an answer, but also the business objects, relationships, indicators, and evidence behind it.
- **Enterprise AI platform teams** that need governed knowledge access without exposing unrestricted data interfaces to users or models.
- **Knowledge network owners** who want their curated business semantics to be used consistently in everyday AI workflows.

## Business value

- **More accurate analysis** — answers are grounded in explicit business semantics and current authorized data.
- **Safer enterprise adoption** — users and models operate within the selected network and the platform's permission boundary.
- **Explainable decisions** — every completed analysis can be traced to business context, execution facts, and available evidence.
- **Lower interaction cost** — users ask business questions naturally instead of navigating multiple systems or writing technical queries.
- **Reusable organizational knowledge** — governed knowledge networks become a shared decision layer across conversations and teams.

## Install

Works on an unpatched DeepSeek Harness `0.2.0-rc.2`: the official desktop app, the npm CLI (`@deepseek-ai/dsh@0.2.0-rc.2`), or a built source checkout. Install it with DSH's own plugin manager while DSH is stopped:

```bash
dsh plugin --profile <desktop|web> add @openbkn/dsh-business-context@0.2.0-rc.2-openbkn.0.2.0-5
```

Then set the platform address, sign in with the `openbkn` CLI, and bind a network from the **OpenBKN** sidebar entry. Bound sessions must use DSH's Standard mode (PTC mode is not supported yet). Step-by-step setup, certificates, and uninstall: [repository README](https://github.com/openbkn-ai/bkn-dsh#install-and-start).

## Diagnostics

When something does not work, open **OpenBKN 诊断** from the sidebar footer and export the report. The panel stays reachable even when the OpenBKN business panel cannot start: it runs as a separate plugin row that never waits on the business service. The exported JSON contains only whitelisted facts — stages, classification codes, bounded evidence such as HTTP statuses and exit codes, and coverage notes. It never contains tokens, raw error text, URLs, or file contents. Send the exported file to support; nothing else is needed.

## License

[Apache License 2.0](LICENSE)
