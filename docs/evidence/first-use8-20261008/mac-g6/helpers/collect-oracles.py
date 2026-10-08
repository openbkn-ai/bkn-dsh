"""Fresh independent read-only CLI snapshots; no model queries or token export."""
import argparse
import datetime
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import re
import subprocess
import time

p = argparse.ArgumentParser()
for name in ['repo', 'cli', 'store', 'ca', 'out']:
    p.add_argument('--' + name, type=Path, required=True)
p.add_argument('--phase', choices=['before', 'after'], required=True)
a = p.parse_args()
out = a.out / ('oracle-' + a.phase)
out.mkdir(mode=0o700)  # Fresh evidence; refuse overwrite of an earlier run.
spec = importlib.util.spec_from_file_location('existing_redactor', a.repo / 'docs/eval/export-supply-session.py')
redactor = importlib.util.module_from_spec(spec)
spec.loader.exec_module(redactor)
env = dict(os.environ, BKN_CONFIG_DIR=str(a.store), NODE_EXTRA_CA_CERTS=str(a.ca))
queries = [
    ('orders', 'salesorder', 'product_code', '382-000005'),
    ('inventory', 'inventory', 'material_code', '382-000005'),
    ('material', 'material', 'material_code', '382-000005'),
    ('bom-physical-all', 'bom', 'bom_material_code', '382-000005'),
    ('purchase-orders', 'po', 'material_number', '382-000005'),
    ('purchase-requests', 'pr', 'material_number', '382-000005'),
    ('missing-material', 'material', 'material_code', '999-999999'),
    ('missing-inventory', 'inventory', 'material_code', '999-999999'),
    ('missing-orders', 'salesorder', 'product_code', '999-999999'),
]
calls = []
for name, suffix, field, value in queries:
    body = {'limit': 1000, 'need_total': True, 'condition': {
        'operation': '==', 'field': field, 'value': value, 'value_from': 'const'}}
    args = ['bkn', 'object-type', 'query', 'supply_ontology_hand', 'supply_ontology_hand_' + suffix,
            '--body', json.dumps(body), '--json']
    started = datetime.datetime.now(datetime.timezone.utc).isoformat()
    timer = time.monotonic()
    result = subprocess.run([str(a.cli), *args], env=env, capture_output=True, timeout=50)
    record = {'name': name, 'startedAt': started, 'seconds': round(time.monotonic()-timer, 3),
              'commandArguments': args, 'exitCode': result.returncode, 'stderrBytes': len(result.stderr)}
    calls.append(record)
    if result.returncode:
        (out / 'calls.json').write_text(json.dumps(calls, indent=2) + '\n')
        raise SystemExit(f'{name} refused; raw stdout/stderr withheld')
    parsed = json.loads(result.stdout)
    safe = redactor.redact(parsed)
    encoded = json.dumps(safe, ensure_ascii=False, indent=2)
    if re.search(r'\b(?:sk-[A-Za-z0-9_-]{12,}|Bearer\s+[A-Za-z0-9_.-]{12,}|eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]+\.)', encoded):
        raise SystemExit('Possible credential-shaped value; output withheld')
    data = result.stdout if safe == parsed else (encoded + '\n').encode()
    (out / (name + '.json')).write_bytes(data)
    rows = parsed.get('datas', parsed.get('entries', []))
    record.update(rawBytesRetained=safe == parsed, sha256=hashlib.sha256(data).hexdigest(), bytes=len(data),
                  rowCount=len(rows), totalCount=parsed.get('total_count'),
                  hasNextCursor=parsed.get('paging', {}).get('next_cursor') is not None)
    (out / 'calls.json').write_text(json.dumps(calls, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({k: record[k] for k in ['name', 'exitCode', 'rowCount', 'totalCount', 'sha256', 'hasNextCursor']}))
    if record['hasNextCursor'] or len(rows) == 1000:
        raise SystemExit('Snapshot may be truncated; do not grade full coverage without pagination')
