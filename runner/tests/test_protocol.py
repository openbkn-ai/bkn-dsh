from __future__ import annotations

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from openbkn_dsh_runner.protocol import ProtocolError, decode_request


class DecodeRequestTests(unittest.TestCase):
    def test_rejects_an_unsupported_protocol_version(self) -> None:
        with self.assertRaisesRegex(ProtocolError, "version"):
            decode_request({"version": 2, "operation": "list_knowledge_networks"})

    def test_rejects_a_caller_supplied_kn_id(self) -> None:
        with self.assertRaisesRegex(ProtocolError, "kn_id"):
            decode_request(
                {
                    "version": 1,
                    "operation": "get_knowledge_network_detail",
                    "kn_id": "caller-controlled-network",
                    "context": {"knowledge_network_id": "host-bound-network"},
                }
            )


if __name__ == "__main__":
    unittest.main()
