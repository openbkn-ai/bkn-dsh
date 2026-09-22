#!/usr/bin/env node
/**
 * V0 probe: DSH 0.1.6-alpha.2 event model & guard timing, run against the real
 * runtime packages (npm `0.1.6-alpha.2`, the plugin's own pinned dependencies).
 *
 * Manual only — NOT part of CI or the published package (`files` lists `lib/`
 * only; `tests/` never ships). Re-run after every DSH upgrade: `tools/result`
 * scoping, `exec.agent` presence, and guard ordering are the foundation of
 * `docs/plans/2026-09-20-interaction-noise-reduction.md` (§2).
 *
 * Usage (from packages/openbkn-business-context):
 *   node tests/probes/dsh-event-model.probe.mjs            # V0-1..V0-4, local runtime
 *   OPENBKN_PROBE_INSECURE_TLS=1 \
 *     node tests/probes/dsh-event-model.probe.mjs --v0-6   # + V0-6 platform shapes and
 *                                                           #   V0-7 production-chain extraction
 *                                                           #   (requires a built lib/ and the
 *                                                           #   OpenBKN CLI token)
 *
 * Output: one JSON line per check `{ check, dshVersion, command, observation,
 * verdict }`. Observations carry counts, booleans, error codes, and tool short
 * names only — never arguments, response bodies, business data, or credentials.
 */
import { execFile } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { Context } from '@deepseek-ai/cordis'
import { ToolRuntime, defineTool } from '@deepseek-ai/dsh-tools'
import { SystemPrompt } from '@deepseek-ai/dsh-system-prompt'
import { createRequire } from 'node:module'
import { dirname } from 'node:path'
import { pathToFileURL } from 'node:url'
import { promisify } from 'node:util'

const runCli = promisify(execFile)
const require = createRequire(import.meta.url)
// `@deepseek-ai/dsh-scope` is a transitive dependency of dsh-tools; resolve it
// from dsh-tools' own install path so the probe uses exactly the runtime's copy.
const scopeEntry = require.resolve('@deepseek-ai/dsh-scope', {
  paths: [dirname(require.resolve('@deepseek-ai/dsh-tools/package.json'))],
})
const { createScope } = await import(pathToFileURL(scopeEntry).href)

const dshVersion = await readDshVersion()
const command = `node tests/probes/dsh-event-model.probe.mjs${process.argv.includes('--v0-6') ? ' --v0-6' : ''}`
const evidence = []

function record(check, observation, verdict) {
  evidence.push({ check, dshVersion, command, observation, verdict })
  console.log(JSON.stringify(evidence.at(-1)))
}

async function readDshVersion() {
  const pkg = JSON.parse(await readFile(require.resolve('@deepseek-ai/dsh-tools/package.json'), 'utf8'))
  return `@deepseek-ai/dsh-tools@${pkg.version} (npm)`
}

// ---------------------------------------------------------------------------
// Real-runtime scaffold: root cordis Context, SystemPrompt + ToolRuntime, and
// two agent scopes minted exactly the way the agent package does (opaque key
// objects; `exec.agent` is the scope key itself).
// ---------------------------------------------------------------------------

const freshSignal = () => new AbortController().signal

const LIFECYCLE = ['bkn_start_interaction', 'bkn_finish_interaction']
const probeToolNames = [...LIFECYCLE, 'search_schema', 'query_object_instance']

async function scaffold() {
  const ctx = new Context()
  await ctx.plugin(SystemPrompt)
  await ctx.plugin(ToolRuntime)
  const agents = { a: { id: 'probe-agent-a' }, b: { id: 'probe-agent-b' } }
  const scopes = {
    a: createScope(ctx, agents.a),
    b: createScope(ctx, agents.b),
  }
  return { ctx, agents, scopes }
}

/** Register probe stand-ins for the managed OpenBKN tool names. */
function registerProbeTools(ctx, behaviours = {}) {
  for (const name of probeToolNames) {
    const behaviour = behaviours[name] ?? {}
    ctx.tools.register(defineTool({
      name: `mcp__openbkn__${name}`,
      description: `probe stand-in for ${name}`,
      parameters: behaviour.parameters ?? {},
      output: {
        schema: { type: 'json' },
        render: (args, value) => [{ type: 'text', text: JSON.stringify(value) }],
      },
      execute: behaviour.execute ?? (async () => ({})),
    }))
  }
}

function execute(ctx, name, agent, args = {}, signal = freshSignal()) {
  return ctx.tools.execute({ callId: `probe-${name}-${agent.id}`, name: `mcp__openbkn__${name}`, arguments: args, agent, signal })
}

// ---------------------------------------------------------------------------
// V0-1: agent-scoped `tools/result` receives only its own Agent's calls.
// Cross two agents' calls, then also observe an untagged (service-level)
// listener as the documented contrast for constraint C1.
// ---------------------------------------------------------------------------
async function checkV0_1() {
  const { ctx, agents, scopes } = await scaffold()
  const scopedSeen = { a: [], b: [] }
  const untaggedSeen = []
  for (const key of ['a', 'b']) {
    scopes[key].ctx.plugin({
      name: `probe-v01-${key}`,
      inject: ['tools'],
      apply(sctx) {
        sctx.on('tools/result', exec => { scopedSeen[key].push(exec.agent === agents[key] ? exec.name : 'FOREIGN') })
      },
    })
  }
  ctx.plugin({
    name: 'probe-v01-untagged',
    inject: ['tools'],
    apply(sctx) { sctx.on('tools/result', exec => { untaggedSeen.push(exec.name) }) },
  })
  registerProbeTools(ctx)
  await execute(ctx, 'bkn_start_interaction', agents.a)
  await execute(ctx, 'bkn_start_interaction', agents.b)
  await execute(ctx, 'search_schema', agents.a)
  await execute(ctx, 'search_schema', agents.b)
  const scopedOwnOnly = scopedSeen.a.length === 2 && scopedSeen.b.length === 2
    && scopedSeen.a.every(name => name !== 'FOREIGN') && scopedSeen.b.every(name => name !== 'FOREIGN')
  const untaggedSeesAll = untaggedSeen.length === 4
  record('V0-1 agent-scoped tools/result only receives its own Agent', {
    scopedCallsReceived: { a: scopedSeen.a.length, b: scopedSeen.b.length },
    foreignEventsSeen: scopedSeen.a.includes('FOREIGN') || scopedSeen.b.includes('FOREIGN'),
    untaggedListenerSeesAllAgents: untaggedSeesAll,
  }, scopedOwnOnly && untaggedSeesAll ? 'pass' : 'fail')
  await teardown(ctx)
}

// ---------------------------------------------------------------------------
// V0-2: guard sees `exec.agent` for agent-carried executions; executions
// without an agent bypass the scoped guard entirely (constraint C3).
// ---------------------------------------------------------------------------
async function checkV0_2() {
  const { ctx, agents, scopes } = await scaffold()
  let guardInvocations = 0
  let guardAgentMissing = 0
  scopes.a.ctx.plugin({
    name: 'probe-v02',
    inject: ['tools'],
    apply(sctx) {
      sctx.tools.guard(exec => {
        guardInvocations += 1
        if (exec.agent === undefined) guardAgentMissing += 1
        return undefined
      })
    },
  })
  registerProbeTools(ctx)
  await execute(ctx, 'bkn_start_interaction', agents.a)
  const agentPresentCalls = guardInvocations
  await ctx.tools.execute({ callId: 'probe-standalone', name: 'mcp__openbkn__search_schema', arguments: {}, signal: freshSignal() })
  record('V0-2 model-path guard coverage: exec.agent present; agentless execution bypasses scoped guard', {
    guardInvocationsForAgentCall: agentPresentCalls,
    guardAgentMissingCount: guardAgentMissing,
    guardInvocationsAfterAgentlessCall: guardInvocations,
  }, agentPresentCalls === 1 && guardAgentMissing === 0 && guardInvocations === 1 ? 'pass' : 'fail')
  await teardown(ctx)
}

// ---------------------------------------------------------------------------
// V0-3: a synchronous `tools/result` listener updates state before the next
// guard judgment (constraint C2). start success → managed call passes the
// gate that reads that state.
// ---------------------------------------------------------------------------
async function checkV0_3() {
  const { ctx, agents, scopes } = await scaffold()
  const state = { open: false }
  let misordered = false
  scopes.a.ctx.plugin({
    name: 'probe-v03',
    inject: ['tools'],
    apply(sctx) {
      sctx.on('tools/result', (exec, result) => {
        if (exec.name === 'mcp__openbkn__bkn_start_interaction' && result.isError === false) state.open = true
      })
      sctx.tools.guard(exec => {
        if (exec.name === 'mcp__openbkn__query_object_instance' && !state.open) {
          misordered = true
          return 'interaction state had not been updated when the next guard ran'
        }
        return undefined
      })
    },
  })
  registerProbeTools(ctx, {})
  const started = await execute(ctx, 'bkn_start_interaction', agents.a)
  const queried = await execute(ctx, 'query_object_instance', agents.a)
  record('V0-3 synchronous tools/result listener updates state before the next guard judgment', {
    startResultIsError: started.isError,
    managedCallGuardDenied: misordered,
    managedCallIsError: queried.isError,
  }, started.isError === false && !misordered && queried.isError === false ? 'pass' : 'fail')
  await teardown(ctx)
}

// ---------------------------------------------------------------------------
// V0-4: every terminal path still emits `tools/result` (constraint C4):
// tool throw, abort before dispatch, abort during the body.
// ---------------------------------------------------------------------------
async function checkV0_4() {
  const { ctx, agents, scopes } = await scaffold()
  const seen = []
  scopes.a.ctx.plugin({
    name: 'probe-v04',
    inject: ['tools'],
    apply(sctx) { sctx.on('tools/result', (exec, result) => { seen.push({ tool: exec.name.slice('mcp__openbkn__'.length), isError: result.isError, code: result.isError ? result.error?.info?.code : undefined }) }) },
  })
  registerProbeTools(ctx, {
    query_object_instance: { execute: async () => { throw new Error('probe tool failure') } },
    search_schema: { execute: (args, exec) => new Promise((_resolve, reject) => { exec.signal.addEventListener('abort', () => reject(exec.signal.reason)) }) },
  })
  const thrown = await execute(ctx, 'query_object_instance', agents.a)
  const thrownSeen = seen.some(entry => entry.tool === 'query_object_instance' && entry.isError)
  const abortBefore = new AbortController()
  abortBefore.abort()
  const beforeDispatch = await execute(ctx, 'bkn_start_interaction', agents.a, {}, abortBefore.signal)
  const beforeSeen = seen.find(entry => entry.tool === 'bkn_start_interaction' && entry.isError)
  const abortDuring = new AbortController()
  const duringPromise = execute(ctx, 'search_schema', agents.a, {}, abortDuring.signal)
  await new Promise(resolve => setImmediate(resolve))
  abortDuring.abort()
  const duringResult = await duringPromise
  const duringSeen = seen.some(entry => entry.tool === 'search_schema' && entry.isError)
  record('V0-4 cancellation/throw paths still emit tools/result', {
    throwPathResultEmitted: thrownSeen && thrown.isError === true,
    abortBeforeDispatchResultEmitted: beforeDispatch.isError === true && beforeSeen !== undefined,
    abortBeforeDispatchCode: beforeSeen?.code,
    abortDuringBodyResultEmitted: duringSeen && duringResult.isError === true,
    abortDuringBodyCode: seen.filter(entry => entry.tool === 'search_schema' && entry.isError).map(entry => entry.code),
  }, thrownSeen && beforeDispatch.isError === true && duringSeen ? 'pass' : 'fail')
  await teardown(ctx)
}

async function teardown(ctx) {
  try { await ctx.destroy() } catch { /* root context teardown shape varies; probe process exits anyway */ }
}

// ---------------------------------------------------------------------------
// V0-6 (optional, --v0-6): platform-side machine-readable shapes for an
// invalid conversation on `bkn_start_interaction --conversation_mode continue`,
// contrasted with parameter-error, unauthenticated, and timeout shapes.
// No successful `new` interaction is ever started, so the probe leaves no
// interaction behind.
// ---------------------------------------------------------------------------

const MCP_ENDPOINT_PATH = '/api/agent-retrieval/v1/mcp/'

async function checkV0_6() {
  const baseUrl = process.env.OPENBKN_BASE_URL ?? 'https://192.168.50.28'
  // Dev platforms run self-signed TLS; the probe must opt in explicitly.
  // Test probe against a local self-signed dev platform only; explicitly
  // opt-in via OPENBKN_PROBE_INSECURE_TLS, never set in production paths.
  if (process.env.OPENBKN_PROBE_INSECURE_TLS === '1') process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0' // codeql[js/disabling-certificate-validation]
  let token
  try {
    ({ stdout: token } = await runCli('openbkn', ['auth', 'token']))
    token = token.trim()
  } catch (error) {
    record('V0-6 platform invalid-conversation error shapes', {
      skipped: true,
      reason: 'openbkn CLI token unavailable',
    }, 'not-run')
    return
  }
  const { Client, StreamableHTTPClientTransport } = await importMcpClient()
  const connect = async (authorization) => {
    const client = new Client({ name: 'bkn-dsh-v0-probe', version: '0.0.0' })
    await client.connect(new StreamableHTTPClientTransport(new URL(MCP_ENDPOINT_PATH, baseUrl), {
      requestInit: { headers: { Authorization: `Bearer ${authorization}` } },
    }))
    return client
  }
  const describe = (value) => {
    if (value instanceof Error) {
      return { transportError: value.name, rpcCode: typeof value.code === 'number' ? value.code : undefined }
    }
    const text = Array.isArray(value?.content)
      ? value.content.filter(block => block?.type === 'text').map(block => block.text).join(' ')
      : ''
    return {
      toolIsError: value?.isError === true,
      // Bounded, payload-free: only code-like JSON field values, never prose.
      codeTokens: extractCodeTokens(text),
    }
  }
  const client = await connect(token)
  const call = (args, timeoutMs) => client.callTool({
    name: 'bkn_start_interaction',
    arguments: args,
  }, undefined, { timeout: timeoutMs, resetTimeoutOnProgress: false })

  const invalidConversation = await capture(() => call({
    conversation_mode: 'continue',
    conversation_id: 'probe-forged-conversation-id',
    question: 'probe: invalid conversation probe',
    agent_name: 'bkn-agent-dsh-business-context',
  }))
  const parameterError = await capture(() => call({
    conversation_mode: 'not-a-mode',
    question: 'probe: parameter shape probe',
    agent_name: 'bkn-agent-dsh-business-context',
  }))
  await client.close()
  const unauthenticated = await capture(async () => {
    const bad = await connect('probe-invalid-token')
    try { return await bad.callTool({ name: 'bkn_start_interaction', arguments: { conversation_mode: 'new', question: 'probe: auth shape probe', agent_name: 'bkn-agent-dsh-business-context' } }) } finally { await bad.close() }
  })
  const timedOut = await capture(() => call({
    conversation_mode: 'continue',
    conversation_id: 'probe-forged-conversation-id',
    question: 'probe: timeout shape probe',
    agent_name: 'bkn-agent-dsh-business-context',
  }, 1))

  const shapes = {
    forgedConversationContinue: invalidConversation.map(describe)[0],
    invalidParameter: parameterError.map(describe)[0],
    unauthenticated: unauthenticated.map(describe)[0],
    timeout: timedOut.map(describe)[0],
  }
  const machineDistinguishable = shapes.forgedConversationContinue !== undefined
    && shapes.invalidParameter !== undefined
    && JSON.stringify(sortKeys(shapes.forgedConversationContinue)) !== JSON.stringify(sortKeys(shapes.invalidParameter))
  record('V0-6 platform conversation-invalidation error shapes (no successful interaction started)', {
    shapes,
    machineDistinguishableFromParameterError: machineDistinguishable,
  }, machineDistinguishable ? 'pass' : 'inconclusive')
  await checkV0_7(textOf(invalidConversation[0]))
}

/**
 * V0-7: the production extraction chain. The envelope observed live by V0-6
 * is replayed through a real ToolRuntime tool that fails exactly the way
 * DSH's MCP client does (`throw new Error(text)` for an isError MCP result),
 * and the settled `tools/result` is projected by the plugin's OWN built
 * `projectLifecycleOutcome`/`classifyFailure` from lib/. Only the code token
 * is recorded; the envelope text never leaves this process.
 */
async function checkV0_7(envelopeText) {
  if (typeof envelopeText !== 'string' || envelopeText.length === 0) {
    record('V0-7 production-chain extraction of the platform envelope through a DSH ToolExecutionResult', {
      skipped: true,
      reason: 'V0-6 forged-conversation envelope unavailable',
    }, 'not-run')
    return
  }
  let production
  try {
    production = await import('../../lib/index.js')
  } catch {
    record('V0-7 production-chain extraction of the platform envelope through a DSH ToolExecutionResult', {
      skipped: true,
      reason: 'plugin lib/ not built; run pnpm build before this probe',
    }, 'not-run')
    return
  }
  const { ctx, agents, scopes } = await scaffold()
  const observed = []
  scopes.a.ctx.plugin({
    name: 'probe-v07',
    inject: ['tools'],
    apply(sctx) {
      sctx.on('tools/result', (exec, result) => {
        if (exec.name !== 'mcp__openbkn__bkn_start_interaction') return
        const projection = production.projectLifecycleOutcome(result)
        observed.push({ errorCode: projection.errorCode, classification: production.classifyFailure(projection) })
      })
    },
  })
  registerProbeTools(ctx, {
    bkn_start_interaction: { execute: async () => { throw new Error(envelopeText) } },
  })
  const settled = await execute(ctx, 'bkn_start_interaction', agents.a)
  const observation = observed[0]
  record('V0-7 production-chain extraction of the platform envelope through a DSH ToolExecutionResult', {
    toolResultIsError: settled.isError === true,
    extractedErrorCode: observation?.errorCode ?? null,
    classification: observation?.classification ?? null,
  }, settled.isError === true && observation?.errorCode === 'resource_not_disclosed' && observation?.classification === 'conversation-invalid'
    ? 'pass'
    : 'fail')
  await teardown(ctx)
}

/** Joined text blocks of one MCP tool result; internal to the probe process. */
function textOf(value) {
  if (value instanceof Error || !Array.isArray(value?.content)) return undefined
  return value.content.filter(block => block?.type === 'text').map(block => block.text).join(' ')
}

async function capture(fn) {
  try { return [await fn()] } catch (error) { return [error] }
}

/** Only code-like JSON field values (≤64 chars each) may leave the probe. */
function extractCodeTokens(text) {
  let parsed
  try { parsed = JSON.parse(text) } catch { return [] }
  const codes = []
  const visit = (node) => {
    if (node === null || typeof node !== 'object') return
    for (const [key, value] of Object.entries(node)) {
      if (/^(code|error_code|errcode|error|status|reason)$/i.test(key) && typeof value === 'string') codes.push(value.slice(0, 64))
      else if (typeof value === 'object' && value !== null) visit(value)
    }
  }
  visit(parsed)
  return [...new Set(codes)].slice(0, 8)
}

function sortKeys(value) {
  if (Array.isArray(value)) return value.map(sortKeys)
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map(key => [key, sortKeys(value[key])]))
  }
  return value
}

async function importMcpClient() {
  const entry = require.resolve('@modelcontextprotocol/client', { paths: [dirname(require.resolve('@deepseek-ai/dsh-mcp-client/package.json'))] })
  return import(pathToFileURL(entry).href)
}

// ---------------------------------------------------------------------------

await checkV0_1()
await checkV0_2()
await checkV0_3()
await checkV0_4()
if (process.argv.includes('--v0-6')) await checkV0_6()
process.exit(evidence.some(entry => entry.verdict === 'fail') ? 1 : 0)
