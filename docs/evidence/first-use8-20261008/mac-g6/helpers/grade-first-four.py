"""Independent checks on delivered text and fresh CLI snapshots, not plugin logic."""
import collections
import datetime
import hashlib
import json
from pathlib import Path
import re

root = Path('/tmp/bkn-firstuse8-g6-evidence')
def rows(phase, name):
    data = json.loads((root / ('oracle-' + phase) / (name + '.json')).read_text())
    return data.get('datas', data.get('entries', []))

checks = []
def check(name, expected, actual):
    checks.append({'check': name, 'expected': expected, 'actual': actual, 'pass': expected == actual})

for name in ['orders', 'inventory', 'material', 'bom-physical-all', 'purchase-orders', 'purchase-requests',
             'missing-material', 'missing-inventory', 'missing-orders']:
    canon = lambda rs: sorted(json.dumps(r, ensure_ascii=False, sort_keys=True) for r in rs)
    check('before/after data unchanged: ' + name, canon(rows('before', name)), canon(rows('after', name)))
    # Avoid repeating the large independent oracle inside the verdict.
    checks[-1]['expected'] = hashlib.sha256('\n'.join(checks[-1]['expected']).encode()).hexdigest()
    checks[-1]['actual'] = hashlib.sha256('\n'.join(checks[-1]['actual']).encode()).hexdigest()

order_rows = rows('before', 'orders')
answer = (root / 'sales-order-detail.md').read_text()
field_order = ['sales_order_id', 'contract_number', 'customer_id', 'customer_name', 'signing_quantity',
               'shipping_quantity', 'signing_date', 'promised_delivery_date', 'shipping_date', 'order_status', 'salesperson']
actual = [[c.strip() for c in line.strip().strip('|').split('|')]
          for line in answer.splitlines() if re.match(r'^\| SO\d+ \|', line)]
def cell(row, key):
    value = row[key]
    return str(value)[:10] if key.endswith('_date') else str(value)
expected = [[cell(row, key) for key in field_order] for row in sorted(order_rows, key=lambda r: r['sales_order_id'])]
check('sales order delivered row count', 40, len(actual))
check('sales order distinct delivered identities', 40, len({r[0] for r in actual}))
differences = [{'row': i + 1, 'expected': e, 'actual': a}
               for i, (e, a) in enumerate(zip(expected, actual)) if e != a]
check('sales order all 11 delivered fields, 40 rows', [], differences)
check('sales order exact identity set', sorted(r['sales_order_id'] for r in order_rows), sorted(r[0] for r in actual))

bom = rows('before', 'bom-physical-all')
text = (root / 'bom-structure.md').read_text()
table_levels = re.findall(r'^\| L([0-5])(?: 成品)? \| (\d+) \| (\d+) \|$', text, re.M)
actual_levels = [[int(n), int(total), int(main)] for n, total, main in table_levels]
expected_levels = [[n, sum(r['bom_level'] == n for r in bom),
                    sum(r['bom_level'] == n and r['alt_priority'] == 0 for r in bom)] for n in range(6)]
check('BOM six level counts and alt_priority=0 counts', expected_levels, actual_levels)
l1 = [[c.strip() for c in line.strip().strip('|').split('|')][1:]
      for line in text.splitlines() if re.match(r'^\| (?:[2-9]|10) \| \d{3}-\d{6} \|', line)]
check('BOM L1 nine codes and exact names', [[r['material_code'], r['material_name']]
                                        for r in bom if r['bom_level'] == 1], l1)
check('BOM L1 stated unit usage', True, all(r['standard_usage'] == 1 for r in bom if r['bom_level'] == 1)
      and '用量均为 1' in text)
check('BOM replacement marker rows', 193, sum(r['alt_method'] == '替代' for r in bom))
check('BOM nonzero distinct replacement groups', 70, len({r['alt_group_no'] for r in bom if r['alt_group_no']}))
deep = [[c.strip() for c in line.strip().strip('|').split('|')]
        for line in text.splitlines() if re.match(r'^\| \d{3}-\d{6} \| .* \| \d+ \| \d→\d \|$', line)]
deep_diff = []
for code, name, count, levels in deep:
    parent_level, child_level = map(int, levels.split('→'))
    children = [r for r in bom if r['parent_material_code'] == code and r['bom_level'] == child_level]
    parent_names = {r['material_name'] for r in bom if r['material_code'] == code and r['bom_level'] == parent_level}
    if len(children) != int(count) or name not in parent_names:
        deep_diff.append({'code': code, 'claimedCount': count, 'actualCount': len(children),
                          'claimedName': name, 'actualNames': sorted(parent_names)})
check('BOM deep direct-child table names/counts/levels, eight branches', [], deep_diff)
branch_claims = {'791-000013': (2, 14), '528-000036': (2, 4), '791-000007': (2, 10),
                 '791-000015': (2, 3), '528-000031': (3, 16), '791-000003': (3, 26)}
for code, (level, count) in branch_claims.items():
    check('BOM named branch ' + code, count,
          sum(r['parent_material_code'] == code and r['bom_level'] == level for r in bom))
check('BOM delivered physical scope/source', True,
      'supply_demo_hand.erp_material_bom' in text and 'bom_material_code = 382-000005' in text)

material = rows('before', 'material')[0]
lead = (root / 'standard-lead-time.md').read_text()
check('lead time independently verified self-made/production/purchase facts', ['自制', 1, 1],
      [material['materialattr'], material['product_fixedleadtime'], material['purchase_fixedleadtime']])
check('lead time explicitly selects production scope', True,
      '自制' in lead and '生产固定提前期 = 1 天' in lead and 'product_fixedleadtime' in lead)
missing = (root / 'missing-object.md').read_text()
check('missing target three independent queries empty', [0, 0, 0],
      [len(rows('before', n)) for n in ['missing-material', 'missing-inventory', 'missing-orders']])
check('missing target answer nonempty and explicit no target data', True,
      bool(missing.strip()) and '不存在编码为 999-999999 的物料' in missing and '没有可回报的库存与订单数据' in missing)

report = {'checkedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
          'evidence': 'Delivered model text checked against pre/post independent read-only CLI queries.',
          'checks': checks, 'allCheckedClaimsPass': all(c['pass'] for c in checks),
          'limits': [
              'BOM response is a structural summary, not delivery of all 507 line items.',
              'Physical 507-row BOM is distinct from the published main_only function scope of 313 lines.',
              'Named branch aggregates/deep table and L1 names were checked; every narrative label was not independently parsed.',
              'Missing-object positive control counts for other materials were not independently checked; no target stock/order values are asserted.'
          ]}
(root / 'first-four-independent-check.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'checks': len(checks), 'passed': sum(c['pass'] for c in checks),
                  'failures': [c for c in checks if not c['pass']]}, ensure_ascii=False))
