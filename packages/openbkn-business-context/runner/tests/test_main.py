from __future__ import annotations

import io
import json
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from openbkn_dsh_runner.__main__ import main
class FakeOsdk:
    def __init__(self) -> None:
        self.configure_calls: list[dict[str, object]] = []
        self.kn = object()

    def configure(self, **kwargs: object) -> None:
        self.configure_calls.append(kwargs)

    def call(self, _path: str, *, query: dict[str, object]) -> dict[str, object]:
        return {"entries": [], "query": query}


class RunnerMainTests(unittest.TestCase):
    def test_classifies_rejected_credentials_without_exposing_the_platform_body(self) -> None:
        class RejectedCredential(Exception):
            status = 401

        class UnauthorizedOsdk(FakeOsdk):
            def call(self, _path: str, *, query: dict[str, object]) -> dict[str, object]:
                raise RejectedCredential('{"secret":"platform diagnostic"}')

        output = io.StringIO()

        code = main(
            io.StringIO('{"version": 1, "operation": "list_knowledge_networks"}'),
            output,
            UnauthorizedOsdk(),
        )

        self.assertEqual(code, 1)
        self.assertEqual(
            json.loads(output.getvalue()),
            {
                "version": 1,
                "ok": False,
                "error": {
                    "code": "authentication_required",
                    "message": "OpenBKN authentication is required",
                },
            },
        )
        self.assertNotIn("platform diagnostic", output.getvalue())

    def test_emits_one_safe_error_response_and_resets_osdk_after_a_bad_request(self) -> None:
        output = io.StringIO()
        osdk = FakeOsdk()

        code = main(
            io.StringIO('{"version": 9, "operation": "list_knowledge_networks"}'),
            output,
            osdk,
        )

        self.assertEqual(code, 2)
        self.assertEqual(
            json.loads(output.getvalue()),
            {
                "version": 1,
                "ok": False,
                "error": {"code": "invalid_request", "message": "unsupported protocol version: 9"},
            },
        )
        self.assertEqual(osdk.configure_calls, [{}, {}])

    def test_emits_one_success_response_for_a_fixed_platform_operation(self) -> None:
        output = io.StringIO()
        osdk = FakeOsdk()

        code = main(
            io.StringIO('{"version": 1, "operation": "list_knowledge_networks"}'),
            output,
            osdk,
        )

        self.assertEqual(code, 0)
        self.assertEqual(
            json.loads(output.getvalue()),
            {"version": 1, "ok": True, "result": {"entries": [], "query": {"limit": 100}}},
        )
        self.assertEqual(osdk.configure_calls, [{}, {}])

    def test_applies_host_tls_and_timeout_policy_before_reading_platform_data(self) -> None:
        output = io.StringIO()
        osdk = FakeOsdk()

        with patch.dict(
            "os.environ",
            {
                "BKN_BASE_URL": "https://poc.openbkn.ai",
                "OPENBKN_DSH_INSECURE_TLS": "false",
                "OPENBKN_DSH_REQUEST_TIMEOUT_MS": "2500",
            },
            clear=False,
        ):
            code = main(
                io.StringIO('{"version": 1, "operation": "list_knowledge_networks"}'),
                output,
                osdk,
            )

        self.assertEqual(code, 0)
        self.assertEqual(
            osdk.configure_calls,
            [
                {"base_url": "https://poc.openbkn.ai", "insecure": False, "timeout": 2.5},
                {},
            ],
        )


if __name__ == "__main__":
    unittest.main()
