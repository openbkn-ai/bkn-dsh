"""One-shot JSON runner for fixed, platform-level OpenBKN OSDK reads."""

from __future__ import annotations

import json
import os
import sys
from typing import Any, TextIO

from .operations import execute
from .protocol import PROTOCOL_VERSION, ProtocolError, decode_request


def main(stdin: TextIO = sys.stdin, stdout: TextIO = sys.stdout, osdk: Any | None = None) -> int:
    """Read one request, emit one JSON response, and clear OSDK defaults twice."""
    if osdk is None:
        import bkn_osdk as imported_osdk

        osdk = imported_osdk
    configure_osdk_from_host(osdk)
    try:
        request = decode_request(json.load(stdin))
        result = execute(request, osdk)
    except ProtocolError as error:
        emit(stdout, {"version": PROTOCOL_VERSION, "ok": False, "error": {
            "code": "invalid_request", "message": str(error),
        }})
        return 2
    except (ValueError, TypeError) as error:
        emit(stdout, {"version": PROTOCOL_VERSION, "ok": False, "error": {
            "code": "operation_failed", "message": str(error),
        }})
        return 1
    except Exception as error:
        status = getattr(error, "status", None)
        response = getattr(error, "response", None)
        if status is None:
            status = getattr(response, "status_code", None)
        if status in {401, 403}:
            emit(stdout, {"version": PROTOCOL_VERSION, "ok": False, "error": {
                "code": "authentication_required",
                "message": "OpenBKN authentication is required",
            }})
            return 1
        emit(stdout, {"version": PROTOCOL_VERSION, "ok": False, "error": {
            "code": "platform_unavailable", "message": "OpenBKN platform request failed",
        }})
        return 1
    finally:
        osdk.configure()
    emit(stdout, {"version": PROTOCOL_VERSION, "ok": True, "result": result})
    return 0


def configure_osdk_from_host(osdk: Any) -> None:
    """Apply only Host-owned transport policy; the CLI store still supplies credentials."""
    base_url = os.environ.get("BKN_BASE_URL")
    insecure = os.environ.get("OPENBKN_DSH_INSECURE_TLS")
    timeout_ms = os.environ.get("OPENBKN_DSH_REQUEST_TIMEOUT_MS")
    if base_url is None and insecure is None and timeout_ms is None:
        osdk.configure()
        return

    options: dict[str, object] = {}
    if base_url is not None:
        options["base_url"] = base_url
    if insecure is not None:
        if insecure not in {"true", "false"}:
            raise ValueError("invalid OpenBKN TLS policy")
        options["insecure"] = insecure == "true"
    if timeout_ms is not None:
        timeout = float(timeout_ms) / 1000
        if timeout <= 0:
            raise ValueError("invalid OpenBKN timeout")
        options["timeout"] = timeout
    osdk.configure(**options)


def emit(stdout: TextIO, response: dict[str, object]) -> None:
    """Write precisely one line so the Host can bound and validate it."""
    stdout.write(json.dumps(response, separators=(",", ":"), ensure_ascii=False) + "\n")
    stdout.flush()


if __name__ == "__main__":
    raise SystemExit(main())
