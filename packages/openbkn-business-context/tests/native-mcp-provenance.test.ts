import assert from 'node:assert/strict'
import test from 'node:test'
import { findCompletedNativeMcpProvenance } from '../src/native-mcp-provenance.ts'

const finishCallId = 'call-finish'

test('associates an explicitly completed OpenBKN MCP interaction with its final assistant answer', () => {
  const result = findCompletedNativeMcpProvenance([
    { type: 'assistant/message', data: { turn: 7, step: 3, message: {
      id: 'assistant-answer', role: 'assistant', content: [
        { type: 'text', text: 'The answer.' },
        { type: 'tool-call', id: finishCallId, name: 'mcp__openbkn__bkn_finish_interaction', arguments: '{}' },
      ], source: { kind: 'model' },
    } } },
    { type: 'tool/call', data: { turn: 7, step: 3, callId: finishCallId, name: 'mcp__openbkn__bkn_finish_interaction', arguments: '{}' } },
    { type: 'tool/result', data: { turn: 7, step: 3, message: {
      source: { kind: 'tool', callId: finishCallId }, content: [{ type: 'tool-result', toolCallId: finishCallId, content: [{
        type: 'text', text: '{"execution_status":"completed","evidence_status":"complete","interaction_id":"int-7","conversation_id":"conv-7"}',
      }] }], role: 'user', id: 'tool-result' },
    } },
    { type: 'assistant/message', data: { turn: 7, step: 4, message: {
      id: 'assistant-final', role: 'assistant', content: [{ type: 'text', text: 'The final answer.' }], source: { kind: 'model' },
    } } },
  ], 7)

  assert.deepEqual(result, {
    messageId: 'assistant-final',
    handle: {
      schemaVersion: 2,
      interactionId: 'int-7',
      requestIds: [],
      traceIds: [],
      receiptIds: [],
      status: 'completed',
      partial: true,
      conversationId: 'conv-7',
      turn: 7,
    },
  })
})

test('keeps a handle v2 without a conversation id when the finish response omits one', () => {
  const result = findCompletedNativeMcpProvenance([
    { type: 'tool/call', data: { turn: 3, step: 1, callId: finishCallId, name: 'mcp__openbkn__bkn_finish_interaction', arguments: '{}' } },
    { type: 'tool/result', data: { turn: 3, step: 1, message: {
      source: { kind: 'tool', callId: finishCallId }, content: [{ type: 'tool-result', toolCallId: finishCallId, content: [{
        type: 'text', text: '{"execution_status":"completed","interaction_id":"int-3"}',
      }] }], role: 'user', id: 'tool-result' },
    } },
    { type: 'assistant/message', data: { turn: 3, step: 2, message: {
      id: 'assistant-final', role: 'assistant', content: [{ type: 'text', text: 'Done.' }], source: { kind: 'model' },
    } } },
  ], 3)

  assert.equal(result?.handle.conversationId, undefined)
  assert.equal('conversationId' in (result?.handle ?? {}), false)
})

test('does not fabricate provenance when the current turn has no completed OpenBKN interaction', () => {
  assert.equal(findCompletedNativeMcpProvenance([
    { type: 'assistant/message', data: { turn: 8, step: 1, message: {
      id: 'assistant-without-trace', role: 'assistant', content: [{ type: 'text', text: 'No trace.' }], source: { kind: 'model' },
    } } },
  ], 8), undefined)
})

test('rejects an uncompleted or ambiguous OpenBKN interaction', () => {
  const events = (status: string, interactionId: string) => [
    { type: 'assistant/message', data: { turn: 9, step: 1, message: {
      id: `assistant-${interactionId}`, role: 'assistant', content: [
        { type: 'tool-call', id: `call-${interactionId}`, name: 'mcp__openbkn__bkn_finish_interaction', arguments: '{}' },
      ], source: { kind: 'model' },
    } } },
    { type: 'tool/call', data: { turn: 9, step: 1, callId: `call-${interactionId}`, name: 'mcp__openbkn__bkn_finish_interaction', arguments: '{}' } },
    { type: 'tool/result', data: { turn: 9, step: 1, message: {
      source: { kind: 'tool', callId: `call-${interactionId}` }, content: [{ type: 'tool-result', toolCallId: `call-${interactionId}`, content: [{
        type: 'text', text: JSON.stringify({ execution_status: status, interaction_id: interactionId }),
      }] }], role: 'user', id: `result-${interactionId}` },
    } },
  ]
  assert.equal(findCompletedNativeMcpProvenance(events('failed', 'int-failed'), 9), undefined)
  assert.equal(findCompletedNativeMcpProvenance([...events('completed', 'int-a'), ...events('completed', 'int-b')], 9), undefined)
})

test('explicit unrecorded finish is associated only with its own final answer and has no invented IDs', async () => {
  for (const reply of [
    { trace_recorded: false, capture_enabled: false, code: 'capture_disabled', required_action: 'continue_without_bkn_context' },
    { trace_recorded: false, trace_available: false, stage: 'finish_interaction', code: 'trace_core_unavailable', required_action: 'continue_without_bkn_context' },
  ]) {
    const events = [
      { type: 'tool/call', data: { turn: 2, callId: finishCallId, name: 'mcp__openbkn__bkn_finish_interaction' } },
      { type: 'tool/result', data: { turn: 2, message: { source: { kind: 'tool', callId: finishCallId }, content: [{ type: 'text', text: JSON.stringify(reply) }] } } },
      { type: 'assistant/message', data: { turn: 2, message: { id: 'answer', content: [{ type: 'text', text: 'Native answer' }] } } },
    ]
    const result = findCompletedNativeMcpProvenance(events, 2)
    assert.equal(result?.messageId, 'answer')
    assert.equal(result?.handle.interactionId, undefined)
    assert.equal(result?.handle.conversationId, undefined)
    assert.equal(result?.handle.recording, reply.capture_enabled === false ? 'disabled' : 'unavailable')
    assert.deepEqual(result?.handle.receiptIds, [])
    const { normalizeProvenanceHandle } = await import('../src/provenance-handle.ts')
    assert.deepEqual(normalizeProvenanceHandle(result?.handle), result?.handle)
    assert.throws(() => normalizeProvenanceHandle({ ...result?.handle, interactionId: 'old-int' }))
    assert.throws(() => normalizeProvenanceHandle({ ...result?.handle, receiptIds: ['fake'] }))
    assert.equal(findCompletedNativeMcpProvenance(events, 1), undefined)
  }
})
