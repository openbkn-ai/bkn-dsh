"""The small, auditable platform-level operation catalogue."""

from __future__ import annotations

from typing import Any, Protocol

from .protocol import Request

KNOWLEDGE_NETWORKS_PATH = "/api/bkn-backend/v1/knowledge-networks"


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
    raise ValueError(f"unsupported operation: {request.operation}")


def unwrap_result(value: Any) -> dict[str, object]:
    """Normalize the current OSDK envelope without inventing any data."""
    if isinstance(value, dict) and isinstance(value.get("result"), dict):
        return value["result"]
    if isinstance(value, dict):
        return value
    raise ValueError("OSDK returned a non-object response")
