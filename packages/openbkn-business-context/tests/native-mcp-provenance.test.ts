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
        type: 'text', text: '{"execution_status":"completed","evidence_status":"complete","interaction_id":"int-7"}',
      }] }], role: 'user', id: 'tool-result' },
    } },
    { type: 'assistant/message', data: { turn: 7, step: 4, message: {
      id: 'assistant-final', role: 'assistant', content: [{ type: 'text', text: 'The final answer.' }], source: { kind: 'model' },
    } } },
  ], 7)

  assert.deepEqual(result, {
    messageId: 'assistant-final',
    handle: {
      schemaVersion: 1,
      interactionId: 'int-7',
      requestIds: [],
      traceIds: [],
      receiptIds: [],
      status: 'completed',
      partial: true,
    },
  })
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
