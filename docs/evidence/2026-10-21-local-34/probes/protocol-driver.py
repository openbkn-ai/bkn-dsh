"""Loopback OpenAI protocol driver for actual Desktop B1; NOT a G6 model.

Only emits start/query/finish calls. All tool responses come from native DSH
and the real platform. No Sandbox call, answer correction, or fake business data.
Never records headers or the full model request/system prompts.
"""
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import datetime
import json
from pathlib import Path
import re
import threading
import time
import uuid

root = Path(__file__).resolve().parents[1]
lock = threading.Lock()

def record(data):
    with lock:
        with (root / 'protocol-events.jsonl').open('a') as out:
            out.write(json.dumps({'at': datetime.datetime.now(datetime.timezone.utc).isoformat(), **data}) + '\n')

def objects(text):
    decoder = json.JSONDecoder()
    for at, char in enumerate(text):
        if char == '{':
            try:
                value, _ = decoder.raw_decode(text[at:])
                if isinstance(value, dict):
                    yield value
            except ValueError:
                pass

def content_text(value):
    if isinstance(value, str):
        return value
    if isinstance(value, list):
        return '\n'.join(content_text(item) for item in value)
    if isinstance(value, dict):
        if 'text' in value:
            return content_text(value['text'])
        if 'content' in value:
            return content_text(value['content'])
        return json.dumps(value)
    return str(value)

class Handler(BaseHTTPRequestHandler):
    def log_message(self, *args):
        pass

    def do_POST(self):
        assert self.path == '/v1/chat/completions', 'Only local chat protocol is allowed'
        size = int(self.headers['content-length'])
        assert size < 8 * 1024 * 1024
        body = json.loads(self.rfile.read(size))
        assert body['model'] == 'b1-native-protocol'
        messages = body['messages']
        tools = {tool['function']['name']: tool['function'] for tool in body.get('tools', [])}
        marker = re.findall(r'R34_B1:[0-9.a-z-]+:[a-z-]+', json.dumps([m.get('content') for m in messages if m['role'] == 'user']))
        phase = marker[-1] if marker and tools else 'auxiliary'
        by_call = {}
        for message in messages:
            for call in message.get('tool_calls', []):
                by_call[call['id']] = call['function']['name']
        completed = {}
        for message in messages:
            if message['role'] == 'tool':
                name = by_call.get(message.get('tool_call_id'))
                if name:
                    completed[name] = content_text(message.get('content', ''))

        prefix = 'mcp__openbkn__'
        start = prefix + 'bkn_start_interaction'
        query = prefix + 'query_object_instance'
        finish = prefix + 'bkn_finish_interaction'
        tool_call = None
        note = None
        if phase == 'auxiliary':
            text = 'R34 B1 native Desktop protocol check'
        elif 'Public.Unauthorized' in completed.get(start, ''):
            record({'phase': phase, 'native_mcp_failure': 'Public.Unauthorized',
                'failed_tool': start, 'error_detail': 'token is invalid', 'business_query_dispatched': False})
            text = 'B1 协议检查记录：原生 MCP 开始工具返回 Public.Unauthorized / token is invalid，未执行后续业务查询。'
        elif start not in completed:
            assert start in tools, 'Native managed start tool is not exposed'
            tool_call = (start, {'conversation_mode': 'new', 'question': phase,
                'agent_name': 'bkn-agent-dsh-business-context'})
        elif query not in completed:
            values = list(objects(str(completed[start])))
            identity = next((item for item in values if item.get('conversation_id') and item.get('interaction_id')), None)
            if not identity:
                record({'phase': phase, 'setup_error': 'start-result-format', 'start_result_preview': completed[start][:1200]})
            assert identity, 'Real start result did not disclose managed identities'
            assert query in tools, 'Native scoped query tool is not exposed'
            tool_call = (query, {'kn_id': 'supply_ontology_hand', 'ot_id': 'supply_ontology_hand_salesorder',
                'condition': {'field': 'product_code', 'operation': '==', 'value': '382-000005'},
                'limit': 1, 'response_format': 'json',
                'bkn_context': {key: identity[key] for key in ['conversation_id', 'interaction_id']}})
        elif finish not in completed:
            values = list(objects(str(completed[start])))
            identity = next(item for item in values if item.get('interaction_id'))
            assert finish in tools
            tool_call = (finish, {'interaction_id': identity['interaction_id'], 'outcome': 'completed',
                'answer': 'Bounded native Desktop B1 protocol check; inspect actual recorded query result.'})
            note = {'interaction_id': identity['interaction_id'], 'conversation_id': identity['conversation_id']}
            query_values = list(objects(str(completed[query])))
            counts = [item['total_count'] for item in query_values if 'total_count' in item]
            note['observed_total_counts'] = counts
            note['query_reported_unauthorized'] = 'Unauthorized' in str(completed[query])
            assert counts and 40 in counts, 'Actual scoped query total differs or tool failed'
        else:
            text = '本次原生 Desktop B1 协议检查已结束。仅核对实际工具记录；这不是模型业务回答或 G6 验收。'

        record({'phase': phase, 'emitted_tool': tool_call[0] if tool_call else None,
            'exposed_tools': sorted(tools), 'completed_tools': sorted(completed),
            **({'query_evidence': note} if note else {})})
        model = body['model']
        rid = 'chatcmpl-r34-' + uuid.uuid4().hex
        if tool_call:
            name, args = tool_call
            call = {'id': 'call-r34-' + uuid.uuid4().hex, 'type': 'function',
                'function': {'name': name, 'arguments': json.dumps(args)}}
            message = {'role': 'assistant', 'content': None, 'tool_calls': [call]}
            delta = {'role': 'assistant', 'tool_calls': [{'index': 0, **call}]}
            reason = 'tool_calls'
        else:
            message = {'role': 'assistant', 'content': text}
            delta = message
            reason = 'stop'
        if body.get('stream'):
            self.send_response(200)
            self.send_header('content-type', 'text/event-stream')
            self.send_header('cache-control', 'no-store')
            self.end_headers()
            for value in [
                {'id': rid, 'object': 'chat.completion.chunk', 'created': int(time.time()), 'model': model,
                 'choices': [{'index': 0, 'delta': delta, 'finish_reason': None}]},
                {'id': rid, 'object': 'chat.completion.chunk', 'created': int(time.time()), 'model': model,
                 'choices': [{'index': 0, 'delta': {}, 'finish_reason': reason}]},
            ]:
                self.wfile.write(('data: ' + json.dumps(value) + '\n\n').encode())
            self.wfile.write(b'data: [DONE]\n\n')
            self.wfile.flush()
        else:
            raw = json.dumps({'id': rid, 'object': 'chat.completion', 'created': int(time.time()),
                'model': model, 'choices': [{'index': 0, 'message': message, 'finish_reason': reason}],
                'usage': {'prompt_tokens': 1, 'completion_tokens': 1, 'total_tokens': 2}}).encode()
            self.send_response(200)
            self.send_header('content-type', 'application/json')
            self.send_header('content-length', str(len(raw)))
            self.end_headers()
            self.wfile.write(raw)

existing = root / 'protocol-server.json'
server = ThreadingHTTPServer(('127.0.0.1', json.loads(existing.read_text())['port'] if existing.exists() else 0), Handler)
port = server.server_address[1]
(root / 'protocol-server.json').write_text(json.dumps({'host': '127.0.0.1', 'port': port,
    'base_url': f'http://127.0.0.1:{port}/v1', 'model': 'b1-native-protocol',
    'real_model': False, 'sandbox_allowed': False}) + '\n')
print(json.dumps({'loopback_port': port, 'real_model': False, 'sandbox_allowed': False}), flush=True)
server.serve_forever()
