"""The small, auditable platform-level operation catalogue."""

from __future__ import annotations

from typing import Any, Protocol

from .protocol import Request

KNOWLEDGE_NETWORKS_PATH = "/api/bkn-backend/v1/knowledge-networks"
INTERACTIONS_PATH = "/api/agent-observability/v1/interactions"
BUSINESS_PROVENANCE_PATH = "/api/agent-observability/v1/business-provenance/interactions"


class PlatformOsdk(Protocol):
    """The exact subset of platform-level OSDK used by this runner slice."""

    kn: Any

    def call(self, path: str, *, query: dict[str, object]) -> dict[str, object]: ...


def execute(request: Request, osdk: PlatformOsdk) -> dict[str, object]:
    """Execute exactly one supported platform operation."""
    if request.operation == "list_knowledge_networks":
        return osdk.call(KNOWLEDGE_NETWORKS_PATH, query={"limit": 100})
    if request.operation == "get_knowledge_network_detail":
        network_id = request.context.get("knowledge_network_id")
        if network_id is None:
            raise ValueError("get_knowledge_network_detail requires host-bound network context")
        return unwrap_result(osdk.kn.get_kn_detail(network_id, detail_level="summary"))
    if request.operation in {"get_interaction_operations", "get_interaction_business_provenance"}:
        interaction_id = request.context.get("interaction_id")
        if interaction_id is None:
            raise ValueError(f"{request.operation} requires host-bound interaction context")
        path = (
            f"{INTERACTIONS_PATH}/{interaction_id}/operations"
            if request.operation == "get_interaction_operations"
            else f"{BUSINESS_PROVENANCE_PATH}/{interaction_id}"
        )
        response = unwrap_result(osdk.call(path, query={}))
        return project_business_provenance(response) if request.operation == "get_interaction_business_provenance" else response
    raise ValueError(f"unsupported operation: {request.operation}")


def unwrap_result(value: Any) -> dict[str, object]:
    """Normalize the current OSDK envelope without inventing any data."""
    if isinstance(value, dict) and isinstance(value.get("result"), dict):
        return value["result"]
    if isinstance(value, dict):
        return value
    raise ValueError("OSDK returned a non-object response")


def project_business_provenance(value: dict[str, object]) -> dict[str, object]:
    """Copy only the formal projection fields consumed by the DSH Host.

    Raw input/output payload envelopes can be large and are not rendered by
    this plugin. Keeping them behind the Python trust boundary prevents raw
    MCP data from entering DSH while preserving the EE resolver's facts.
    """
    projected: dict[str, object] = {}
    copy_if_present(value, projected, "interaction_id")
    projected["operations"] = project_records(value.get("operations"), (
        "operation_id", "attempt", "tool_name", "knowledge_network_id",
        "status", "call_status", "protocol", "started_at", "finished_at",
        "request_id", "trace_id", "receipt_id", "missing_facts",
    ), nested={"elements": (
        "kind", "id", "name", "parent_id", "field",
    )})
    for field, allowed in (
        ("conversation_context", ("knowledge_network_id", "source_interaction_id", "source_operation_id")),
        ("derived_facts", ("rule", "source_operation_id", "operation_id", "element_id")),
        ("context_relations", ("id", "knowledge_network_id", "name", "source_object_id", "target_object_id")),
    ):
        if field in value:
            projected[field] = project_records(value.get(field), allowed)
    return projected


def project_records(
    value: object,
    allowed: tuple[str, ...],
    *,
    nested: dict[str, tuple[str, ...]] | None = None,
) -> list[dict[str, object]]:
    """Project dictionaries without interpreting or inventing values."""
    if not isinstance(value, list):
        return []
    result: list[dict[str, object]] = []
    for item in value:
        if not isinstance(item, dict):
            continue
        target: dict[str, object] = {}
        for field in allowed:
            copy_if_present(item, target, field)
        for field, child_allowed in (nested or {}).items():
            if field in item:
                target[field] = project_records(item.get(field), child_allowed)
        result.append(target)
    return result


def copy_if_present(source: dict[str, object], target: dict[str, object], field: str) -> None:
    """Preserve an explicit server value, including false, zero, or null."""
    if field in source:
        target[field] = source[field]
