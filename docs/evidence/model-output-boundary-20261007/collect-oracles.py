"""Collect read-only REST instance snapshots independently of model tools.

Credentials remain in the named isolated CLI store. No auth command or raw
stderr is saved. Native successful JSON bytes are retained when redaction
leaves them unchanged; the output manifest states that distinction.
"""
import argparse
import datetime
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import time


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--phase', required=True)
    parser.add_argument('--root', type=Path, required=True)
    parser.add_argument('--component-inventory', action='store_true')
    args = parser.parse_args()
    repo = Path(__file__).resolve().parents[3]
    output = Path(__file__).parent / ('oracle-' + args.phase)
    output.mkdir(exist_ok=True)
    spec = importlib.util.spec_from_file_location('redactor', repo / 'docs/eval/export-supply-session.py')
    redactor = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(redactor)
    node = '/Users/kalias/.nvm/versions/node/v24.19.0/bin/node'
    cli = args.root / 'cli-0.1.5/node_modules/@openbkn/bkn-sdk/dist/cli.js'
    env = dict(os.environ, BKN_CONFIG_DIR=str(args.root / 'bkn-config'),
               NODE_EXTRA_CA_CERTS=str(repo / 'docs/handoff/2026-10-06-release-7/fidelity-windows/certificates/openbkn-dev-ca.pem'))
    env['PATH'] = str(Path(node).parent) + ':' + env['PATH']
    queries = [
        ('orders', 'salesorder', 'product_code'),
        ('inventory', 'inventory', 'material_code'),
        ('purchase-orders', 'po', 'material_number'),
        ('purchase-requests', 'pr', 'material_number'),
        ('bom', 'bom', 'bom_material_code'),
    ]
    calls = []
    for name, suffix, field in queries:
        body = {'limit': 1000, 'need_total': True, 'condition': {
            'operation': '==', 'field': field, 'value': '382-000005', 'value_from': 'const'}}
        command = ['bkn', 'object-type', 'query', 'supply_ontology_hand',
                   'supply_ontology_hand_' + suffix, '--body', json.dumps(body), '--json']
        started = datetime.datetime.now(datetime.timezone.utc).isoformat()
        timer = time.monotonic()
        result = subprocess.run([node, str(cli), *command], env=env, capture_output=True, timeout=50)
        record = {'name': name, 'startedAt': started, 'seconds': round(time.monotonic()-timer, 3),
                  'command': command, 'exitCode': result.returncode, 'stderrBytes': len(result.stderr)}
        if result.returncode:
            calls.append(record)
            (output / 'calls.json').write_text(json.dumps(calls, indent=2)+'\n')
            raise RuntimeError(f'{name} exited {result.returncode}; raw stderr discarded')
        parsed = json.loads(result.stdout)
        safe = redactor.redact(parsed)
        data = result.stdout if safe == parsed else (json.dumps(safe, ensure_ascii=False, indent=2)+'\n').encode()
        (output / (name + '.json')).write_bytes(data)
        record.update(rawBytesRetained=safe == parsed, sha256=hashlib.sha256(data).hexdigest(), bytes=len(data))
        if isinstance(parsed, dict):
            record['totalCount'] = parsed.get('total_count')
            record['topLevel'] = list(parsed)
            rows = parsed.get('datas', parsed.get('entries', []))
            record['rowCount'] = len(rows) if isinstance(rows, list) else None
        calls.append(record)
        print(json.dumps(record, ensure_ascii=False))
    (output / 'calls.json').write_text(json.dumps(calls, ensure_ascii=False, indent=2)+'\n')

    if not args.component_inventory:
        return

    # This exploratory physical-ERP scope is a superset of the published
    # BOM function's main_only scope. Do not use it as that function's oracle.
    physical = json.loads((output / 'bom.json').read_text())['datas']
    frontier = {'382-000005'}
    reachable = []
    for level in range(1, 6):
        selected = [r for r in physical if r['bom_level'] == level
                    and r['parent_material_code'] in frontier and not r['alt_part']]
        reachable.extend(selected)
        frontier = {r['material_code'] for r in selected}
    fields = ['bom_level', 'parent_material_code', 'material_code', 'material_name', 'standard_usage']
    unique = {tuple(str(r[k]) for k in fields): {k:r[k] for k in fields} for r in reachable}
    main_rows = list(unique.values())
    (output / 'exploratory-physical-bom-rows.json').write_text(json.dumps(main_rows, ensure_ascii=False, indent=2)+'\n')
    codes = sorted({r['material_code'] for r in main_rows})
    inventory = []
    for offset in range(0, len(codes), 32):
        body = {'limit': 1000, 'need_total': True, 'condition': {
            'operation': 'in', 'field': 'material_code', 'value': codes[offset:offset+32], 'value_from': 'const'}}
        command = ['bkn', 'object-type', 'query', 'supply_ontology_hand',
                   'supply_ontology_hand_inventory', '--body', json.dumps(body), '--json']
        result = subprocess.run([node, str(cli), *command], env=env, capture_output=True, timeout=50)
        if result.returncode:
            raise RuntimeError(f'component inventory exited {result.returncode}; raw stderr discarded')
        parsed = json.loads(result.stdout)
        if parsed.get('paging', {}).get('next_cursor') is not None or len(parsed['datas']) == 1000:
            raise RuntimeError('Component inventory needs pagination; do not accept truncated data')
        inventory.extend(parsed['datas'])
        safe = redactor.redact(parsed)
        data = result.stdout if safe == parsed else (json.dumps(safe, ensure_ascii=False, indent=2)+'\n').encode()
        (output / f'component-inventory-{offset}.json').write_bytes(data)
        calls.append({'name': f'component-inventory-{offset}', 'command': command,
                      'exitCode': result.returncode, 'rowCount': len(parsed['datas']),
                      'rawBytesRetained': safe == parsed, 'sha256': hashlib.sha256(data).hexdigest()})
    (output / 'calls.json').write_text(json.dumps(calls, ensure_ascii=False, indent=2)+'\n')
    (output / 'component-inventory-rows.json').write_text(json.dumps(inventory, ensure_ascii=False, indent=2)+'\n')
    print(json.dumps({'exploratoryPhysicalBomRows': len(main_rows), 'physicalMaterials': len(codes),
                      'componentInventoryRows': len(inventory)}))


if __name__ == '__main__':
    main()
