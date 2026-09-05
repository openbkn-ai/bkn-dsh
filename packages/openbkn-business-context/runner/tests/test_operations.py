from __future__ import annotations

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from openbkn_dsh_runner.operations import execute
from openbkn_dsh_runner.protocol import Request


class FakeOsdk:
    def __init__(self) -> None:
        self.calls: list[tuple[str, dict[str, object]]] = []

    def call(self, path: str, *, query: dict[str, object]) -> dict[str, object]:
        self.calls.append((path, query))
        if path.endswith("/kn-supply"):
            return {"result": {"id": "kn-supply", "name": "Supply risk"}}
        return {"entries": [{"id": "kn-supply", "name": "Supply risk"}]}


class ExecuteTests(unittest.TestCase):
    def test_lists_networks_only_through_the_fixed_platform_route(self) -> None:
        osdk = FakeOsdk()

        response = execute(Request(version=1, operation="list_knowledge_networks"), osdk)

        self.assertEqual(response, {"entries": [{"id": "kn-supply", "name": "Supply risk"}]})
        self.assertEqual(
            osdk.calls,
            [("/api/ontology-manager/v1/knowledge-networks", {"limit": 100})],
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
        self.assertEqual(
            osdk.calls,
            [("/api/ontology-manager/v1/knowledge-networks/kn-supply", {})],
        )

    def test_reads_one_interaction_operations_only_for_the_host_bound_interaction(self) -> None:
        osdk = FakeOsdk()
        request = Request(
            version=1,
            operation="get_interaction_operations",
            context={"interaction_id": "int-123"},
        )

        execute(request, osdk)

        self.assertEqual(
            osdk.calls,
            [("/api/agent-observability/v1/interactions/int-123/operations", {})],
        )

    def test_reads_one_enterprise_interaction_projection_only_for_the_host_bound_interaction(self) -> None:
        class ProvenanceOsdk(FakeOsdk):
            def call(self, path: str, *, query: dict[str, object]) -> dict[str, object]:
                self.calls.append((path, query))
                return {"result": {
                    "interaction_id": "int-123",
                    "operations": [{
                        "operation_id": "op-1", "attempt": 1, "tool_name": "query_object_instance",
                        "status": "resolved", "call_status": "completed", "protocol": "mcp",
                        "knowledge_network_id": "kn-supply",
                        "input": {"large": "must-not-cross-the-runner-boundary"},
                        "output": {"large": "must-not-cross-the-runner-boundary"},
                        "elements": [{"kind": "object", "id": "supplier", "name": "Supplier"}],
                    }],
                    "context_relations": [{
                        "id": "rel-1", "knowledge_network_id": "kn-supply", "name": "supplies",
                        "source_object_id": "supplier", "target_object_id": "material",
                    }],
                }}

        osdk = ProvenanceOsdk()
        request = Request(version=1, operation="get_interaction_business_provenance", context={"interaction_id": "int-123"})

        response = execute(request, osdk)

        self.assertEqual(
            osdk.calls,
            [("/api/agent-observability/v1/business-provenance/interactions/int-123", {})],
        )
        self.assertNotIn("input", response["operations"][0])
        self.assertNotIn("output", response["operations"][0])
        self.assertEqual(response["operations"][0]["elements"], [{"kind": "object", "id": "supplier", "name": "Supplier"}])
        self.assertEqual(response["context_relations"][0]["source_object_id"], "supplier")

    def test_rejects_an_unknown_operation(self) -> None:
        with self.assertRaisesRegex(ValueError, "unsupported operation"):
            execute(Request(version=1, operation="run_sql"), FakeOsdk())


if __name__ == "__main__":
    unittest.main()
