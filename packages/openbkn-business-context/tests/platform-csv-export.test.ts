import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { Context, Service } from '@deepseek-ai/cordis'
import ToolRuntime from '@deepseek-ai/dsh-tools'
import SystemPrompt from '@deepseek-ai/dsh-system-prompt'
import { mountBoundBusinessNetworkTool } from '../src/scoped-business-context.ts'
import { createCsvExportTool, csvExportHost, csvReadCode, decodeCsvResult, MAX_CSV_BYTES, validateCsvPath, type CsvExportHost } from '../src/platform-csv-export.ts'

const bytes = Buffer.from('\ufeff物料,库存\r\nA,61950.0945\r\nB,3115901.5\r\n', 'utf8')
const sha256 = createHash('sha256').update(bytes).digest('hex')
const context = { conversation_id: 'conv_current', interaction_id: 'int_current' }
const args = { kn_id: 'kn', path: '库存.csv', bkn_context: context }
const binding = { platformBaseUrl: 'https://platform.example', knowledgeNetworkId: 'kn', displayName: 'Network' }
function response(change: Record<string, unknown> = {}) {
  const manifest = { schema: 'openbkn.csv.v1', path: args.path, size: bytes.length, sha256, data_base64: bytes.toString('base64'), ...change }
  return { value: { structuredContent: { value: { stdout: JSON.stringify(manifest), stderr: '', exit_code: 0 } } }, content: [{ type: 'text', text: 'Host spill preview; canonical value retained' }] } as never
}

test('CSV transfer preserves BOM, CRLF, Chinese names, and fractional quantities from the canonical result', () => {
  assert.deepEqual(decodeCsvResult(response(), args.path), { bytes, sha256 })
})

test('CSV transfer refuses wrong source, digest, size, malformed base64 and invalid UTF-8', () => {
  for (const change of [{ path: 'other.csv' }, { sha256: '0'.repeat(64) }, { size: bytes.length - 1 }, { size: MAX_CSV_BYTES + 1 }, { data_base64: bytes.toString('base64') + '!' }]) {
    assert.throws(() => decodeCsvResult(response(change), args.path))
  }
  const bad = Buffer.from([0xff])
  assert.throws(() => decodeCsvResult(response({ size: 1, sha256: createHash('sha256').update(bad).digest('hex'), data_base64: bad.toString('base64') }), args.path))
  assert.throws(() => decodeCsvResult({ isError: true, content: [] } as never, args.path))
})

test('CSV path validation rejects traversal, absolute paths, URLs, commands and non-CSV files', () => {
  for (const path of ['../secret.csv', '/workspace/other.csv', 'a/../secret.csv', 'a//b.csv', 'C:\\secret.csv', 'https://other/file.csv', 'a\n.csv', 'file.txt', 'a.csv?x', 'x'.repeat(121) + '.csv']) {
    assert.throws(() => validateCsvPath(path), path)
  }
  assert.equal(validateCsvPath('output/库存.csv'), 'output/库存.csv')
})

test('the actual Python reader is confined to this conversation and refuses symlinks and oversized files', { skip: process.platform === 'win32' }, () => {
  const root = mkdtempSync(join(tmpdir(), 'bkn-csv-reader-'))
  try {
    const cwd = join(root, 'conv-conv_current'); mkdirSync(cwd)
    writeFileSync(join(cwd, args.path), bytes)
    const run = (path: string, directory = cwd) => execFileSync('python3', ['-c', csvReadCode(path, context.conversation_id)], { cwd: directory, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
    const actual = JSON.parse(run(args.path))
    assert.equal(actual.sha256, sha256)
    assert.deepEqual(Buffer.from(actual.data_base64, 'base64'), bytes)
    writeFileSync(join(root, 'other.csv'), 'private synthetic fixture')
    symlinkSync(join(root, 'other.csv'), join(cwd, 'link.csv'))
    symlinkSync(root, join(cwd, 'other'))
    assert.throws(() => run('link.csv'))
    assert.throws(() => run('other/other.csv'))
    assert.throws(() => run(args.path, root))
    writeFileSync(join(cwd, 'large.csv'), Buffer.alloc(MAX_CSV_BYTES + 1))
    assert.throws(() => run('large.csv'))
  } finally { rmSync(root, { recursive: true, force: true }) }
})

function fixture(sourcePath = args.path) {
  let open = true, readOnly = false, writes = 0, dispatches = 0, corrupt = false, collision = false
  const files = new Map<string, Buffer>()
  const host: CsvExportHost = {
    workingDirectory: { ensure: async () => '/workspace' },
    sandboxPolicy: { resolve: () => ({ mode: readOnly ? 'read-only' : 'workspace-write', workspaceRoot: '/workspace' }) },
    fs: {
      resolve: async (path, options) => ({ displayPath: path.startsWith('/') ? path : options!.cwd + '/' + path }),
      contains: (parent, child) => child.displayPath.startsWith(parent.displayPath + '/') || parent.displayPath === child.displayPath,
      processPath: target => target.displayPath,
      writeText: async (target, text, expected) => {
        assert.equal(expected.kind, 'createIfAbsent'); assert.equal(readOnly, false)
        if (collision) throw new Error('file exists')
        writes++; files.set(target.displayPath, Buffer.from(text, 'utf8'))
      },
      readBytes: async target => corrupt ? Buffer.from('changed') : files.get(target.displayPath)!,
    },
    tools: {
      get: () => ({ parameters: { type: 'object' } }),
      execute: async input => {
        dispatches++
        assert.equal(input.name, 'mcp__openbkn__run_code')
        assert.deepEqual((input.arguments as { bkn_context: unknown }).bkn_context, context)
        return response({ path: sourcePath })
      },
    },
  }
  const agent = { session: {} }
  const tool = createCsvExportTool(host, binding, agent as never, () => open ? { conversationId: context.conversation_id, interactionId: context.interaction_id } : undefined)
  const exec = { agent, callId: 'export-1', token: Symbol('parent'), signal: AbortSignal.timeout(5000) } as never
  return { host, tool, exec, files, stats: () => ({ writes, dispatches }), close: () => { open = false }, readOnly: () => { readOnly = true }, corrupt: () => { corrupt = true }, collision: () => { collision = true } }
}

test('workspace resolution follows old immutable Session cwd or the new native service, never process cwd', async () => {
  const f = fixture()
  const { workingDirectory: _unused, ...ports } = f.host
  let current: CsvExportHost['workingDirectory'] | undefined
  const host = csvExportHost(ports, () => current)!
  const agent = { session: { header: { cwd: process.cwd() } } } as never
  assert.equal(await host.workingDirectory.ensure(agent), process.cwd())
  current = { ensure: async () => 'current native service path' }
  assert.equal(await host.workingDirectory.ensure(agent), 'current native service path')
  current = undefined
  for (const session of [{}, { header: {} }, { header: { cwd: 'relative' } }]) {
    await assert.rejects(() => host.workingDirectory.ensure({ session } as never), /no absolute native workspace/)
  }
})

test('export creates a new verified file and returns a real path without changing bytes', async () => {
  const f = fixture(); const value = await f.tool.execute(args, f.exec)
  assert.match(value.path, /^\/workspace\/openbkn-[a-f0-9-]+-库存.csv$/)
  assert.deepEqual(f.files.get(value.path), bytes)
  assert.equal(value.sha256, sha256)
  assert.equal(value.markdown_link, `[CSV](<${encodeURIComponent(value.path.split('/').at(-1)!)}>)`)
  assert.deepEqual(f.stats(), { writes: 1, dispatches: 1 })
})

test('exported link safely round-trips spaces, parentheses, percent signs and Chinese through native file links', async () => {
  const sourcePath = '测试 (final) 100%.csv'
  const f = fixture(sourcePath)
  const value = await f.tool.execute({ ...args, path: sourcePath }, f.exec)
  assert.match(value.markdown_link, /^\[CSV\]\(<openbkn-[a-f0-9-]+-%E6%B5%8B%E8%AF%95%20%28final%29%20100%25.csv>\)$/)
  const destination = value.markdown_link.slice('[CSV](<'.length, -2)
  assert.equal('/workspace/' + decodeURIComponent(destination), value.path)
})

test('closed interaction, wrong identity/network and read-only mode never dispatch or write', async () => {
  for (const kind of ['closed', 'identity', 'network', 'read-only'] as const) {
    const f = fixture()
    if (kind === 'closed') f.close()
    if (kind === 'read-only') f.readOnly()
    await assert.rejects(() => f.tool.execute(kind === 'identity' ? { ...args, bkn_context: { ...context, interaction_id: 'other' } }
      : kind === 'network' ? { ...args, kn_id: 'other' } : args, f.exec))
    assert.deepEqual(f.stats(), { writes: 0, dispatches: 0 })
  }
})

test('finish while retrieving, file collisions and saved-byte corruption never produce a successful delivery', async () => {
  const closed = fixture(); const execute = closed.host.tools.execute
  closed.host.tools.execute = async input => { const result = await execute(input); closed.close(); return result }
  await assert.rejects(() => closed.tool.execute(args, closed.exec)); assert.equal(closed.stats().writes, 0)
  const collision = fixture(); collision.collision()
  await assert.rejects(() => collision.tool.execute(args, collision.exec)); assert.equal(collision.stats().writes, 0)
  const corrupt = fixture(); corrupt.corrupt()
  await assert.rejects(() => corrupt.tool.execute(args, corrupt.exec), /verification failed/)
})

test('native ToolRuntime mounts export only in the bound agent and enforces lifecycle/context without Host tool access', async () => {
  const ctx = new Context()
  const f = fixture()
  const require = createRequire(import.meta.resolve('@deepseek-ai/dsh-tools'))
  const { createScope } = await import(pathToFileURL(require.resolve('@deepseek-ai/dsh-scope')).href)
  try {
    await ctx.plugin(SystemPrompt)
    await ctx.plugin(ToolRuntime)
    for (const [name, port] of Object.entries({ fs: f.host.fs, workingDirectory: f.host.workingDirectory, sandboxPolicy: f.host.sandboxPolicy })) {
      await ctx.plugin(class extends Service {
        constructor(scope: Context) { super(scope, name as never); Object.assign(this, port) }
      })
    }
    let reads = 0
    for (const name of ['mcp__openbkn__bkn_start_interaction', 'mcp__openbkn__bkn_finish_interaction', 'mcp__openbkn__run_code']) {
      ctx.tools.register({
        name, description: 'controlled platform contract',
        parameters: { type: 'object', properties: name.endsWith('run_code') ? { code: { type: 'string' }, bkn_context: { type: 'object' } } : {}, ...(name.endsWith('run_code') ? { required: ['bkn_context'] } : {}) },
        output: { schema: { type: 'object' }, render: (_a, value) => [{ type: 'text', text: JSON.stringify(value) }] },
        execute: async () => {
          if (name.endsWith('run_code')) { reads++; return { stdout: JSON.stringify({ schema: 'openbkn.csv.v1', path: args.path, size: bytes.length, sha256, data_base64: bytes.toString('base64') }), stderr: '', exit_code: 0 } }
          return { conversation_id: context.conversation_id, interaction_id: context.interaction_id, execution_status: name.endsWith('bkn_start_interaction') ? 'active' : 'completed' }
        },
      })
    }
    const agent = { id: 'csv-agent', session: { snapshotEvents: () => [] }, ctx: undefined as unknown as Context }
    let scope!: { ctx: Context }
    await ctx.plugin({ inject: ['tools', 'systemPrompt'], apply(inner: Context) { scope = createScope(inner, agent) } })
    agent.ctx = scope.ctx
    mountBoundBusinessNetworkTool(agent as never, { baseUrl: binding.platformBaseUrl, requestTimeoutMs: 1000, maxResultBytes: 1000000, allowInsecureTls: false }, binding)
    // Optional service injection settles without postponing the main guard.
    await Promise.resolve(); await Promise.resolve()
    assert.ok(ctx.tools.get('openbkn_export_csv', agent))
    assert.equal(ctx.tools.get('openbkn_export_csv', { id: 'other' }), undefined)
    let sequence = 0
    const call = (name: string, input: unknown) => ctx.tools.execute({ name, arguments: input, agent: agent as never, callId: ('csv-' + ++sequence) as never, signal: AbortSignal.timeout(5000) })
    assert.equal((await call('openbkn_export_csv', args)).isError, true)
    assert.equal(reads, 0)
    assert.notEqual((await call('mcp__openbkn__bkn_start_interaction', { conversation_mode: 'new' })).isError, true)
    assert.equal((await call('openbkn_export_csv', { ...args, kn_id: 'other' })).isError, true)
    assert.equal((await call('openbkn_export_csv', { ...args, bkn_context: { ...context, interaction_id: 'other' } })).isError, true)
    assert.equal(reads, 0)
    const exported = await call('openbkn_export_csv', args)
    assert.notEqual(exported.isError, true, JSON.stringify(exported.content))
    assert.equal(reads, 1)
    for (const name of ['read', 'bash', 'mcp__openbkn__run_shell', 'mcp__openbkn__run_cypher']) {
      const refused = await call(name, {})
      assert.equal(refused.isError, true)
      assert.match(JSON.stringify(refused.content), /openbkn_export_csv remains available/,
        'a denied Host or raw-query tool does not mean that the separately registered CSV delivery tool is absent')
    }
    const present = await call('present', {})
    assert.equal(present.isError, true)
    assert.match(JSON.stringify(present.content), /call openbkn_export_csv/)
    assert.equal(reads, 1, 'the actionable refusal still does not dispatch a Host or platform tool')
    assert.notEqual((await call('mcp__openbkn__bkn_finish_interaction', { interaction_id: context.interaction_id })).isError, true)
    assert.equal((await call('openbkn_export_csv', args)).isError, true)
    assert.equal(reads, 1)
  } finally { await ctx.fiber.dispose() }
})
