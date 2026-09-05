"""Versioned stdin/stdout protocol for the private DSH runner boundary."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

PROTOCOL_VERSION = 1


class ProtocolError(ValueError):
    """A caller sent a request outside the controlled runner protocol."""


@dataclass(frozen=True)
class Request:
    """A fixed runner operation plus Host-derived network context."""

    version: int
    operation: str
    context: dict[str, str] = field(default_factory=dict)


def decode_request(value: Any) -> Request:
    """Validate one JSON-decoded private runner request."""
    if not isinstance(value, dict):
        raise ProtocolError("request must be a JSON object")
    if "kn_id" in value:
        raise ProtocolError("caller-supplied kn_id is not allowed")
    allowed = {"version", "operation", "context"}
    unknown = set(value) - allowed
    if unknown:
        raise ProtocolError(f"unsupported request field: {sorted(unknown)[0]}")
    if value.get("version") != PROTOCOL_VERSION:
        raise ProtocolError(f"unsupported protocol version: {value.get('version')!r}")
    operation = value.get("operation")
    if not isinstance(operation, str) or not operation:
        raise ProtocolError("operation must be a non-empty string")
    context = value.get("context", {})
    if not isinstance(context, dict) or set(context) - {"knowledge_network_id", "interaction_id"}:
        raise ProtocolError("context contains unsupported fields")
    network_id = context.get("knowledge_network_id")
    interaction_id = context.get("interaction_id")
    if network_id is not None and (not isinstance(network_id, str) or not network_id.strip()):
        raise ProtocolError("context.knowledge_network_id must be a non-empty string")
    if interaction_id is not None and (not isinstance(interaction_id, str) or not interaction_id.strip()):
        raise ProtocolError("context.interaction_id must be a non-empty string")
    if network_id is not None and interaction_id is not None:
        raise ProtocolError("context may contain only one bound identity")
    return Request(
        version=PROTOCOL_VERSION,
        operation=operation,
        context=(
            {"knowledge_network_id": network_id.strip()}
            if network_id is not None
            else {"interaction_id": interaction_id.strip()}
            if interaction_id is not None
            else {}
        ),
    )
