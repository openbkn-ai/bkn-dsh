#!/usr/bin/env node
/** Official npm DSH runtime with scripted model/tool fixtures. No live model,
 * platform, profile or credentials. --runtime <install> --plugin <unpacked tgz>
 * These assertions check native delivery and access governance, not answer truth.
 */
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { parseArgs } from 'node:util'

const { values } = parseArgs({ options: { runtime: { type: 'string' }, plugin: { type: 'string' } } })
if (!values.runtime || !values.plugin) throw new Error('--runtime and --plugin are required')
const runtimeRequire = createRequire(resolve(values.runtime, 'package.json'))
const [cordis, llm, session, projection, prompt, tools, registry, loop] = await Promise.all([
  'cordis', 'dsh-llm', 'dsh-session', 'dsh-session-projection', 'dsh-system-prompt', 'dsh-tools', 'dsh-agent', 'dsh-agent-loop',
].map(name => import(pathToFileURL(runtimeRequire.resolve(`@deepseek-ai/${name}`)).href)))
const { mountBoundBusinessNetworkTool } = await import(pathToFileURL(resolve(values.plugin, 'lib/business.js')).href)
const PREFIX = 'mcp__openbkn__'
function response(block, reason) {
  return [{ type: 'block-start', index: 0, blockType: block.type }, { type: 'block-end', index: 0, block }, { type: 'finish', reason: { kind: reason } }]
}
const call = (name, args, id) => response({ type: 'tool-call', id: llm.ToolCallId(id), name: PREFIX + name, arguments: JSON.stringify(args) }, 'tool-calls')
const answer = text => response({ type: 'text', text }, 'stop')
class Adapter extends llm.LlmAdapter {
  calls = 0
  constructor(script) { super(); this.script = [...script] }
  async resolveModel(provider, model) { return { provider, id: model, name: model } }
  async *stream() {
    this.calls++
    const chunks = this.script.shift()
    assert.ok(chunks, 'the plugin must not add a model attempt')
    for (const chunk of chunks) yield chunk
  }
}
async function scenario(spec) {
  const ctx = new cordis.Context(), fibers = [], dispatched = []
  const args = { kn_id: spec.crossNetwork ? 'other-network' : 'kn-probe', code: 'unchanged fixture code' }
  const toolName = spec.excluded ? 'run_shell' : 'run_code'
  const script = [
    ...(spec.beforeStart ? [call('run_code', args, 'before-start')] : []),
    call('bkn_start_interaction', { conversation_mode: 'new' }, 'start'),
    call(toolName, args, 'data'), call('bkn_finish_interaction', {}, 'finish'), answer(spec.answer),
  ]
  const adapter = new Adapter(script)
  try {
    for (const plugin of [llm.default, session.default, projection.default, prompt.default, tools.default, registry.default]) fibers.push(await ctx.plugin(plugin))
    fibers.push(await ctx.plugin(loop.default, { agents: [] }))
    ctx.llm.registerAdapter(['fixture'], adapter)
    for (const [name, parameters] of [
      ['bkn_start_interaction', { conversation_mode: { type: 'string', required: true } }],
      ['run_code', { kn_id: { type: 'string', required: true }, code: { type: 'string', required: true } }],
      ['run_shell', { kn_id: { type: 'string', required: true }, code: { type: 'string', required: true } }],
      ['bkn_finish_interaction', {}],
    ]) ctx.tools.register(tools.defineContentToolFixture({ name: PREFIX + name, description: 'controlled native-output fixture', parameters,
      execute: async args => {
        dispatched.push({ name, args })
        if (name === 'run_code' && spec.toolError) throw new Error('fixture platform unavailable')
        const text = name === 'bkn_start_interaction'
          ? JSON.stringify({ interaction_id: 'int-fixture', conversation_id: 'conv-fixture', execution_status: 'active' })
          : name === 'bkn_finish_interaction'
            ? JSON.stringify({ interaction_id: 'int-fixture', conversation_id: 'conv-fixture', execution_status: 'completed' })
            : JSON.stringify({ stdout: spec.stdout, exit_code: 0, stderr: '' })
        return [{ type: 'text', text }]
      },
    }))
    const agent = await ctx.agentLoop.create(session.SessionId(`native-${spec.name}`), { provider: 'fixture', model: 'fixture' })
    const bound = spec.bound !== false
    assert.equal(mountBoundBusinessNetworkTool(agent, { baseUrl: 'https://fixture.invalid', requestTimeoutMs: 30_000, maxResultBytes: 1024, allowInsecureTls: false }, bound ? { platformBaseUrl: 'https://fixture.invalid', knowledgeNetworkId: 'kn-probe', displayName: 'Fixture' } : undefined), bound)
    agent.followup(llm.createUserMessage({ source: { kind: 'user' }, content: [{ type: 'text', text: spec.question ?? '完整 BOM 清单，每个物料的使用量和库存' }] }))
    await agent.whenIdle()
    const events = agent.session.snapshotEvents()
    const ends = events.filter(event => event.type === 'turn/end')
    assert.equal(ends.length, 1)
    assert.equal(ends[0].data.reason.kind, 'completed')
    assert.equal(events.filter(event => event.type === 'user/message' && event.data.source.kind !== 'user').length, 0, 'no correction notice')
    const answers = events.filter(event => event.type === 'assistant/message').flatMap(event => event.data.message.content.filter(block => block.type === 'text').map(block => block.text))
    assert.deepEqual(answers, [spec.answer], 'native answer is delivered unchanged')
    assert.equal(adapter.calls, script.length, 'no plugin corrective model calls')
    const data = events.find(event => event.type === 'tool/result' && event.data.message.toolCallId === 'data').data.message
    const denied = spec.crossNetwork || spec.excluded
    assert.equal(data.isError === true, Boolean(spec.toolError || denied))
    if (denied) assert.equal(dispatched.filter(item => item.name === toolName).length, 0, 'guard denial never dispatches')
    else {
      assert.deepEqual(dispatched.find(item => item.name === 'run_code').args, args)
      if (spec.toolError) assert.match(data.content.filter(block => block.type === 'text').map(block => block.text).join('\n'), /fixture platform unavailable/)
      else assert.equal(data.content[0].text, JSON.stringify({ stdout: spec.stdout, exit_code: 0, stderr: '' }), 'original tool bytes preserved')
    }
    if (spec.beforeStart) {
      assert.equal(events.find(event => event.type === 'tool/result' && event.data.message.toolCallId === 'before-start').data.message.isError, true)
      assert.equal(dispatched.filter(item => item.name === 'run_code').length, 1, 'only the post-start call dispatches')
    }
    return { scenario: spec.name, passed: true, turnReason: 'completed', answerAttempts: answers.length, correctionNotices: 0, modelCalls: adapter.calls, dataCalls: dispatched.filter(item => item.name === 'run_code').length, answerTruth: 'not evaluated by runtime probe' }
  } finally { for (const fiber of fibers.reverse()) await fiber.dispose() }
}
console.log(JSON.stringify({ evidence: 'official DSH runtime; scripted fixtures only', runtimeVersion: runtimeRequire('@deepseek-ai/dsh-agent-loop/package.json').version }))
for (const spec of [
  { name: 'native-answer-no-arbitration', stdout: '1|p|c|part|2|0|个', answer: 'A deliberately mismatched model answer: quantity 99.' },
  { name: 'headerless-output', stdout: 'DETAIL_ROWS:1\n1|p|c|part|2|0*|?\nEMITTED:1', answer: 'The model chooses prose.' },
  { name: 'scientific-notation-structure', stdout: 'DETAIL_ROWS:2\n1|p|c|part|2|1.51603e+06|个|12\nEMITTED:1', answer: 'A structure summary.', question: '382-000005 的 BOM 构成是什么？' },
  { name: 'native-tool-error', toolError: true, answer: 'The platform call failed.' },
  { name: 'cross-network-denied', crossNetwork: true, answer: 'The request was denied.' },
  { name: 'before-start-denied', beforeStart: true, stdout: 'original data', answer: 'After starting, the request succeeded.' },
  { name: 'excluded-tool-denied', excluded: true, answer: 'This tool is unavailable.' },
  { name: 'unbound-unaffected', bound: false, stdout: 'original data', answer: 'Original unbound answer.' },
]) console.log(JSON.stringify(await scenario(spec)))
