"""Compare a delivered BOM Markdown table against the independent CLI oracle.

Checks every parent-child row (including repeated materials), usage and available
inventory. This is not a semantic grader for warehouse/lead-time explanation;
those remain an explicit review in RESULTS.md. Raises on incomplete/mismatched
answers rather than accepting a correct summary or a partial tree.
"""
import argparse
from collections import Counter
from decimal import Decimal
import html
import json
from pathlib import Path
import re


def cells(line):
    return [html.unescape(x.strip().replace('\\|', '|').replace('**', '').replace('`', ''))
            for x in re.split(r'(?<!\\)\|', line.strip())[1:-1]]


def number(value):
    value = value.replace(',', '')
    match = re.match(r'^(-?\d+(?:\.\d+)?)', value)
    if match:
        return Decimal(match[1])
    if value in ('—', '-', '无记录', '无库存记录', '无库存行', 'NO_ROW'):
        return Decimal(0)
    raise ValueError(f'Unrecognized business value: {value}')


def rows_from_markdown(answer):
    indexes = None
    result = []
    for line in answer.splitlines():
        if not line.strip().startswith('|'):
            continue
        row = cells(line)
        if any('父' in x for x in row) and any('子' in x for x in row):
            aliases = {
                'level': lambda x: '层' in x or x.lower() == 'level',
                'parent': lambda x: '父' in x,
                'child': lambda x: '子' in x and ('编码' in x or '件' in x or '料' in x) and '名称' not in x,
                'name': lambda x: '名称' in x,
                'usage': lambda x: '单耗' in x or '用量' in x or '标准用量' in x,
                'stock': lambda x: '库存' in x or '可用量' in x,
            }
            indexes = {key: next((i for i, value in enumerate(row) if predicate(value)), None)
                       for key, predicate in aliases.items()}
            if any(value is None for value in indexes.values()):
                indexes = None
            continue
        if indexes is None or len(row) <= max(indexes.values()):
            continue
        parent, child = row[indexes['parent']], row[indexes['child']]
        if not re.fullmatch(r'\d{3}-\d{6}', parent) or not re.fullmatch(r'\d{3}-\d{6}', child):
            continue
        level = row[indexes['level']].removeprefix('L')
        result.append((int(level), parent, child, row[indexes['name']],
                       number(row[indexes['usage']]), number(row[indexes['stock']])))
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--answer', type=Path, required=True)
    parser.add_argument('--oracle', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    oracle = json.loads(args.oracle.read_text())
    expected = Counter((int(r['bom_level']), r['parent_material_code'], r['material_code'],
                        r['material_name'], Decimal(str(r['standard_usage'])), Decimal(str(r['available_qty'])))
                       for r in oracle)
    rows = rows_from_markdown(args.answer.read_text())
    actual = Counter(rows)
    missing, extra = list((expected-actual).elements()), list((actual-expected).elements())
    report = {'method': 'every delivered parent-child row compared to independent live CLI snapshot',
              'oracleRows': len(oracle), 'answerRows': len(rows),
              'distinctMaterials': len({r[2] for r in rows}),
              'levels': sorted({r[0] for r in rows}), 'missingOrChanged': missing,
              'extraOrChanged': extra, 'passed': bool(rows) and actual == expected,
              'fields': ['level', 'parent', 'child', 'name', 'standard_usage', 'available_inventory']}
    args.output.write_text(json.dumps(report, ensure_ascii=False, indent=2, default=str)+'\n')
    print(json.dumps({k: v for k, v in report.items() if k not in ['missingOrChanged','extraOrChanged']}, ensure_ascii=False))
    if not report['passed']:
        raise SystemExit(1)


if __name__ == '__main__':
    main()
