#!/usr/bin/env node
/** Manual, deterministic stop-boundary probe on official npm DSH packages.
 * The model and tools are scripted fixtures; this is runtime evidence, not
 * live provider/platform acceptance. No profile or credentials are opened.
 * --runtime <official DSH installation> --plugin <unpacked plugin package>
 */
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { parseArgs } from 'node:util'

const { values } = parseArgs({ options: { runtime: { type: 'string' }, plugin: { type: 'string' } } })
if (!values.runtime || !values.plugin) throw new Error('--runtime and --plugin are required')
const runtimeRequire = createRequire(resolve(values.runtime, 'package.json'))
const runtime = name => import(pathToFileURL(runtimeRequire.resolve(name)).href)
const [cordis, llm, session, projection, prompt, tools, registry, loop] = await Promise.all([
  'cordis', 'dsh-llm', 'dsh-session', 'dsh-session-projection', 'dsh-system-prompt',
  'dsh-tools', 'dsh-agent', 'dsh-agent-loop',
].map(name => runtime(`@deepseek-ai/${name}`)))
const { mountBoundBusinessNetworkTool } = await import(pathToFileURL(resolve(values.plugin, 'lib/business.js')).href)

const PREFIX = 'mcp__openbkn__'
const HEADER = '| 层级 | 父件 | 子件编码 | 子件名称 | 单耗 | 可用库存 | 库存单位 |\n|---|---|---|---|---|---|---|'
const GOOD = `${HEADER}\n| 1 | p | c | widget | 2 | 0* | ? |`
const BAD = GOOD.replace('0*', '99').replace(' ? |', ' 个 |')
const STDOUT = 'DETAIL_ROWS:1\nlevel|parent|child_code|child_name|std_usage|available_qty|uom\n1|p|c|widget|2|0*|?\nEMITTED:1'

function textResponse(text) {
  return [
    { type: 'block-start', index: 0, blockType: 'text' },
    { type: 'text-delta', index: 0, text },
    { type: 'block-end', index: 0, block: { type: 'text', text } },
    { type: 'finish', reason: { kind: 'stop' } },
  ]
}
function callResponse(name, args, id) {
  return [
    { type: 'block-start', index: 0, blockType: 'tool-call' },
    { type: 'block-end', index: 0, block: { type: 'tool-call', id: llm.ToolCallId(id), name: PREFIX + name, arguments: JSON.stringify(args) } },
    { type: 'finish', reason: { kind: 'tool-calls' } },
  ]
}

class ScriptedAdapter extends llm.LlmAdapter {
  requests = []
  constructor(script) { super(); this.script = [...script] }
  async resolveModel(provider, model) { return { provider, id: model, name: model } }
  async *stream(options) {
    this.requests.push(options)
    const response = this.script.shift()
    assert.ok(response, 'unexpected extra model attempt')
    for (const chunk of response) yield chunk
  }
}

async function scenario(secondAnswer, bound = true, firstAnswer = BAD, repairHandoff = false) {
  const ctx = new cordis.Context()
  const adapter = new ScriptedAdapter([
    callResponse('bkn_start_interaction', { conversation_mode: 'new' }, 'start'),
    callResponse('run_code', { kn_id: 'kn-probe' }, 'detail'),
    ...(repairHandoff ? [callResponse('run_code', { kn_id: 'kn-probe' }, 'cached-reprint')] : []),
    callResponse('bkn_finish_interaction', {}, 'finish'), textResponse(firstAnswer),
    ...(repairHandoff ? [] : [textResponse(secondAnswer)]),
  ])
  let dataCalls = 0
  let reprintCalls = 0
  const fibers = []
  try {
    for (const plugin of [llm.default, session.default, projection.default, prompt.default, tools.default, registry.default]) fibers.push(await ctx.plugin(plugin))
    fibers.push(await ctx.plugin(loop.default, { agents: [] }))
    ctx.llm.registerAdapter(['fixture'], adapter)
    const fixtures = [
      ['bkn_start_interaction', { conversation_mode: { type: 'string', required: true } }, () => JSON.stringify({ interaction_id: 'int-fixture', conversation_id: 'conv-fixture', execution_status: 'active' })],
      ['run_code', { kn_id: { type: 'string', required: true } }, () => {
        if (repairHandoff && dataCalls > 0) { reprintCalls++; return JSON.stringify({ stdout: STDOUT, exit_code: 0, stderr: '' }) }
        dataCalls++
        return JSON.stringify({ stdout: repairHandoff ? STDOUT.replace('level|parent|child_code|child_name|std_usage|available_qty|uom\n', '') : STDOUT, exit_code: 0, stderr: '' })
      }],
      ['bkn_finish_interaction', {}, () => JSON.stringify({ interaction_id: 'int-fixture', conversation_id: 'conv-fixture', execution_status: 'completed' })],
    ]
    for (const [name, parameters, execute] of fixtures) {
      ctx.tools.register(tools.defineContentToolFixture({ name: PREFIX + name, description: 'controlled runtime fixture', parameters,
        execute: async () => [{ type: 'text', text: execute() }],
      }))
    }
    const agent = await ctx.agentLoop.create(session.SessionId(`fidelity-${bound}-${secondAnswer === GOOD ? 'corrected' : 'failed'}`), { provider: 'fixture', model: 'fixture' })
    const mounted = mountBoundBusinessNetworkTool(agent, { baseUrl: 'https://fixture.invalid', requestTimeoutMs: 30_000, maxResultBytes: 1024, allowInsecureTls: false }, bound ? { platformBaseUrl: 'https://fixture.invalid', knowledgeNetworkId: 'kn-probe', displayName: 'Fixture' } : undefined)
    assert.equal(mounted, bound)
    agent.followup(llm.createUserMessage({ source: { kind: 'user' }, content: [{ type: 'text', text: '完整 BOM 清单，每个物料的使用量和库存' }] }))
    await agent.whenIdle()
    const events = agent.session.snapshotEvents()
    const turnStart = events.findIndex(event => event.type === 'turn/start')
    const human = events.findIndex(event => event.type === 'user/message' && event.data.source.kind === 'user')
    assert.ok(human > turnStart, 'official native log commits turn/start before the human message')
    assert.equal(events[human].data.turn, undefined, 'native UserMessage has no turn field')
    const ends = events.filter(event => event.type === 'turn/end')
    const notices = events.filter(event => event.type === 'user/message' && event.data.source.kind === 'openbkn-answer-fidelity')
    const answers = events.filter(event => event.type === 'assistant/message').flatMap(event => event.data.message.content.filter(block => block.type === 'text').map(block => block.text))
    const expectedReason = bound && secondAnswer !== GOOD ? 'error' : 'completed'
    assert.equal(ends.length, 1, 'correction stays in one turn')
    assert.equal(ends[0].data.reason.kind, expectedReason)
    assert.equal(notices.length, bound ? 1 : 0)
    assert.deepEqual(answers, bound && !repairHandoff ? [firstAnswer, secondAnswer] : [firstAnswer], 'all attempted answers remain in the native log')
    assert.equal(dataCalls, 1, 'no additional retrieval during correction')
    assert.equal(adapter.requests.length, bound ? 5 : 4, 'one correction budget only')
    if (expectedReason === 'error') assert.match(ends[0].data.reason.error.message, /OpenBKN answer validation failed after one correction/)
    if (repairHandoff) {
      assert.equal(reprintCalls, 1)
      assert.equal(notices[0].data.source.phase, 'tool-handoff')
      const noticeIndex = events.indexOf(notices[0])
      const finishIndex = events.findIndex(event => event.type === 'tool/call' && event.data.name === PREFIX + 'bkn_finish_interaction')
      assert.ok(noticeIndex < finishIndex, 'producer repair precedes closing the original Interaction')
      const raw = events.find(event => event.type === 'tool/result' && event.data.message.toolCallId === 'detail')
      assert.ok(!raw.data.message.content[0].text.includes('level|parent|child_code'), 'original headerless result remains unchanged')
    }
    return { scenario: repairHandoff ? 'headerless-cached-reprint' : !bound ? 'unbound-unaffected' : firstAnswer !== BAD ? 'full-question-summary-rejected' : secondAnswer === GOOD ? 'corrected-same-turn' : 'second-mismatch-errors', passed: true,
      turnReason: expectedReason, turns: ends.length, correctionNotices: notices.length, answerAttempts: answers.length, dataCalls, reprintCalls, modelCalls: adapter.requests.length,
      humanAfterTurnStart: human > turnStart, humanHasTurnField: false }
  } finally { for (const fiber of fibers.reverse()) await fiber.dispose() }
}

console.log(JSON.stringify({ evidence: 'official DSH runtime with scripted model and tool fixtures; no live platform/model', runtimeVersion: runtimeRequire('@deepseek-ai/dsh-agent-loop/package.json').version }))
for (const [answer, bound, first, repair] of [[GOOD, true, BAD], [BAD, true, BAD], [BAD, false, BAD], [GOOD, true, 'Complete detail exists; summary only.'], [GOOD, true, GOOD, true]]) console.log(JSON.stringify(await scenario(answer, bound, first, repair)))
