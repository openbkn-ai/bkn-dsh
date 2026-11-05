"""Focused, offline regression checks for the source-schema projection tool.

Run: python3 -B -m unittest discover -s tests -p 'test_capture_context_loader020.py'
No Go toolchain, source checkout, platform, or model is required.
"""
import argparse
import copy
import importlib.util
import io
import json
import subprocess
import sys
import tempfile
import unittest
from contextlib import redirect_stdout
from datetime import datetime, timedelta, timezone
from pathlib import Path
from unittest.mock import patch


SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "capture-context-loader020.py"


def load_capture():
    spec = importlib.util.spec_from_file_location("capture_context_loader020", SCRIPT)
    module = importlib.util.module_from_spec(spec)
    with patch.object(sys, "dont_write_bytecode", True):
        spec.loader.exec_module(module)
    return module


capture = load_capture()


class StructuralProjectionTests(unittest.TestCase):
    def test_data_properties_named_like_annotations_survive_schema_maps(self):
        for keyword in ("properties", "patternProperties", "$defs", "definitions", "dependentSchemas"):
            with self.subTest(keyword=keyword):
                schema = {
                    "type": "object",
                    keyword: {
                        name: {"type": "string", "description": "schema annotation", "title": "schema title"}
                        for name in ("description", "title", "examples", "$comment")
                    },
                    "description": "root annotation",
                }
                projected = capture.structural(schema)
                self.assertEqual(projected, {
                    "type": "object",
                    keyword: {name: {"type": "string"} for name in ("description", "title", "examples", "$comment")},
                })

    def test_release_output_description_fields_are_retained_at_their_real_depth(self):
        for tool, collection in (("list_knowledge_networks", "entries"), ("list_skills", "entries"), ("search_capabilities", "capabilities")):
            with self.subTest(tool=tool):
                schema = {"type": "object", "properties": {collection: {"type": "array", "items": {
                    "type": "object", "properties": {"description": {"type": "string", "description": "field documentation"}},
                }}}}
                projected = capture.structural(schema)
                self.assertEqual(projected["properties"][collection]["items"]["properties"], {"description": {"type": "string"}})
                self.assertNotIn("required", projected["properties"][collection]["items"])

    def test_literal_data_and_unknown_extensions_are_not_schema_positions(self):
        data = {"description": "business text", "title": "business title", "examples": [1, 2], "$comment": "business comment",
                "properties": {"description": {"title": "still data"}}}
        schema = {"const": data, "enum": [data, {"description": "second"}], "default": data,
                  "x-vendor-data": data, "description": "schema annotation"}
        before = copy.deepcopy(schema)
        projected = capture.structural(schema)
        self.assertEqual(projected, {key: value for key, value in schema.items() if key != "description"})
        self.assertEqual(schema, before, "projection must not mutate the caller's source")

    def test_single_schema_keywords_recurse_into_nested_schemas(self):
        for keyword in ("additionalProperties", "additionalItems", "unevaluatedProperties", "unevaluatedItems",
                        "contains", "propertyNames", "not", "if", "then", "else", "contentSchema"):
            with self.subTest(keyword=keyword):
                self.assertEqual(capture.structural({keyword: {"type": "integer", "description": "docs"}}),
                                 {keyword: {"type": "integer"}})
        nested = {"items": {"type": "object", "properties": {"description": {"type": "string", "$comment": "docs"}}}}
        self.assertEqual(capture.structural(nested), {"items": {"type": "object", "properties": {"description": {"type": "string"}}}})

    def test_schema_arrays_and_legacy_tuple_items_keep_order(self):
        for keyword in ("allOf", "anyOf", "oneOf", "prefixItems", "items"):
            with self.subTest(keyword=keyword):
                schema = {keyword: [{"type": "string", "description": "first"}, {"type": "number", "title": "second"}, False]}
                self.assertEqual(capture.structural(schema), {keyword: [{"type": "string"}, {"type": "number"}, False]})

    def test_legacy_dependencies_distinguish_schemas_from_property_name_arrays(self):
        schema = {
            "dependencies": {
                "description": {"description": "schema docs", "properties": {"title": {"type": "integer", "title": "docs"}}},
                "title": ["description", "$comment"],
                "examples": False,
            },
            "dependentRequired": {"description": ["title", "examples"]},
            "required": ["description", "title"],
        }
        expected = copy.deepcopy(schema)
        expected["dependencies"]["description"] = {"properties": {"title": {"type": "integer"}}}
        self.assertEqual(capture.structural(schema), expected)

    def test_annotation_only_changes_compare_equal(self):
        left = {"type": "object", "description": "old", "title": "old", "$comment": "old", "examples": [{"description": "old"}],
                "properties": {"value": {"type": "string", "description": "old nested"}}}
        right = {"type": "object", "description": "new", "title": "new", "$comment": "new", "examples": [{"description": "new"}],
                 "properties": {"value": {"type": "string", "description": "new nested"}}}
        self.assertEqual(capture.structural(left), capture.structural(right))

    def test_type_required_and_literal_data_changes_remain_visible(self):
        original = {"type": "object", "properties": {"description": {"type": "string"}}, "required": ["description"],
                    "enum": [{"description": "a"}, {"description": "b"}], "default": {"title": "a"}}
        variants = []
        changed = copy.deepcopy(original); changed["properties"]["description"]["type"] = "number"; variants.append(changed)
        changed = copy.deepcopy(original); changed["required"] = []; variants.append(changed)
        changed = copy.deepcopy(original); changed["enum"].reverse(); variants.append(changed)
        changed = copy.deepcopy(original); changed["default"]["title"] = "b"; variants.append(changed)
        for changed in variants:
            with self.subTest(changed=changed):
                self.assertNotEqual(capture.structural(original), capture.structural(changed))

    def test_boolean_null_and_unrecognized_values_are_not_replaced(self):
        for value in (True, False, None, "not a schema", 3):
            with self.subTest(value=value):
                self.assertEqual(capture.structural(value), value)


class CaptureLifecycleTests(unittest.TestCase):
    def test_import_has_no_argument_source_process_or_output_side_effects(self):
        forbidden = AssertionError("import must not access capture inputs or execute the capture")
        with patch.object(argparse.ArgumentParser, "parse_args", side_effect=forbidden), \
                patch.object(Path, "read_bytes", side_effect=forbidden), \
                patch.object(Path, "read_text", side_effect=forbidden), \
                patch.object(Path, "open", side_effect=forbidden), \
                patch.object(subprocess, "check_output", side_effect=forbidden), \
                patch.object(tempfile, "TemporaryDirectory", side_effect=forbidden):
            module = load_capture()
        self.assertTrue(callable(module.structural))
        self.assertTrue(callable(module.main))

    def test_existing_output_is_rejected_before_reading_sources(self):
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / "historical.json"
            original = b'{"historical":true}\n'
            output.write_bytes(original)
            with patch.object(Path, "read_bytes", side_effect=AssertionError("source access before output protection")), \
                    patch.object(subprocess, "check_output", side_effect=AssertionError("Go must not run")):
                with self.assertRaisesRegex(SystemExit, "Refusing to overwrite existing output"):
                    capture.main([str(Path(directory) / "missing-source"), str(output), "--release", "v0.2.0"])
            self.assertEqual(output.read_bytes(), original)

    def test_exclusive_output_creation_preserves_an_existing_racing_file(self):
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / "fresh.json"
            capture.require_new_output(output)
            output.write_bytes(b"another writer's evidence\n")
            with self.assertRaises(FileExistsError):
                capture.write_fixture(output, {"replacement": True})
            self.assertEqual(output.read_bytes(), b"another writer's evidence\n")

    def test_new_output_is_utf8_json_with_lf(self):
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / "new.json"
            capture.write_fixture(output, {"description": "业务字段"})
            raw = output.read_bytes()
            self.assertEqual(json.loads(raw), {"description": "业务字段"})
            self.assertTrue(raw.endswith(b"\n"))
            self.assertNotIn(b"\r\n", raw)

    def test_projection_date_is_current_generation_not_the_historical_capture(self):
        generated = datetime(2026, 11, 3, 1, 2, 3, tzinfo=timezone(timedelta(hours=8)))
        for release, old_date in ((None, "2026-10-12"), ("v0.2.0", "2026-10-19")):
            with self.subTest(release=release):
                metadata = capture.projection_metadata(release, generated)
                self.assertEqual(metadata["captured"], "2026-11-02")
                self.assertEqual(metadata["generatedAt"], "2026-11-02T17:02:03Z")
                self.assertEqual(metadata["historicalCaptureDate"], old_date)
                self.assertEqual(metadata["projectionVersion"], "schema-position-aware-v1")

    def test_cli_help_does_not_access_source_or_run_go(self):
        with patch.object(Path, "read_bytes", side_effect=AssertionError("source must not be read for help")), \
                patch.object(subprocess, "check_output", side_effect=AssertionError("Go must not run for help")), \
                redirect_stdout(io.StringIO()) as text:
            with self.assertRaises(SystemExit) as result:
                capture.main(["--help"])
        self.assertEqual(result.exception.code, 0)
        self.assertIn("--release", text.getvalue())


if __name__ == "__main__":
    unittest.main()
