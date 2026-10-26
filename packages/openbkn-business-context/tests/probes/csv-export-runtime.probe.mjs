#!/usr/bin/env node
/** Packed plugin on the official DSH ToolRuntime, without a model or live data.
 * Platform responses and native filesystem ports are controlled fixtures.
 * This proves scoped delivery/denial, not model answer truth or Desktop UX.
 */
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { parseArgs } from 'node:util'

const { values } = parseArgs({ options: { runtime: { type: 'string' }, plugin: { type: 'string' } } })
if (!values.runtime || !values.plugin) throw new Error('--runtime and --plugin are required')
const require = createRequire(resolve(values.runtime, 'package.json'))
const fromRuntime = name => import(pathToFileURL(require.resolve(`@deepseek-ai/${name}`)).href)
const [{ Context, Service }, { ToolRuntime }, { SystemPrompt }, { createMcpToolDefinition }] = await Promise.all([
  fromRuntime('cordis'), fromRuntime('dsh-tools'), fromRuntime('dsh-system-prompt'), fromRuntime('dsh-mcp-client'),
])
const { createScope } = await import(pathToFileURL(require.resolve('@deepseek-ai/dsh-scope', {
  paths: [dirname(require.resolve('@deepseek-ai/dsh-tools/package.json'))],
})).href)
const { mountBoundBusinessNetworkTool } = await import(pathToFileURL(resolve(values.plugin, 'lib/business.js')).href)
const fixture = JSON.parse(readFileSync(new URL('../fixtures/context-loader-tools-v0.2.0-release.json', import.meta.url)))
// Inline PTC is intentionally absent from the pure source projection. Use its
// separately recorded live schema instead of fabricating an empty definition.
const runCodeFixture = JSON.parse(readFileSync(new URL('../fixtures/context-loader-run-code-v0.2.0-live.json', import.meta.url)))
const bytes = Buffer.from('\ufeff物料,库存\r\nfixture-A,61950.0945\r\nfixture-B,3115901.5\r\n', 'utf8')
const sha256 = createHash('sha256').update(bytes).digest('hex')
const context = { conversation_id: 'conv-csv-probe', interaction_id: 'int-csv-probe' }
const args = { kn_id: 'kn-csv-probe', path: '库存.csv', bkn_context: context }
const config = { baseUrl: 'https://fixture.invalid', requestTimeoutMs: 1000, maxResultBytes: 1000000, allowInsecureTls: false }
const binding = { platformBaseUrl: config.baseUrl, knowledgeNetworkId: args.kn_id, displayName: 'CSV fixture' }
const CSV = 'openbkn_export_csv'
const oldHost = require('@deepseek-ai/dsh-tools/package.json').version === '0.2.0-rc.2'

async function scenario(captureDisabled) {
  const ctx = new Context(), files = new Map(), checks = []
  let reads = 0, writes = 0, readOnly = false, corrupt = false, sequence = 0
  const runContext = captureDisabled ? {
    conversation_id: fixture.lifecycleExamples.captureDisabledStart.conversation_id,
    interaction_id: fixture.lifecycleExamples.captureDisabledStart.interaction_id,
  } : context
  const input = { ...args, bkn_context: runContext }
  const fs = {
    resolve: async (path, options) => ({ displayPath: path.startsWith('/') ? path : options.cwd + '/' + path }),
    contains: (parent, child) => child.displayPath === parent.displayPath || child.displayPath.startsWith(parent.displayPath + '/'),
    processPath: target => target.displayPath,
    writeText: async (target, text, expected, _signal, policy) => {
      assert.equal(expected.kind, 'createIfAbsent'); assert.equal(policy.mode, 'workspace-write')
      assert.equal(files.has(target.displayPath), false)
      files.set(target.displayPath, Buffer.from(text)); writes++
    },
    readBytes: async target => files.get(target.displayPath),
  }
  try {
    await ctx.plugin(SystemPrompt)
    await ctx.plugin(ToolRuntime)
    for (const [name, port] of Object.entries({
      fs, ...oldHost ? {} : { workingDirectory: { ensure: async () => '/workspace' } },
      sandboxPolicy: { resolve: () => ({ mode: readOnly ? 'read-only' : 'workspace-write', workspaceRoot: '/workspace' }) },
    })) await ctx.plugin(class extends Service {
      constructor(scope) { super(scope, name); Object.assign(this, port) }
    })
    for (const name of ['bkn_start_interaction', 'run_code', 'bkn_finish_interaction']) {
      ctx.tools.register(createMcpToolDefinition(ctx, {
        name: 'mcp__openbkn__' + name, rawName: name, description: 'formal platform fixture', inputSchema: name === 'run_code' ? runCodeFixture.inputSchema : fixture.tools[name].inputSchema,
        call: async actual => {
          let body
          if (name === 'run_code') {
            reads++
            assert.deepEqual(actual.bkn_context, runContext)
            assert.ok(actual.code.includes('os.O_NOFOLLOW'))
            assert.ok(actual.code.includes('conv-' + runContext.conversation_id))
            body = { exit_code: 0, stderr: '', stdout: JSON.stringify({
              schema: 'openbkn.csv.v1', path: args.path, size: bytes.length,
              sha256: corrupt ? '0'.repeat(64) : sha256, data_base64: bytes.toString('base64'),
            }) }
          } else if (captureDisabled) body = fixture.lifecycleExamples[name === 'bkn_start_interaction' ? 'captureDisabledStart' : 'captureDisabledFinish']
          else body = { ...context, execution_status: name === 'bkn_start_interaction' ? 'active' : 'completed' }
          return { content: [{ type: 'text', text: JSON.stringify(body) }] }
        },
      }))
    }
    const agent = { id: 'csv-probe', session: { header: { cwd: oldHost ? '/workspace' : '/stale-initial-workspace' }, snapshotEvents: () => [] } }
    await createScope(ctx, agent).ctx.plugin({ inject: ['systemPrompt', 'tools'], apply(scoped) {
      agent.ctx = scoped
      assert.equal(mountBoundBusinessNetworkTool(agent, config, binding), true)
    } })
    await Promise.resolve(); await Promise.resolve()
    assert.ok(ctx.tools.get(CSV, agent))
    assert.equal(ctx.tools.get(CSV, { id: 'unrelated-agent' }), undefined)
    const call = (name, arguments_) => ctx.tools.execute({ name, arguments: arguments_, agent, callId: 'csv-probe-' + ++sequence, signal: AbortSignal.timeout(5000) })
    const denied = async (check, name, arguments_) => {
      const before = { reads, writes }
      assert.equal((await call(name, arguments_)).isError, true, check)
      assert.deepEqual({ reads, writes }, before, check + ': no platform dispatch or file write')
      checks.push(check)
    }
    await denied('closed Interaction', CSV, input)
    assert.notEqual((await call('mcp__openbkn__bkn_start_interaction', {
      conversation_mode: 'new', question: 'controlled CSV guard probe', agent_name: 'bkn-agent-dsh-business-context',
    })).isError, true)
    for (const [check, arguments_] of [
      ['wrong network', { ...input, kn_id: 'other' }],
      ['missing network', { path: args.path, bkn_context: runContext }],
      ['missing context', { kn_id: args.kn_id, path: args.path }],
      ['different Interaction', { ...input, bkn_context: { ...runContext, interaction_id: 'other' } }],
      ['different Conversation', { ...input, bkn_context: { ...runContext, conversation_id: 'other' } }],
      ['Windows star filename', { ...input, path: 'q*.csv' }],
      ['path traversal', { ...input, path: '../other.csv' }],
      ['absolute path', { ...input, path: '/other.csv' }],
      ['URL source', { ...input, path: 'https://other/file.csv' }],
    ]) await denied(check, CSV, arguments_)
    readOnly = true
    await denied('read-only Session', CSV, input)
    readOnly = false
    for (const name of ['read', 'grep', 'present', 'mcp__openbkn__run_shell']) await denied('Host/excluded ' + name, name, {})
    corrupt = true
    const invalid = await call(CSV, input)
    assert.equal(invalid.isError, true)
    assert.equal(writes, 0); assert.equal(reads, 1, JSON.stringify(invalid.content))
    checks.push('bad digest: retrieved but never written')
    corrupt = false
    const result = await call(CSV, input)
    assert.notEqual(result.isError, true, JSON.stringify(result.content))
    const saved = JSON.parse(result.content.find(block => block.type === 'text').text)
    assert.equal(saved.bytes, bytes.length); assert.equal(saved.sha256, sha256)
    assert.equal(saved.source_path, args.path)
    assert.equal('/workspace/' + decodeURIComponent(saved.markdown_link.slice(7, -2)), saved.path)
    assert.deepEqual(files.get(saved.path), bytes)
    assert.equal(reads, 2); assert.equal(writes, 1)
    checks.push('exact BOM/CRLF/UTF-8/fractional bytes and verified new path')
    assert.notEqual((await call('mcp__openbkn__bkn_finish_interaction', {
      interaction_id: runContext.interaction_id, outcome: 'completed', answer: 'controlled CSV guard probe completed',
    })).isError, true)
    await denied('finished Interaction', CSV, input)
    return { capture: captureDisabled ? 'disabled' : 'enabled', workspaceContract: oldHost ? 'immutable Session header; no workingDirectory service' : 'native workingDirectory service overrides initial header', checks, passed: true, reads, writes, unrelatedAgentInvisible: true }
  } finally { await ctx.fiber.dispose() }
}

console.log(JSON.stringify({
  evidence: 'packed plugin; official ToolRuntime; controlled platform and filesystem ports; no model',
  plugin: JSON.parse(readFileSync(resolve(values.plugin, 'package.json'))).version,
  dsh: require('@deepseek-ai/dsh-tools/package.json').version,
  scenarios: [await scenario(false), await scenario(true)],
}, null, 2))
