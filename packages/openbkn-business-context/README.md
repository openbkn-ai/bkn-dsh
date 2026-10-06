# bkn-dsh

Release candidate -7 consolidates the unpublished diagnostics work and supply-answer guidance. A plain Node Host reports its form as unknown because Desktop also uses Node. CI-artifact real-host and Windows acceptance remain pending; see the repository release-7 handoff.

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

For complete BOM detail with explicit row counts, the plugin checks that the final answer preserves the tool's rows, levels, quantities and units, and checks disclosed physical source names. A mismatch preserves the original answer and requests one correction; a persistent mismatch ends in an explicit error. This checks supported detail handoffs, not the correctness of business rules or platform data.

A declared complete handoff without column names receives at most one earlier producer notice, while the original Interaction remains open. It requests a labelled reprint of already cached rows, never new retrieval or guessed positions. This metadata repair is separate from the one final-answer correction; all original attempts remain in the log.

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

This -7 candidate is not on npm yet. Use the absolute path to the fixed CI candidate `.tgz` before publication; the command below applies after publication. The currently published -4 has [separate installation instructions](https://github.com/openbkn-ai/bkn-dsh/blob/v0.2.0-rc.2-openbkn.0.2.0-4/README.md).

Works on an unpatched DeepSeek Harness `0.2.0-rc.2`: the official desktop app, the npm CLI (`@deepseek-ai/dsh@0.2.0-rc.2`), or a built source checkout. Install it with DSH's own plugin manager while DSH is stopped:

```bash
dsh plugin --profile <desktop|web> add @openbkn/dsh-business-context@0.2.0-rc.2-openbkn.0.2.0-7
```

Then set the platform address, sign in with the `openbkn` CLI, and bind a network from the **OpenBKN** sidebar entry. Bound sessions must use DSH's Standard mode (PTC mode is not supported yet). Step-by-step setup, certificates, and uninstall: [repository README](https://github.com/openbkn-ai/bkn-dsh#install-and-start).

## Package layout (changed in -7)

The package root is a minimal bootstrap plugin that keeps the host serving the browser bundle. Import the business API from `@openbkn/dsh-business-context/business`; the Remote boundary types live on `@openbkn/dsh-business-context/types`. Diagnostics remains on `@openbkn/dsh-business-context/diagnostics`.

### Upgrading name-qualified overrides (required for -7)

The host treats a `name` field in a profile override as an assertion about
the row it patches. When upgrading from published versions <= -4 to `-7` the business row loads from
`@openbkn/dsh-business-context/business`, so an override that keeps the old
bare package name is skipped and its `config` is silently lost:

```yaml
# Stops matching after upgrading to -7 — baseUrl/cliPath are dropped:
- id: openbkn-business-context
  name: '@openbkn/dsh-business-context'
  config: { baseUrl: ..., cliPath: ... }
```

Fix it by deleting the `name` line (the `id` alone addresses the row), or
by asserting the new subpath name
`'@openbkn/dsh-business-context/business'`. ID-only overrides keep working
unchanged.

## Diagnostics

When something does not work, click **OpenBKN** in the sidebar footer, then **诊断** at the top right of the panel and export the report. There is only one OpenBKN sidebar entry. The panel frame and diagnostics action remain available when the business component cannot import or its services are not ready. The diagnostics service runs as an independent plugin row; if its implementation cannot start, the panel explicitly reports that diagnostics is unavailable. The exported JSON contains only whitelisted facts — stages, classification codes, bounded evidence such as HTTP statuses and exit codes, and coverage notes. It never contains tokens, raw error text, URLs, or file contents. Send the exported file to support.

## License

[Apache License 2.0](LICENSE)
