# get_kn_detail output schema rejects the documented navigation-shell response

Status: filed on 2026-10-12 as [openbkn-ai/bkn-foundry#2106](https://github.com/openbkn-ai/bkn-foundry/issues/2106). Platform fix and live acceptance remain open.

## Summary

On the 0.2.0 preparation snapshot, `get_kn_detail` intentionally returns a navigation shell for a network with more than 200 object types or more than 600 relation types. The response sets `object_types`, `relation_types`, and `action_types` to JSON null. The MCP output schema still declares these fields as arrays only.

This is a response/schema mismatch, not a request to restore the full concept payload or change network authorization.

## Fixed source

- Commit: `06c5a8786a81f3ef4601f00b1e3ba4f3b9f6988a`, checked on 2026-10-12. This is preparation source, not a live 0.2.0 acceptance result.
- [Documented navigation-shell behavior](https://github.com/openbkn-ai/bkn-foundry/blob/06c5a8786a81f3ef4601f00b1e3ba4f3b9f6988a/docs/api/context-loader/kn-explore.yaml#L109).
- [Thresholds and ReduceToNavigationShell](https://github.com/openbkn-ai/bkn-foundry/blob/06c5a8786a81f3ef4601f00b1e3ba4f3b9f6988a/adp/context-loader/agent-retrieval/server/interfaces/driven_bkn_backend.go#L370).
- [REST handler applies the navigation shell](https://github.com/openbkn-ai/bkn-foundry/blob/06c5a8786a81f3ef4601f00b1e3ba4f3b9f6988a/adp/context-loader/agent-retrieval/server/driveradapters/knquerytools/index.go#L180).
- [MCP handler applies the same branch](https://github.com/openbkn-ai/bkn-foundry/blob/06c5a8786a81f3ef4601f00b1e3ba4f3b9f6988a/adp/context-loader/agent-retrieval/server/driveradapters/mcp/tools.go#L672).
- [Array-only MCP output schema](https://github.com/openbkn-ai/bkn-foundry/blob/06c5a8786a81f3ef4601f00b1e3ba4f3b9f6988a/adp/context-loader/agent-retrieval/server/driveradapters/mcp/schemas/get_kn_detail.json).

## Minimal source-level reproduction

No deployment, account, token, network access, or dependency installation is needed. Save this script and run it with the repository root as the only argument, using the fixed snapshot above.

```python
import json
import sys
from pathlib import Path

root = Path(sys.argv[1])
path = root / "adp/context-loader/agent-retrieval/server/driveradapters/mcp/schemas/get_kn_detail.json"
schema = json.loads(path.read_text(encoding="utf-8"))["output_schema"]

# Constructed from KnowledgeNetworkDetail.ReduceToNavigationShell.
# This is a controlled example, not a captured live response.
shell = {
    "id": "kn-controlled",
    "name": "Controlled network",
    "concept_groups": [],
    "object_types": None,
    "relation_types": None,
    "action_types": None,
    "object_type_count": 201,
    "relation_type_count": 2,
    "action_type_count": 1,
    "notice": "Controlled navigation-shell example",
}

for field in ("object_types", "relation_types", "action_types"):
    declared = schema["properties"][field]["type"]
    allowed = [declared] if isinstance(declared, str) else declared
    compatible = "null" in allowed
    print(f"{field}: response=null, declared={declared}, compatible={compatible}")
    assert shell[field] is None
    assert compatible, f"{field}: documented navigation-shell null is not allowed"
```

At the fixed snapshot, the first field declares `array`, prints `compatible=False`, and the assertion fails. This checks the direct type declaration only; it does not claim to be a general-purpose JSON Schema validator or a live MCP reproduction.

## Expected behavior

The published schema accepts both ordinary concept arrays and the documented null fields of the navigation shell. The shell remains distinguishable from an empty network through its counts/navigation information. REST and MCP documentation agree with the serialized response.

## Impact and evidence boundary

Strict clients can reject a legitimate large-network response. The current bkn-dsh optional profile parser also rejects this new shape; plugin-side parsing adaptation is tracked separately. Its binding caller catches that failure and continues binding, so this report does not claim that all large-network bindings or queries fail.

The source mismatch is confirmed. No deployed 0.2.0 MCP exchange or strict-client failure was captured for this draft. Live acceptance will follow the formal platform and SDK release.

## Minimal suggested fix and validation

- Allow array or null for the three fields in the shared output contract, preserving the ordinary array item schemas.
- Reconcile any corresponding OpenAPI definitions that advertise the same response.
- Add contract coverage for normal arrays and navigation-shell nulls, including object-type 200/201 and relation-type 600/601 boundaries and both summary/full levels.
- Check that `tools/list`, `/mcp/info`, the handler's structured response, and documentation agree; do not replace nulls with fabricated empty arrays or reintroduce full-network enumeration.

The issue does not request changes to MCP profiles, tool authorization, business calculations, licensing, or client credential management.
