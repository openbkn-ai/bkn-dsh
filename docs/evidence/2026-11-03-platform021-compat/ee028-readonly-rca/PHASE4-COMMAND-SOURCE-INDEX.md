# Phase 4 command/source index

Private handoff: ops/private/original-artifact-metadata.json, mode0600 under0700 directory, ignored by Git. It contains only authorized original artifact/request/trace/account/owner metadata; no content, content_json, content_hash or credentials. Do not print its values.

Native OpenSearch GETs used the existing target Service and an owned localhost-only temporary port-forward. Each request used an explicit _source metadata allowlist; complete redacted request classes/source selectors are in stage4-recovery-preflight.json. Artifact/trace selector values are intentionally withheld in public evidence.

- Target receipt query: configured bkn-trace-core alias, exact target I + exists receipt_id, size16, total6.
- Artifact lookup: configured bkn-trace-evidence-v2-artifacts/_doc/<real original artifact ID>, one per question/result; only lifecycle/owner/ref metadata requested.
- Original trace aggregate lookup: configured evidence index, aggregate ID derived exactly as sha256(trace-aggregate + NUL + actual trace ID), metadata-only _source.
- Necessary fallback for each absent aggregate: same index, exact trace_id term, size16. Source selection includes event identity/type and artifact-link metadata fields only, never events body or arbitrary payload.
- No application artifact API/EnsureIndex. No new credentials or server-side security/role dump.

Fixed source interpretation (not runtime source pin): Core81d opensearchcoreprojection/source.go552-612, evidencevo/summary.go301-319,474-500,637-638,831-847 and evidencevo/artifact.go328-347. Original artifact IDs/types were checked only against fixed contract syntax/role definitions; this is not a full NormalizeArtifact/native import validation.

The independent source task privately verified original scalar content hashes using fixed artifact.go214-229,247-254; public evidence retains match booleans only. Ops did not reread original content.
