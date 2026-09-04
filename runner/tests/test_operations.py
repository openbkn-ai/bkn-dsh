from __future__ import annotations

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from openbkn_dsh_runner.operations import execute
from openbkn_dsh_runner.protocol import Request


class FakeKn:
    def __init__(self) -> None:
        self.detail_calls: list[tuple[str, str]] = []

    def get_kn_detail(self, network_id: str, *, detail_level: str) -> dict[str, object]:
        self.detail_calls.append((network_id, detail_level))
        return {"result": {"id": network_id, "name": "Supply risk"}}


class FakeOsdk:
    def __init__(self) -> None:
        self.calls: list[tuple[str, dict[str, object]]] = []
        self.kn = FakeKn()

    def call(self, path: str, *, query: dict[str, object]) -> dict[str, object]:
        self.calls.append((path, query))
        return {"entries": [{"id": "kn-supply", "name": "Supply risk"}]}


class ExecuteTests(unittest.TestCase):
    def test_lists_networks_only_through_the_fixed_platform_route(self) -> None:
        osdk = FakeOsdk()

        response = execute(Request(version=1, operation="list_knowledge_networks"), osdk)

        self.assertEqual(response, {"entries": [{"id": "kn-supply", "name": "Supply risk"}]})
        self.assertEqual(
            osdk.calls,
            [("/api/bkn-backend/v1/knowledge-networks", {"limit": 100})],
        )

    def test_reads_detail_only_for_the_host_bound_network(self) -> None:
        osdk = FakeOsdk()
        request = Request(
            version=1,
            operation="get_knowledge_network_detail",
            context={"knowledge_network_id": "kn-supply"},
        )

        response = execute(request, osdk)

        self.assertEqual(response, {"id": "kn-supply", "name": "Supply risk"})
        self.assertEqual(osdk.kn.detail_calls, [("kn-supply", "summary")])

    def test_rejects_an_unknown_operation(self) -> None:
        with self.assertRaisesRegex(ValueError, "unsupported operation"):
            execute(Request(version=1, operation="run_sql"), FakeOsdk())


if __name__ == "__main__":
    unittest.main()
