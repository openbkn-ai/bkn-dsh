"""Independent read-only CLI oracle; credentials remain in the CLI store.

Use CLI 0.1.5 and the platform CA via NODE_EXTRA_CA_CERTS. Output contains
business test data only. This does not grade a model answer or prove Desktop
acceptance. Exact dataset/tool IDs below identify the existing evaluation set.
"""
import argparse
import collections
import csv
import json
import pathlib
import subprocess
import time

NETWORK = "supply_ontology_hand"
PRODUCT = "382-000005"
BOX = "203d444b-1f20-47e7-a1af-bce6dfaeebb3"
BOM_TOOL = "afd1823b-0234-4f35-ba03-3c0b91409445"
WAREHOUSES = ["苏州半成品仓", "苏州成品仓", "苏州电子原料仓", "苏州无人机原料仓", "苏州装配原料仓", "乌鲁木齐成品仓", "哈尔滨成品仓"]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--cli", default="openbkn")
    parser.add_argument("--output", type=pathlib.Path, required=True)
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    calls = []

    def call(name, command):
        started = time.monotonic()
        completed = subprocess.run([args.cli, "--json", *command], capture_output=True, text=True, timeout=90)
        # Do not export arbitrary CLI stderr/config: only a bounded status.
        if completed.returncode:
            raise RuntimeError(f"{name}: CLI failed (exit {completed.returncode})")
        data = json.loads(completed.stdout)
        (args.output / f"{name}.json").write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")
        calls.append({"name": name, "seconds": round(time.monotonic() - started, 3), "command": command})
        return data

    def query(name, ot, condition):
        rows, seen, offset = [], set(), 0
        total = None
        while True:
            request = {"ot_id": ot, "condition": condition, "limit": 1000, "offset": offset}
            page = call(f"{name}-{offset}", ["context", "query-object-instance", NETWORK, "--args", json.dumps(request)])
            total = page.get("total_count")
            batch = page.get("datas")
            if not isinstance(batch, list):
                raise RuntimeError(f"{name}: missing datas")
            for row in batch:
                identity = row.get("_instance_id")
                if not identity or identity in seen:
                    raise RuntimeError(f"{name}: missing/repeated identity")
                seen.add(identity)
            rows.extend(batch)
            if total is not None and len(rows) == total:
                return rows
            if not batch or (total is None and len(batch) < 1000):
                if total is not None and len(rows) != total:
                    raise RuntimeError(f"{name}: incomplete rows")
                return rows
            offset += len(batch)
            if offset > 50000:
                raise RuntimeError(f"{name}: safety bound exceeded")

    eq = lambda field, value: {"operation": "==", "field": field, "value": value, "value_from": "const"}
    material = query("material", NETWORK + "_material", eq("material_code", PRODUCT))
    schema = call("material-schema", ["context", "object-types", NETWORK, NETWORK + "_material"])
    call("live-tools", ["context", "tools", NETWORK])
    missing = query("missing-material", NETWORK + "_material", eq("material_code", "999-999999"))
    lines, offset, summary = [], 0, None
    while True:
        request = {"kn_id": NETWORK, "toolbox_id": BOX, "tool_id": BOM_TOOL,
                   "arguments": {"product": PRODUCT, "depth": 5, "report_grain": "full", "page_size": 100, "offset": offset}}
        page = call(f"bom-{offset}", ["context", "tool-call", NETWORK, "execute_tool", "--args", json.dumps(request)])
        if page.get("status_code") != 200 or page.get("error"):
            raise RuntimeError("BOM capability failed")
        result = page["body"]["result"]
        current = {key: result[key] for key in ["line_count", "scoped_line_count", "unique_child_count", "max_level", "caliber"]}
        if summary is not None and current != summary:
            raise RuntimeError("BOM changed between pages")
        summary = current
        lines.extend(result["lines"])
        following = result["next_offset"]
        if following is None:
            break
        if following <= offset or following != len(lines):
            raise RuntimeError("BOM cursor did not advance correctly")
        offset = following
    codes = sorted({line["material_code"] for line in lines})
    if len(lines) != summary["scoped_line_count"] or len(codes) != summary["unique_child_count"]:
        raise RuntimeError("BOM coverage mismatch")
    stock = []
    for start in range(0, len(codes), 32):
        condition = {"operation": "in", "field": "material_code", "value": codes[start:start + 32], "value_from": "const"}
        batch = query(f"inventory-{start}", NETWORK + "_inventory", condition)
        if any(row["material_code"] not in condition["value"] for row in batch):
            raise RuntimeError("Inventory filter was not honored")
        stock.extend(batch)
    quantities = collections.defaultdict(lambda: {"available_qty": 0, "reserved_qty": 0, "stock_rows": 0, "inventory_uom": None})
    for row in stock:
        if row["warehouse"] in WAREHOUSES:
            entry = quantities[row["material_code"]]
            unit = row.get("inventory_uom")
            if not unit or entry["inventory_uom"] not in (None, unit):
                raise RuntimeError("Inventory unit missing or mixed; cannot sum quantities")
            entry["inventory_uom"] = unit
            for key, source in [("available_qty", "available_inventory_qty"), ("reserved_qty", "reserved_inventory_qty")]:
                if row.get(source) is None:
                    raise RuntimeError(f"Inventory {source} is unknown")
                entry[key] += row[source]
            entry["stock_rows"] += 1
    detail = [{**line, **quantities[line["material_code"]]} for line in lines]
    (args.output / "complete-bom-inventory.json").write_text(json.dumps(detail, ensure_ascii=False, indent=2) + "\n")
    with (args.output / "complete-bom-inventory.csv").open("w", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=list(detail[0]))
        writer.writeheader()
        writer.writerows(detail)
    report = {"verification": "independent live CLI oracle; not a Desktop/model verdict", "bom": summary,
              "retrieved_lines": len(lines), "distinct_materials": len(codes), "levels": sorted({line["bom_level"] for line in lines}),
              "material": material, "missing_material_rows": len(missing), "warehouse_filter": WAREHOUSES,
              "inventory_source": "supply_ontology_hand_inventory", "reserved": "display only; not deducted again",
              "in_transit": "excluded; purchase orders not loaded", "no_stock_rows": "sum is 0 in queried warehouse scope; no physical stock claim",
              "first_level_checks": {code: quantities[code] for code in ["528-000036", "791-000007", "791-000015"]},
              "material_source": schema["object_types"][0]["data_source"], "calls": calls}
    (args.output / "verification.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps({key: report[key] for key in ["bom", "retrieved_lines", "distinct_materials", "levels", "missing_material_rows", "first_level_checks"]}, ensure_ascii=False))


if __name__ == "__main__":
    main()
