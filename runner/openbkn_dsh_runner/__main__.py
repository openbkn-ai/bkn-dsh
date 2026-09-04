"""One-shot JSON runner for fixed, platform-level OpenBKN OSDK reads."""

from __future__ import annotations

import json
import sys
from typing import Any, TextIO

from .operations import execute
from .protocol import PROTOCOL_VERSION, ProtocolError, decode_request


def main(stdin: TextIO = sys.stdin, stdout: TextIO = sys.stdout, osdk: Any | None = None) -> int:
    """Read one request, emit one JSON response, and clear OSDK defaults twice."""
    if osdk is None:
        import bkn_osdk as imported_osdk

        osdk = imported_osdk
    osdk.configure()
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
    except Exception:
        emit(stdout, {"version": PROTOCOL_VERSION, "ok": False, "error": {
            "code": "platform_unavailable", "message": "OpenBKN platform request failed",
        }})
        return 1
    finally:
        osdk.configure()
    emit(stdout, {"version": PROTOCOL_VERSION, "ok": True, "result": result})
    return 0


def emit(stdout: TextIO, response: dict[str, object]) -> None:
    """Write precisely one line so the Host can bound and validate it."""
    stdout.write(json.dumps(response, separators=(",", ":"), ensure_ascii=False) + "\n")
    stdout.flush()


if __name__ == "__main__":
    raise SystemExit(main())
