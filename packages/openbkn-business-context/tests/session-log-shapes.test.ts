/**
 * DSH 0.2 session logs: native v4 tool messages and v3 logs after DSH's own
 * v3→v4 migration. Fixtures are real logs reduced to structure and ids
 * (tests/fixtures/README.md records their origin).
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { lastConversationEvent } from '../src/interaction-lifecycle.ts'
import { findCompletedNativeMcpProvenance } from '../src/native-mcp-provenance.ts'
import { readBusinessNetworkBinding } from '../src/session-binding.ts'
import { toolResultIsError, toolResultTexts } from '../src/tool-result-message.ts'
import { buildTurnTimeline } from '../src/turn-timeline.ts'
import { readTurnProvenance } from '../src/turn-provenance.ts'

interface LoggedEvent { readonly type: string; readonly seq: number; readonly time: number; readonly data: unknown; readonly ignorable?: true }

function fixture(name: string): LoggedEvent[] {
  return JSON.parse(readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8')) as LoggedEvent[]
}

const MIGRATED = ['v3-migrated-session-5ef9.json', 'v3-migrated-session-0165.json', 'v3-migrated-session-7979.json']

const v4Message = (isError: boolean, text: string) => ({
  role: 'tool', toolCallId: 'c1', source: { kind: 'tool', callId: 'c1' }, isError, content: [{ type: 'text', text }],
})
const legacyMessage = (isError: boolean, text: string) => ({
  role: 'user', source: { kind: 'tool', callId: 'c1' },
  content: [{ type: 'tool-result', toolCallId: 'c1', isError, content: [{ type: 'text', text }] }],
})

test('reads tool text and failure from both logged tool-message generations', () => {
  assert.deepEqual(toolResultTexts(v4Message(false, '{"a":1}')), ['{"a":1}'])
  assert.deepEqual(toolResultTexts(legacyMessage(false, '{"a":1}')), ['{"a":1}'])
  assert.equal(toolResultIsError(v4Message(true, 'Error: x')), true)
  assert.equal(toolResultIsError(legacyMessage(true, 'Error: x')), true)
  assert.equal(toolResultIsError(v4Message(false, '{}')), false)
  assert.equal(toolResultIsError(legacyMessage(false, '{}')), false)
})

test('marks v4 and legacy failed tool results as errors in the turn timeline', () => {
  const events = (message: unknown) => [
    { type: 'tool/call', time: 1, data: { turn: 1, step: 1, callId: 'c1', name: 'mcp__openbkn__search_schema', arguments: '{}' } },
    { type: 'tool/result', time: 2, data: { turn: 1, step: 1, message } },
  ]
  const outcome = (message: unknown) => buildTurnTimeline(events(message), { turn: 1 }).find(node => node.kind !== 'question')?.outcome
  assert.equal(outcome(v4Message(true, 'Error: boom')), 'error')
  assert.equal(outcome(legacyMessage(true, 'Error: boom')), 'error')
  assert.equal(outcome(v4Message(false, '{"object_types":[]}')), 'ok')
})

test('a failed finish result never forms a completed provenance, whatever its text says', () => {
  const events = (message: unknown) => [
    { type: 'tool/call', data: { turn: 2, step: 1, callId: 'c1', name: 'mcp__openbkn__bkn_finish_interaction', arguments: '{}' } },
    { type: 'tool/result', data: { turn: 2, step: 1, message } },
    { type: 'assistant/message', data: { turn: 2, step: 2, message: { id: 'answer', role: 'assistant', content: [{ type: 'text', text: 'done' }] } } },
  ]
  const completed = '{"interaction_id":"int-2","execution_status":"completed"}'
  assert.equal(findCompletedNativeMcpProvenance(events(v4Message(false, completed)), 2)?.handle.interactionId, 'int-2')
  assert.equal(findCompletedNativeMcpProvenance(events(v4Message(true, completed)), 2), undefined)
  assert.equal(findCompletedNativeMcpProvenance(events(legacyMessage(true, completed)), 2), undefined)
})

test('recovers the completed interaction from the real official-desktop v4 log', () => {
  const events = fixture('v4-desktop-session.json')
  const provenance = findCompletedNativeMcpProvenance(events, 1)
  assert.equal(provenance?.messageId, '6d436f3f-8b25-48df-812b-23c36fc7dd65')
  assert.equal(provenance?.handle.interactionId, 'int_ef93dd3f5e9863ffa44263d2a3dec1f9')
  assert.equal(provenance?.handle.conversationId, 'conv_33a3242d7e5360400303c4dbc7181fde')
  const nodes = buildTurnTimeline(events, { turn: 1 })
  assert.equal(nodes.filter(node => node.kind !== 'question' && node.kind !== 'answer').length, 6)
  assert.ok(nodes.every(node => node.outcome !== 'error'))
})

test('reads plugin records that DSH renamed to plugin:openbkn/* while migrating v3 logs', () => {
  for (const name of MIGRATED) {
    const events = fixture(name)
    assert.ok(events.some(event => event.type === 'plugin:openbkn/business-network-bound'), name)
    assert.equal(events.some(event => event.type.startsWith('openbkn/')), false, name)
    assert.equal(readBusinessNetworkBinding(events)?.knowledgeNetworkId !== undefined, true, name)
    assert.notEqual(lastConversationEvent(events), undefined, name)
    for (const recorded of events.filter(event => event.type === 'plugin:openbkn/turn-provenance')) {
      const { messageId, handle } = recorded.data as { messageId: string; handle: { interactionId: string } }
      assert.equal(readTurnProvenance(events, messageId)?.interactionId, handle.interactionId, `${name} ${messageId}`)
    }
  }
})

test('every provenance recorded in the migrated logs is re-derivable from the logged tool results', () => {
  let compared = 0
  for (const name of MIGRATED) {
    const events = fixture(name)
    for (const recorded of events.filter(event => event.type === 'plugin:openbkn/turn-provenance')) {
      const { messageId, handle } = recorded.data as { messageId: string; handle: { interactionId: string; status: string; turn?: number } }
      // Handle v1 records carry no turn; the answer message locates it.
      const turn = handle.turn ?? (events.find(event => event.type === 'assistant/message'
        && (event.data as { message: { id: string } }).message.id === messageId)?.data as { turn: number } | undefined)?.turn
      assert.notEqual(turn, undefined, `${name} ${messageId}`)
      const derived = findCompletedNativeMcpProvenance(events, turn!)
      assert.equal(derived?.messageId, messageId, `${name} turn ${turn}`)
      assert.equal(derived?.handle.interactionId, handle.interactionId, `${name} turn ${turn}`)
      assert.equal(derived?.handle.status, handle.status, `${name} turn ${turn}`)
      compared += 1
    }
  }
  assert.equal(compared, 2 + 6 + 19)
})
