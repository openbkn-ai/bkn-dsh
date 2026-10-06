"""Independently compare all delivered BOM fields, units and absent-row markers.

Accepts the explicit seven-column pipe handoff or a Markdown table. Reads the
independent CLI snapshot, not the plugin's parser or the model's row counts.
An absent inventory row is distinct from measured zero in the query scope.
"""
import argparse
from collections import Counter
import csv
from decimal import Decimal
import html
import json
from pathlib import Path
import re


ALIASES = [
    {'level', 'bom_level', '层级', '层'},
    {'parent', 'parent_code', 'parent_material_code', '父件', '父件编码', '父料'},
    {'child', 'child_code', 'material_code', '子件', '子件编码', '子料', '子料编码'},
    {'child_name', 'material_name', '子件名称', '物料名称', '名称'},
    {'std_usage', 'standard_usage', '单耗', '标准用量', '用量', '使用量'},
    {'available_qty', 'available_inventory', '可用量', '可用库存', '库存', '库存数量'},
    {'uom', 'inventory_uom', '单位', '库存单位'},
]
ABSENT_STOCK = {'无合格库存行', '无库存行', '无库存记录', '无记录', 'NO_ROW'}
UNKNOWN_UNIT = {'?', '—', '-', '未知', '未提供'}


def delivered_rows(answer):
    indexes, level = None, None
    for raw in answer.splitlines():
        line = raw.strip()
        if line.startswith('#'):
            heading = re.fullmatch(r'#{1,6}\s+第\s*(\d+)\s*层(?:\s.*|[（(].*)?', line)
            indexes, level = None, int(heading[1]) if heading else None
        if '|' not in line:
            continue
        fields = next(csv.reader([line.strip('|')], delimiter='|', escapechar='\\'))
        fields = [html.unescape(x.strip().replace('**', '').replace('`', '')) for x in fields]
        candidate = [next((i for i, x in enumerate(fields) if x.lower() in alias), None) for alias in ALIASES]
        if candidate[1] is not None and candidate[2] is not None:
            indexes = candidate if all(i is not None for i in candidate[1:]) and (candidate[0] is not None or level is not None) else None
            continue
        if indexes is None or len(fields) <= max(i for i in indexes if i is not None):
            continue
        values = [fields[i] if i is not None else str(level) for i in indexes]
        if not re.fullmatch(r'\d{3}-\d{6}', values[1]) or not re.fullmatch(r'\d{3}-\d{6}', values[2]):
            continue
        stock = values[5].replace(',', '')
        known_absence = stock in ABSENT_STOCK or stock.casefold() == 'no_row'
        absent = known_absence or stock.endswith('*')
        stock = '0' if known_absence else stock.removesuffix('*')
        for quantity in [values[4].replace(',', ''), stock]:
            if not re.fullmatch(r'-?\d+(?:\.\d+)?', quantity):
                raise ValueError('Unknown/nonnumeric delivered quantity; cannot assert stock')
        unit = '?' if values[6] in UNKNOWN_UNIT else values[6]
        yield (int(values[0].removeprefix('L')), *values[1:4], Decimal(values[4].replace(',', '')), Decimal(stock), unit, absent)


def compare(answer, oracle):
    expected = Counter((int(r['bom_level']), r['parent_material_code'], r['material_code'], r['material_name'],
                        Decimal(str(r['standard_usage'])), Decimal(str(r['available_qty'])), r['inventory_uom'] or '?',
                        r['stock_rows'] == 0) for r in oracle)
    actual = Counter(delivered_rows(answer))
    return {'method': 'independent CLI snapshot vs delivered table; no plugin parser or model count reused',
            'fields': ['level', 'parent', 'child', 'name', 'usage', 'available_stock', 'inventory_unit', 'absent_row_marker'],
            'oracleRows': sum(expected.values()), 'answerRows': sum(actual.values()),
            'expectedAbsentRows': sum(n for row, n in expected.items() if row[-1]),
            'deliveredAbsentRows': sum(n for row, n in actual.items() if row[-1]),
            'missingOrChanged': list((expected-actual).elements()), 'extraOrChanged': list((actual-expected).elements()),
            'passed': bool(actual) and actual == expected}


def main():
    p = argparse.ArgumentParser(description=__doc__)
    for name in ['answer', 'oracle', 'output']:
        p.add_argument('--'+name, type=Path, required=True)
    a = p.parse_args()
    report = compare(a.answer.read_text(), json.loads(a.oracle.read_text()))
    a.output.write_text(json.dumps(report, ensure_ascii=False, indent=2, default=str)+'\n')
    print(json.dumps({k: v for k, v in report.items() if k not in ['missingOrChanged', 'extraOrChanged']}, ensure_ascii=False))
    if not report['passed']:
        raise SystemExit(1)


if __name__ == '__main__':
    main()
