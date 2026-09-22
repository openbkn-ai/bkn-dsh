import assert from 'node:assert/strict'
import test from 'node:test'
import { buildTurnTimeline } from '../src/turn-timeline.ts'

interface Event { readonly type: string; readonly time: number; readonly data: unknown }

function toolResult(callId: string, at: number, text: string, isError = false): Event {
  return {
    type: 'tool/result', time: at,
    data: { turn: 3, step: 1, message: {
      source: { kind: 'tool', callId },
      content: [{ type: 'tool-result', isError, content: [{ type: 'text', text }] }],
    } },
  }
}

test('rebuilds a typical turn: question, lifecycle, discovery, retrievals, finish, answer', () => {
  const events: Event[] = [
    { type: 'user/message', time: 1_000, data: { turn: 3, message: { id: 'u1', role: 'user', content: [{ type: 'text', text: '  382-000005 有多少张销售订单？  ' }] } } },
    { type: 'tool/call', time: 1_100, data: { turn: 3, step: 1, callId: 'c1', name: 'mcp__openbkn__bkn_start_interaction', arguments: '{"conversation_mode":"new","question":"secret-question"}' } },
    toolResult('c1', 1_140, '{"interaction_id":"int-1","conversation_id":"conv-1","execution_status":"in_progress"}'),
    { type: 'tool/call', time: 1_200, data: { turn: 3, step: 2, callId: 'c2', name: 'mcp__openbkn__search_schema', arguments: '{"query":"sales"}' } },
    toolResult('c2', 1_260, '{"object_types":[{"id":"ot-1"}]}'),
    { type: 'tool/call', time: 1_300, data: { turn: 3, step: 3, callId: 'c3', name: 'mcp__openbkn__query_object_instance', arguments: '{"filters":[{"field":"material_code","value":"382-000005"}]}' } },
    toolResult('c3', 1_400, '{"nodes":[1,2,3],"message":"ok"}'),
    { type: 'tool/call', time: 1_500, data: { turn: 3, step: 4, callId: 'c4', name: 'mcp__openbkn__query_object_instance', arguments: '{}' } },
    toolResult('c4', 1_560, '{"nodes":[4,5]}'),
    { type: 'tool/call', time: 1_600, data: { turn: 3, step: 5, callId: 'c5', name: 'mcp__openbkn__bkn_finish_interaction', arguments: '{"outcome":"completed"}' } },
    toolResult('c5', 1_630, '{"interaction_id":"int-1","conversation_id":"conv-1","execution_status":"completed","evidence_status":"complete"}'),
    { type: 'assistant/message', time: 1_700, data: { turn: 3, step: 6, message: { id: 'a1', role: 'assistant', content: [{ type: 'text', text: '40 张' }] } } },
  ]

  const nodes = buildTurnTimeline(events, { turn: 3 })

  assert.deepEqual(nodes.map(node => node.seq), [0, 1, 2, 3, 4, 5, 6])
  assert.deepEqual(nodes.map(node => node.kind), ['question', 'lifecycle', 'managed', 'managed', 'managed', 'lifecycle', 'answer'])
  assert.deepEqual(nodes.map(node => node.tool), [undefined, 'bkn_start_interaction', 'search_schema', 'query_object_instance', 'query_object_instance', 'bkn_finish_interaction', undefined])
  assert.equal(nodes[1]!.durationMs, 40)
  assert.equal(nodes[3]!.durationMs, 100)
  assert.equal(nodes[3]!.summary, 'query_object_instance · 3 项')
  assert.equal(nodes[1]!.summary, 'bkn_start_interaction · new · conversation: yes')
  assert.equal(nodes[5]!.summary, 'bkn_finish_interaction · completed')
  assert.equal(nodes[0]!.summary, '382-000005 有多少张销售订单？')
})

test('marks a failed call and keeps an unanswered call as a node without duration', () => {
  const events: Event[] = [
    { type: 'tool/call', time: 1_000, data: { turn: 3, step: 1, callId: 'c1', name: 'mcp__openbkn__query_metric', arguments: '{}' } },
    toolResult('c1', 1_050, '{"error":{"code":"x"}}', true),
    { type: 'tool/call', time: 1_100, data: { turn: 3, step: 2, callId: 'c2', name: 'mcp__openbkn__search_instance', arguments: '{}' } },
    // c2 has no tool/result: interrupted or timed out; the node must survive.
  ]

  const nodes = buildTurnTimeline(events, { turn: 3 })

  assert.deepEqual(nodes.map(node => [node.tool, node.outcome, node.durationMs]), [
    ['query_metric', 'error', 50],
    ['search_instance', undefined, undefined],
  ])
})

test('excludes non-OpenBKN tools and other turns', () => {
  const events: Event[] = [
    { type: 'user/message', time: 900, data: { turn: 2, message: { id: 'u0', role: 'user', content: [{ type: 'text', text: 'earlier' }] } } },
    { type: 'tool/call', time: 1_000, data: { turn: 3, step: 1, callId: 'c1', name: 'read', arguments: '{}' } },
    { type: 'tool/call', time: 1_100, data: { turn: 4, step: 1, callId: 'c2', name: 'mcp__openbkn__search_schema', arguments: '{}' } },
    toolResult('c2', 1_120, '{}'),
    { type: 'user/message', time: 1_200, data: { turn: 3, message: { id: 'u1', role: 'user', content: [{ type: 'text', text: 'q' }] } } },
  ]

  const nodes = buildTurnTimeline(events, { turn: 3 })
  assert.deepEqual(nodes.map(node => node.kind), ['question'])
})

test('recovers the turn from the final assistant message for v1 handles', () => {
  const events: Event[] = [
    { type: 'user/message', time: 1_000, data: { turn: 3, message: { id: 'u1', role: 'user', content: [{ type: 'text', text: 'q' }] } } },
    { type: 'tool/call', time: 1_100, data: { turn: 3, step: 1, callId: 'c1', name: 'mcp__openbkn__get_kn_detail', arguments: '{}' } },
    toolResult('c1', 1_150, '{"id":"kn-1"}'),
    { type: 'assistant/message', time: 1_300, data: { turn: 3, step: 2, message: { id: 'assistant-final', role: 'assistant', content: [{ type: 'text', text: 'a' }] } } },
    { type: 'assistant/message', time: 1_400, data: { turn: 4, step: 1, message: { id: 'assistant-next', role: 'assistant', content: [{ type: 'text', text: 'b' }] } } },
  ]

  assert.deepEqual(buildTurnTimeline(events, { messageId: 'assistant-final' }).map(node => node.kind), ['question', 'managed', 'answer'])
  assert.deepEqual(buildTurnTimeline(events, { messageId: 'missing' }), [])
})

test('never projects argument values or response bodies into summaries', () => {
  const events: Event[] = [
    { type: 'user/message', time: 1_000, data: { turn: 3, message: { id: 'u1', role: 'user', content: [{ type: 'text', text: 'q' }] } } },
    { type: 'tool/call', time: 1_100, data: { turn: 3, step: 1, callId: 'c1', name: 'mcp__openbkn__bkn_start_interaction', arguments: '{"conversation_mode":"new","question":"SENSITIVE-QUESTION-42","kn_id":"SENSITIVE-KN"}' } },
    toolResult('c1', 1_140, '{"interaction_id":"int-1","conversation_id":"SENSITIVE-CONV-ID","execution_status":"in_progress","echo":{"args":"SENSITIVE-ARGS"}}'),
    { type: 'tool/call', time: 1_200, data: { turn: 3, step: 2, callId: 'c2', name: 'mcp__openbkn__query_object_instance', arguments: '{"condition":"SENSITIVE-CONDITION"}' } },
    toolResult('c2', 1_260, '{"nodes":[{"name":"SENSITIVE-ROW-NAME"}],"message":"SENSITIVE-MESSAGE-TEXT"}'),
    { type: 'tool/call', time: 1_300, data: { turn: 3, step: 3, callId: 'c3', name: 'mcp__openbkn__run_code', arguments: '{"code":"SENSITIVE-CODE"}' } },
    toolResult('c3', 1_360, '{"stdout":"SENSITIVE-STDOUT"}'),
    { type: 'assistant/message', time: 1_500, data: { turn: 3, step: 4, message: { id: 'a1', role: 'assistant', content: [{ type: 'text', text: 'answer' }] } } },
  ]

  const serialized = JSON.stringify(buildTurnTimeline(events, { turn: 3 }))
  for (const leak of ['SENSITIVE-QUESTION-42', 'SENSITIVE-KN', 'SENSITIVE-CONV-ID', 'SENSITIVE-ARGS', 'SENSITIVE-CONDITION', 'SENSITIVE-ROW-NAME', 'SENSITIVE-MESSAGE-TEXT', 'SENSITIVE-CODE', 'SENSITIVE-STDOUT']) {
    assert.equal(serialized.includes(leak), false, leak)
  }
})
