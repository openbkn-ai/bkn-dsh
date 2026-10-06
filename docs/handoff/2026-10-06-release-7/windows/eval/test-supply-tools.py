"""Regression checks for evidence redaction and exhaustive BOM comparison."""
import importlib.util
import json
from pathlib import Path
import tempfile
from types import SimpleNamespace
import unittest
from unittest.mock import patch


def load(name):
    spec = importlib.util.spec_from_file_location(name, Path(__file__).with_name(name + ".py"))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


export = load("export-supply-session")
verify = load("verify-supply-answer")


class EvidenceRedactionTests(unittest.TestCase):
    def test_short_and_alias_credentials_in_structured_results(self):
        result = export.redact({"password": "pw1", "accessToken": "short", "api-key": "tiny", "material_code": "382-000005", "available_qty": 34})
        self.assertEqual(result["password"], "[REDACTED]")
        self.assertEqual(result["accessToken"], "[REDACTED]")
        self.assertEqual(result["api-key"], "[REDACTED]")
        self.assertEqual(result["available_qty"], 34)
        self.assertEqual(result["material_code"], "382-000005")

    def test_credentials_in_json_and_python_repr_keep_business_values(self):
        for text in ['{"password": "pw1", "available_qty": 34}', "{'refreshToken': 'tiny', 'available_qty': 34}"]:
            result = export.redact(text)
            self.assertNotIn("pw1", result)
            self.assertNotIn("tiny", result)
            self.assertIn("34", result)

    def test_bearer_and_url_credentials_are_redacted(self):
        value = "Bearer short https://user:pw1@platform.example/path?token=tiny&kn_id=supply_ontology_hand"
        result = export.redact(value)
        for secret in ["short", "user:pw1", "tiny"]:
            self.assertNotIn(secret, result)
        self.assertIn("kn_id=supply_ontology_hand", result)

    def test_original_question_and_nonsecret_sources_keep_their_bytes(self):
        value = {"question": "382-000005 的标准交期？", "source": "https://github.com/openbkn-ai/bkn-dsh/blob/54f6669/docs/eval/supply-ontology.yaml", "quantity": 1}
        self.assertEqual(export.redact(value), value)

    def test_markdown_and_json_exports_use_the_same_redacted_answer(self):
        data = json.dumps({"type": "assistant/message", "data": {"message": {
            "content": [{"type": "text", "text": '{"password": "pw1", "available_qty": 34}'}]
        }}}).encode()
        with tempfile.TemporaryDirectory() as folder:
            output = Path(folder) / "answer"
            with patch("sys.argv", ["export", "session/session.v4.jsonl.zstd", "--output", str(output)]), \
                 patch.object(export.subprocess, "run", return_value=SimpleNamespace(stdout=data)), \
                 patch("builtins.print"):
                export.main()
            answer = output.with_suffix(".md").read_text()
            record = json.loads(output.with_suffix(".json").read_text())
            self.assertNotIn("pw1", answer)
            self.assertEqual(answer.rstrip(), record["assistantText"][-1])


class BomComparisonTests(unittest.TestCase):
    def test_explicit_level_sections_preserve_each_delivered_level(self):
        answer = '''### 第 3 层
| 父件 | 子件编码 | 子件名称 | 单耗 | 可用量 | 单位 |
|---|---|---|---|---|---|
| 791-000003 | 588-000649 | test | 1 | 0* | ? |
### 第 4 层
| 父件 | 子件编码 | 子件名称 | 单耗 | 可用量 | 单位 |
|---|---|---|---|---|---|
| 795-000993 | 588-000649 | test | 1 | 200 | 个 |
'''
        rows = verify.rows_from_markdown(answer)
        self.assertEqual(len(rows), 2)
        self.assertEqual([r[0] for r in rows], [3, 4])
        self.assertEqual([r[1] for r in rows], ['791-000003', '795-000993'])

    def test_unlabelled_tables_cannot_inherit_an_unrelated_section_level(self):
        answer = '''### 第 3 层
### 库存摘要
| 父件 | 子件编码 | 子件名称 | 单耗 | 可用量 |
|---|---|---|---|---|
| 791-000003 | 588-000649 | test | 1 | 0 |
'''
        self.assertEqual(verify.rows_from_markdown(answer), [])

    def test_explicit_no_row_and_scoped_zero_are_understood(self):
        self.assertEqual(verify.number("NO_ROW"), 0)
        self.assertEqual(verify.number("无库存行"), 0)
        with self.assertRaises(ValueError):
            verify.number("未知")


if __name__ == "__main__":
    unittest.main()
