"""Archive bounded, credential-scrubbed G6 evidence; never alter the candidate."""
from pathlib import Path
import collections
import datetime
import hashlib
import importlib.util
import json
import re
import shutil

repo = Path('/Users/kalias/Documents/project/app/openBKN/bkn-dsh-unified-7')
root = Path('/tmp/bkn-firstuse8-g6-evidence')
out = repo / 'docs/evidence/first-use8-20261008/mac-g6'
spec = importlib.util.spec_from_file_location('redactor', repo / 'docs/eval/export-supply-session.py')
redactor = importlib.util.module_from_spec(spec)
spec.loader.exec_module(redactor)
secret = re.compile(r'\b(?:sk-[A-Za-z0-9_-]{12,}|Bearer\s+[A-Za-z0-9_.-]{12,}|eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]+\.)')

def write_json(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    text = json.dumps(redactor.redact(value), ensure_ascii=False, indent=2) + '\n'
    assert not secret.search(text), 'Credential-shaped value withheld'
    path.write_text(text)

def load(path):
    return json.loads(path.read_text())

def rows(path):
    value = load(path)
    return value.get('datas', value.get('entries', []))

def canonical(value):
    return sorted(json.dumps(row, ensure_ascii=False, sort_keys=True) for row in value)

checks = []
def check(name, expected, actual):
    checks.append({'check': name, 'expected': expected, 'actual': actual, 'pass': expected == actual})

names = ['orders', 'inventory', 'material', 'bom-physical-all', 'purchase-orders',
         'purchase-requests', 'missing-material', 'missing-inventory', 'missing-orders']
for name in names:
    before = canonical(rows(root / 'oracle-before' / (name + '.json')))
    after = canonical(rows(root / 'additional-oracles/oracle-after' / (name + '.json')))
    check('additional questions before/after unchanged: ' + name, before, after)
    for key in ['expected', 'actual']:
        checks[-1][key] = hashlib.sha256('\n'.join(checks[-1][key]).encode()).hexdigest()

before = canonical(load(root / 'full-oracle-before/complete-bom-inventory.json'))
after = canonical(load(root / 'full-oracle-after/complete-bom-inventory.json'))
check('full main_only independent inventory oracle before/after unchanged', before, after)
for key in ['expected', 'actual']:
    checks[-1][key] = hashlib.sha256('\n'.join(checks[-1][key]).encode()).hexdigest()

inventory = rows(root / 'oracle-before/inventory.json')
stock = collections.defaultdict(lambda: {'available': 0, 'records': 0})
for row in inventory:
    stock[row['warehouse']]['available'] += row['available_inventory_qty']
    stock[row['warehouse']]['records'] += 1
answer = (root / 'additional-normal/finished-goods-inventory.md').read_text()
delivered = [[cell.strip().replace('**', '') for cell in line.strip().strip('|').split('|')]
             for line in answer.splitlines() if re.match(r'^\| (苏州成品仓|乌鲁木齐成品仓|哈尔滨成品仓|\*\*合计)', line)]
expected = [[name, str(stock[name]['available']), '个', str(stock[name]['records'])]
            for name in ['苏州成品仓', '乌鲁木齐成品仓', '哈尔滨成品仓']]
expected.append(['合计', str(sum(int(row[1]) for row in expected)), '个', str(sum(int(row[3]) for row in expected))])
check('finished goods exact warehouse table, including total and record counts', expected, delivered)
check('other warehouse figures', [232, 44, 6, 0],
      [stock[name]['available'] for name in ['借用仓', '苏州客退仓', '苏州待发物料仓', '西安成品仓']])
check('finished goods answer declares limited warehouse scope', True, '按题目「各成品仓」范围未计入' in answer)
orders = rows(root / 'oracle-before/orders.json')
order_answer = (root / 'additional-normal/orders-count-status.md').read_text()
check('order count/status fresh oracle', [40, ['已确认']], [len(orders), sorted({row['order_status'] for row in orders})])
check('orders count answer states count, sole status and both ranges', True,
      all(word in order_answer for word in ['40', '已确认', 'SO0000001', 'SO0000020', 'SO0000501', 'SO0000520']))
check('purchase target PR/PO independently empty', [0, 0],
      [len(rows(root / 'oracle-before' / (name + '.json'))) for name in ['purchase-requests', 'purchase-orders']])
purchase = (root / 'additional-normal/purchase-flow.md').read_text()
check('purchase target scope and separate PR/PO result declared', True,
      all(word in purchase for word in ['自身为口径', '采购申请单', '采购订单', '**0**']))
bom = rows(root / 'oracle-before/bom-physical-all.json')
child_codes = {row['material_code'] for row in bom if row['bom_level'] > 0}
extra_claim = re.search(r'507 行、(\d+) 个不同子件物料', purchase)
check('extra purchase answer child-code distinct count (not an expected purchase criterion)', len(child_codes),
      int(extra_claim[1]) if extra_claim else None)
write_json(out / 'additional-independent-check.json', {
    'checkedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
    'scope': 'Fresh read-only CLI data versus delivered answers; criterion-level grading remains separate.',
    'checks': checks,
    'allCheckedClaimsPass': all(item['pass'] for item in checks),
    'limits': ['Purchase target PR/PO=0 is checked; extra PR=5028 and narrative MPS/status claims are unverified.',
               'Purchase answer extra distinct-child count is 406 versus independent physical-table 407, so entire-answer accuracy is not claimed.',
               'BOM physical 507 rows include root; main_only published oracle is 313 lines / 272 materials / 5 levels. These scopes are distinct.']
})

timeouts = load(root / 'full-bom-normal/timeout-native-events.json')
events = timeouts['events']
calls = {event['data']['callId']: event for event in events if event['type'] == 'tool/call'}
errors = []
for event in events:
    if event['type'] != 'tool/result':
        continue
    message = event['data'].get('message', {})
    text = '\n'.join(item.get('text', '') for item in message.get('content', []) if item['type'] == 'text')
    if 'Request timed out' not in text and not message.get('isError'):
        continue
    call = calls.get(message.get('toolCallId'))
    arguments = call['data']['arguments'] if call else None
    if isinstance(arguments, str):
        try:
            arguments = json.loads(arguments)
        except ValueError:
            arguments = {'unparsed': True}
    code = arguments.get('code', '') if isinstance(arguments, dict) else ''
    errors.append({'callId': message.get('toolCallId'), 'tool': call['data']['name'] if call else None,
                   'callAtMs': call.get('time') if call else None, 'resultAtMs': event.get('time'),
                   'elapsedMs': event['time'] - call['time'] if call else None,
                   'error': text[:250],
                   'argumentsSha256': hashlib.sha256(json.dumps(arguments, sort_keys=True).encode()).hexdigest(),
                   'declaredInvocationSignals': re.findall(r'(?:depth|report_grain|page_size|offset|timeout|limit)\s*[=:]\s*[\"\x27]?[^,\n)\]}]{1,32}', code)})
write_json(out / 'full-bom-normal/error-summary.json', {
    'sessionId': timeouts['sessionId'], 'harnessLimitMs': timeouts['limitMs'],
    'nativeTurnEnds': [event['data']['reason'] for event in events if event['type'] == 'turn/end'],
    'errors': errors,
    'conclusion': 'No final deliverable by the 300000 ms harness limit. Six tool-level Request timed out errors occurred at 20013–20034 ms. The plugin supplies the configured toolCallTimeoutMs to the official McpClient; its unchanged default is 20000 ms. This identifies the configured deadline but does not establish why the platform operation took longer or whether extending it would complete successfully.',
    'timeoutConfiguration': {'pluginDefaultMs': 20000, 'configSource': 'packages/openbkn-business-context/src/config.ts', 'forwardedTo': 'official McpClient', 'forwardingSource': 'packages/openbkn-business-context/src/openbkn-mcp-manager.ts', 'profileOverridePresent': False, 'changedInThisRound': False},
    'limits': ['Managed-only write rejection is expected plugin governance, not a released answer failure fix.',
               'Independent full CLI oracle succeeds but does not prove identical MCP/run_code transport or timeout settings.']
})

skip_names = {'first-four-independent-check.json'}
for path in sorted(root.rglob('*')):
    if not path.is_file() or path.name.endswith('-private.txt'):
        continue
    if path.suffix not in {'.json', '.md', '.csv', '.jsonl'}:
        continue
    relative = path.relative_to(root)
    target = out / relative
    if path.suffix == '.json':
        value = load(path)
        if isinstance(value, dict) and 'events' in value:
            for event in value['events']:
                if event.get('type') == 'assistant/message':
                    message = event.get('data', {}).get('message', {})
                    message['content'] = [block for block in message.get('content', []) if block.get('type') in {'text', 'tool-call'}]
                    message.pop('reasoning', None)
            value['archiveTransform'] = 'Credential scrub plus assistant reasoning excluded; archive is a derived export, not private session bytes.'
        write_json(target, value)
    else:
        text = path.read_text()
        assert not secret.search(text), 'Credential-shaped value withheld'
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(path, target)

answers = {
    'orders-count-status': [True, True, True, True, True],
    'finished-goods-inventory': [True, True, True, True, True],
    'standard-lead-time': [True, True, True],
    'bom-structure': [True, True, True],
    'bom-usage-inventory': [False, False, False, False, True, True],
    'purchase-flow': [True, True, True],
    'sales-order-detail': [True, True, True],
    'missing-object': [True, False, True, True],
    'invalid-token': 'not-run', 'platform-unreachable': 'not-run', 'unauthorized-network': 'not-run'
}
write_json(out / 'criterion-marks.json', answers)
scripts = out / 'helpers'
scripts.mkdir(exist_ok=True)
for name in ['run-native-rpc.mjs', 'collect-oracles.py', 'redact-json.py', 'grade-first-four.py', 'finalize-evidence.py']:
    shutil.copyfile(Path('/tmp/bkn-firstuse8-g6') / name, scripts / name)
write_json(out / 'model-selection.json', load(Path('/tmp/bkn-firstuse8-g6/model-selection.json')))
print(json.dumps({'independentChecks': len(checks), 'passed': sum(item['pass'] for item in checks),
                  'failedClaimNames': [item['check'] for item in checks if not item['pass']],
                  'toolTimeouts': sum('Request timed out' in item['error'] for item in errors)}, ensure_ascii=False))
