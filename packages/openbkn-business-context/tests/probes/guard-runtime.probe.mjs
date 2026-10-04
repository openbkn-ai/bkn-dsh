#!/usr/bin/env node
/**
 * Guard probe: the bound-session guard exercised on the real DSH tool runtime
 * WITHOUT a model. A model that follows the session prompt never sends a wrong
 * or missing `kn_id`, so these refusals cannot be triggered through chat (seen
 * on macOS and Windows, 2026-10-04); this probe sends the calls directly.
 *
 * Manual only — not part of CI or the published package. Run it against the
 * release candidate before tagging (CLAUDE.md, release gate 7).
 *
 * Usage (from packages/openbkn-business-context):
 *   node tests/probes/guard-runtime.probe.mjs [--plugin <dir>]
 *       Stand-in tools shaped like the v0.1.5 Context Loader catalogue.
 *   NODE_EXTRA_CA_CERTS=~/.dsh/openbkn-dev-ca.pem \
 *     node tests/probes/guard-runtime.probe.mjs --live https://<platform> --kn <kn-id> --other-kn <kn-id> [--plugin <dir>] [--cli <path>]
 *       DSH's own MCP client registers the platform's real tools; allowed calls
 *       reach the platform, and the platform's operation record is compared.
 *       Needs an OpenBKN CLI login; the token stays in this process.
 *
 * `--plugin <dir>` is an unpacked plugin package (the directory that holds
 * `lib/index.js`), e.g. `tar -xzf <candidate>.tgz` → `<dir>/package`. Default:
 * this package's own built `lib/`.
 *
 * Output: one JSON line per check. Observations carry tool short names,
 * booleans, counts and refusal texts only — never arguments' business values,
 * response bodies, or credentials.
 */
import { execFile } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { promisify } from 'node:util'
import { Context } from '@deepseek-ai/cordis'
import { ToolRuntime } from '@deepseek-ai/dsh-tools'
import { createMcpToolDefinition } from '@deepseek-ai/dsh-mcp-client'
import { SystemPrompt } from '@deepseek-ai/dsh-system-prompt'

const runCli = promisify(execFile)
const require = createRequire(import.meta.url)
const scopeEntry = require.resolve('@deepseek-ai/dsh-scope', {
  paths: [dirname(require.resolve('@deepseek-ai/dsh-tools/package.json'))],
})
const { createScope } = await import(pathToFileURL(scopeEntry).href)

const option = name => {
  const index = process.argv.indexOf(`--${name}`)
  return index === -1 ? undefined : process.argv[index + 1]
}
const live = option('live')
const pluginDir = resolve(option('plugin') ?? '.')
const cli = option('cli') ?? 'openbkn'
const boundKn = option('kn') ?? 'kn-bound'
const otherKn = option('other-kn') ?? 'kn-other'
if (live !== undefined && (option('kn') === undefined || option('other-kn') === undefined)) {
  console.error('--live needs --kn <bound network id> and --other-kn <another network id>')
  process.exit(2)
}

const production = await import(pathToFileURL(resolve(pluginDir, 'lib/index.js')).href)
const pluginVersion = JSON.parse(await readFile(resolve(pluginDir, 'package.json'), 'utf8')).version
const dshVersion = JSON.parse(await readFile(require.resolve('@deepseek-ai/dsh-tools/package.json'), 'utf8')).version
const PREFIX = 'mcp__openbkn__'
const evidence = []

function record(check, observation, pass) {
  evidence.push({ check, mode: live === undefined ? 'stand-in' : 'live', plugin: pluginVersion, dshTools: dshVersion, observation, verdict: pass ? 'pass' : 'fail' })
  console.log(JSON.stringify(evidence.at(-1)))
}

// --- runtime -----------------------------------------------------------------

const ctx = new Context()
await ctx.plugin(SystemPrompt)
await ctx.plugin(ToolRuntime)

/** Calls that reached a tool's `execute` (stand-in mode). */
const dispatched = []

if (live === undefined) {
  const catalogue = JSON.parse(await readFile(new URL('../fixtures/context-loader-tools-v0.1.5.json', import.meta.url), 'utf8')).tools
  for (const [name, tool] of Object.entries(catalogue)) {
    if (name === 'execute_skill') continue // off by default on 0.1.5
    const takesKnId = tool.knId === 'required' || tool.knId === 'optional'
    // Registered through DSH's own MCP tool factory, so `parameters` has the
    // shape the MCP client gives real Context Loader tools.
    ctx.tools.register(createMcpToolDefinition(ctx, {
      name: `${PREFIX}${name}`,
      rawName: name,
      description: `stand-in for ${name}`,
      inputSchema: { type: 'object', properties: takesKnId ? { kn_id: { type: 'string' } } : {} },
      call: async () => {
        dispatched.push(name)
        const body = name === 'bkn_start_interaction' ? { interaction_id: 'int-probe', conversation_id: 'conv-probe', execution_status: 'active' } : {}
        return { content: [{ type: 'text', text: JSON.stringify(body) }] }
      },
    }))
  }
} else {
  const { stdout } = await runCli(cli, ['auth', 'token'])
  const McpClient = await import('@deepseek-ai/dsh-mcp-client')
  await ctx.plugin(McpClient, McpClient.Config({
    transport: 'streamable-http',
    serverName: 'openbkn',
    url: `${live.replace(/\/+$/, '')}/api/agent-retrieval/v1/mcp/`,
    headers: { Authorization: `Bearer ${stdout.trim()}` },
    toolCallTimeoutMs: 20_000,
    failOnStartupError: true,
  }))
  for (let attempt = 0; attempt < 100 && ctx.tools.get(`${PREFIX}bkn_start_interaction`) === undefined; attempt += 1) {
    await new Promise(done => setTimeout(done, 100))
  }
}

// One Agent scope, minted the way DSH's agent package does: the scope key is
// the agent object, and `exec.agent` carries it.
const agent = { id: 'guard-probe-agent', session: { snapshotEvents: () => [] } }
const config = { baseUrl: live ?? 'https://probe.invalid', requestTimeoutMs: 30_000, maxResultBytes: 1_000_000, allowInsecureTls: false }
let mounted = false
// The plugin mounts on an Agent context that already has the preset's
// services; a scoped plugin with the same injections stands in for it.
await createScope(ctx, agent).ctx.plugin({
  name: 'guard-probe-agent',
  inject: ['systemPrompt', 'tools'],
  apply(scoped) {
    agent.ctx = scoped
    mounted = production.mountBoundBusinessNetworkTool(agent, config, {
      platformBaseUrl: config.baseUrl, knowledgeNetworkId: boundKn, displayName: 'guard probe',
    })
  },
})
record('the plugin mounts its guard on a real DSH agent scope', {
  mounted,
  registeredOpenBknTools: ['bkn_start_interaction', 'search_capabilities', 'execute_tool', 'search_instance', 'list_knowledge_networks']
    .filter(name => ctx.tools.get(`${PREFIX}${name}`, agent) !== undefined),
}, mounted === true && ctx.tools.get(`${PREFIX}search_capabilities`, agent) !== undefined)

let sequence = 0
async function call(name, args) {
  const toolName = name.startsWith('host:') ? name.slice(5) : `${PREFIX}${name}`
  const before = dispatched.length
  const result = await ctx.tools.execute({
    callId: `guard-probe-${sequence += 1}`, name: toolName, arguments: args, agent, signal: new AbortController().signal,
  })
  const text = (result.content ?? []).filter(block => block?.type === 'text').map(block => block.text).join(' ')
    || result.error?.message || ''
  return { isError: result.isError === true, text, dispatched: dispatched.length - before, result }
}

function refused(check, outcome, pattern) {
  record(check, {
    refused: outcome.isError,
    refusalMatches: pattern.test(outcome.text),
    refusal: outcome.isError ? outcome.text.slice(0, 200) : null,
    ...(live === undefined ? { reachedTheTool: outcome.dispatched > 0 } : {}),
  }, outcome.isError && pattern.test(outcome.text) && (live !== undefined || outcome.dispatched === 0))
}

// --- sequence ----------------------------------------------------------------

refused('before any interaction: a managed call is refused',
  await call('search_capabilities', { kn_id: boundKn, query: 'probe' }), /Start mcp__openbkn__bkn_start_interaction/)
refused('a host tool is refused in a bound session',
  await call('host:bash', { command: 'true' }), /only permits managed OpenBKN tools/)

const start = await call('bkn_start_interaction', { conversation_mode: 'new', question: 'guard probe (no model)', agent_name: 'bkn-agent-dsh-business-context' })
let ids = {}
try { ids = JSON.parse(start.text) } catch { /* recorded below */ }
const bknContext = live === undefined ? undefined : { conversation_id: ids.conversation_id, interaction_id: ids.interaction_id }
record('bkn_start_interaction is allowed and opens the interaction', {
  ok: !start.isError, hasInteractionId: typeof ids.interaction_id === 'string',
}, !start.isError && typeof ids.interaction_id === 'string')
const withContext = args => bknContext === undefined ? args : { ...args, bkn_context: bknContext }

refused('cross-network kn_id is refused',
  await call('search_capabilities', withContext({ kn_id: otherKn, query: 'probe' })), /bound to OpenBKN knowledge network .*Other networks cannot be queried/)
refused('missing kn_id is refused on a tool whose schema requires it',
  await call('search_capabilities', withContext({ query: 'probe' })), /bound to OpenBKN knowledge network/)
refused('missing kn_id is refused where the platform schema makes it optional',
  await call('search_instance', withContext({ query: 'probe' })), /bound to OpenBKN knowledge network/)
refused('a non-string kn_id is refused',
  await call('search_capabilities', withContext({ kn_id: [boundKn], query: 'probe' })), /bound to OpenBKN knowledge network/)
refused('cross-network kn_id is refused on execute_tool',
  await call('execute_tool', withContext({ kn_id: otherKn, toolbox_id: 'x', tool_id: 'y', arguments: {} })), /Other networks cannot be queried/)
refused('an excluded OpenBKN tool is refused and named',
  await call('list_knowledge_networks', withContext({})), /mcp__openbkn__list_knowledge_networks is not supported/)
refused('an OpenBKN tool the plugin does not know is refused and named',
  await call('added_upstream_later', {}), /mcp__openbkn__added_upstream_later is not supported/)
refused('a second start in the same turn is refused',
  await call('bkn_start_interaction', { conversation_mode: 'new', question: 'again', agent_name: 'bkn-agent-dsh-business-context' }), /already open/)

const allowed = await call('search_capabilities', withContext({ kn_id: boundKn, query: 'probe', limit: 1 }))
record('the bound network is allowed and reaches the tool', {
  ok: !allowed.isError, ...(live === undefined ? { reachedTheTool: allowed.dispatched === 1 } : {}),
  ...(allowed.isError ? { error: allowed.text.slice(0, 200) } : {}),
}, !allowed.isError && (live !== undefined || allowed.dispatched === 1))

const finish = await call('bkn_finish_interaction', { interaction_id: ids.interaction_id, outcome: 'completed', answer: 'guard probe finished' })
record('bkn_finish_interaction closes the interaction', { ok: !finish.isError, ...(finish.isError ? { error: finish.text.slice(0, 200) } : {}) }, !finish.isError)
refused('after the interaction is finished, a managed call is refused again',
  await call('search_capabilities', withContext({ kn_id: boundKn, query: 'probe' })), /OpenBKN/)

if (live === undefined) {
  record('only the allowed calls reached a tool', { dispatched }, JSON.stringify(dispatched) === JSON.stringify(['bkn_start_interaction', 'search_capabilities', 'bkn_finish_interaction']))
} else {
  // The platform's own record: refused calls must not appear in it.
  const { stdout } = await runCli(cli, ['--json', 'trace', 'interactions', 'operations', ids.interaction_id], { maxBuffer: 256 * 1024 * 1024 })
  const names = (JSON.parse(stdout).entries ?? []).map(entry => entry.tool_name).sort()
  record('the platform recorded only the allowed call', { interactionId: ids.interaction_id, platformOperations: names },
    JSON.stringify(names) === JSON.stringify(['search_capabilities']))
}

try { await ctx.destroy?.() } catch { /* teardown shape varies; the process exits anyway */ }
const failed = evidence.filter(entry => entry.verdict === 'fail')
console.log(JSON.stringify({ summary: `${evidence.length - failed.length}/${evidence.length} checks passed`, failed: failed.map(entry => entry.check) }))
process.exit(failed.length === 0 ? 0 : 1)
