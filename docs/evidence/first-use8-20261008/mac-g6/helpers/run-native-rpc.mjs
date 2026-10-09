// Preparation harness only. --execute is required before any Host/model call.
// No browser/DOM/inspector use; no provider or OpenBKN credential file is read.
import assert from 'node:assert/strict'
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { resolve, relative, isAbsolute, join } from 'node:path'
import { createHash, randomUUID } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { parseArgs } from 'node:util'

const { values: options } = parseArgs({ options: {
  repo: { type: 'string' }, plugin: { type: 'string' }, files: { type: 'string' },
  out: { type: 'string' }, 'launch-file': { type: 'string' }, 'model-file': { type: 'string' },
  cwd: { type: 'string' }, cases: { type: 'string' }, network: { type: 'string', default: 'supply_ontology_hand' },
  timeout: { type: 'string', default: '300000' }, execute: { type: 'boolean', default: false },
} })
for (const field of ['repo', 'plugin', 'files', 'out']) assert.ok(options[field], `--${field} required`)
assert.match(process.version, /^v24\./, 'Use the pinned Node 24 runtime')
const repo = resolve(options.repo), plugin = resolve(options.plugin), output = resolve(options.out)
const manifest = JSON.parse(readFileSync(options.files, 'utf8'))
assert.ok(Array.isArray(manifest.files) && manifest.files.length > 0, 'Need final candidate file manifest')
for (const file of manifest.files) {
  assert.ok(file.path.startsWith('package/'))
  const target = resolve(plugin, file.path.slice('package/'.length)), rel = relative(plugin, target)
  assert.ok(rel && !rel.startsWith('..') && !isAbsolute(rel), 'Candidate path escapes package')
  assert.equal(createHash('sha256').update(readFileSync(target)).digest('hex'), file.sha256, `Candidate file mismatch: ${file.path}`)
}
const pkg = JSON.parse(readFileSync(join(plugin, 'package.json'), 'utf8'))
assert.equal(pkg.name, '@openbkn/dsh-business-context')
assert.equal(pkg.version, '0.2.0-rc.2-openbkn.0.2.0-8')
mkdirSync(output, { recursive: true, mode: 0o700 })
const identity = { pluginVersion: pkg.version, verifiedFiles: manifest.files.length,
  manifestSha256: createHash('sha256').update(readFileSync(options.files)).digest('hex'),
  evidenceLevel: 'Official Host production RPC; no browser UI acceptance; answer facts require a fresh independent oracle' }
writeFileSync(join(output, 'candidate-identity.json'), JSON.stringify(identity, null, 2) + '\n', { mode: 0o600 })
if (!options.execute) {
  console.log(JSON.stringify({ ...identity, prepared: true, executed: false, requiredInputs: ['launch-file', 'model-file', 'cwd', 'fresh independent oracle-before'] }))
  process.exit(0)
}
for (const field of ['launch-file', 'model-file', 'cwd']) assert.ok(options[field], `--${field} required with --execute`)
const model = JSON.parse(readFileSync(options['model-file'], 'utf8'))
assert.ok(typeof model.provider === 'string' && typeof model.model === 'string')
assert.ok(Object.keys(model).every(key => ['provider', 'model', 'reasoningEffort'].includes(key)), 'Model selection file must contain no credential fields')
const launch = new URL(readFileSync(options['launch-file'], 'utf8').trim())
assert.ok(launch.protocol === 'http:' && ['127.0.0.1', 'localhost', '[::1]'].includes(launch.hostname), 'Require an isolated loopback Host')
assert.equal(launch.pathname, '/')
assert.ok(launch.searchParams.has('token'))
const auth = await fetch(launch, { redirect: 'manual', signal: AbortSignal.timeout(5000) })
assert.equal(auth.status, 303, 'Host launch authentication must return 303')
const cookie = auth.headers.get('set-cookie')?.split(';', 1)[0]
assert.ok(cookie, 'No Host session cookie; credential remains private')
const origin = launch.origin

async function rpc(method, args, timeout = 30000) {
  const response = await fetch(`${origin}/api/${method}`, {
    method: 'POST', headers: { 'content-type': 'application/json', cookie, origin },
    body: JSON.stringify({ type: 'client-request', rpcId: randomUUID(), method, payload: { args } }),
    signal: AbortSignal.timeout(timeout),
  })
  if (!response.ok) throw new Error(`Host RPC ${method} returned HTTP ${response.status}; raw response withheld`)
  const envelope = await response.json()
  if (envelope.result?.ok !== true) throw new Error(`Host RPC ${method} refused; code=${envelope.result?.error?.code ?? 'unknown'}; private error withheld`)
  return envelope.result.value
}

function writeSafe(name, data) {
  const result = spawnSync('python3', [join('/tmp/bkn-firstuse8-g6', 'redact-json.py'), join(repo, 'docs/eval/export-supply-session.py')], {
    input: JSON.stringify(data), encoding: 'utf8', maxBuffer: 64 * 1024 * 1024,
  })
  assert.equal(result.status, 0, 'Safe export refused; inspect private data, never print raw values')
  writeFileSync(join(output, name), result.stdout, { mode: 0o600 })
  return JSON.parse(result.stdout)
}
const questions = {
  'orders-count-status': '382-000005 有多少张销售订单？什么状态？',
  'finished-goods-inventory': '382-000005 在各成品仓的可用库存？',
  'standard-lead-time': '382-000005 的标准交期？',
  'bom-structure': '382-000005 的 BOM 构成是什么？',
  'bom-usage-inventory': '查询 382-000005 的 BOM 清单，每个物料的使用量，以及每个物料的库存情况',
  'purchase-flow': '382-000005 当前有哪些未结的采购申请和采购订单？',
  'sales-order-detail': '列出 382-000005 的销售订单明细。',
  'missing-object': '物料 999-999999 的库存和订单情况？',
}
const cases = (options.cases ?? 'standard-lead-time,bom-structure,sales-order-detail,missing-object').split(',')
assert.ok(cases.length > 0 && cases.every(id => Object.hasOwn(questions, id)), 'Only listed original normal G6 questions are allowed')
const status = await rpc('openbknBusinessContext/status', {})
assert.equal(status.kind, 'authenticated', 'Fresh isolated CLI login is required')
const networks = await rpc('openbknBusinessContext/listNetworks', {})
assert.ok(networks.some(network => network.id === options.network || network.knowledgeNetworkId === options.network), 'Configured identity cannot see requested network')
const summaries = []
for (const id of cases) {
  const startedAt = new Date().toISOString()
  const created = await rpc('session/create', { request: { cwd: resolve(options.cwd), agentPreset: 'standard' } })
  const sessionId = created.sessionId
  await rpc('session/selectModel', { request: { sessionId, ...model } })
  await rpc('openbknBusinessContext/bindNetwork', { sessionId, networkId: options.network })
  await rpc('session/prompt', { request: { sessionId, requestId: randomUUID(), mode: 'queue',
    content: [{ type: 'text', text: questions[id] }], clientTimeZone: 'Asia/Taipei' } })
  const deadline = Date.now() + Number(options.timeout)
  let events = [], ending
  while (Date.now() < deadline) {
    const projection = await rpc('session/projections', { request: { sessionId } })
    const cursor = projection?.asOfSeq ?? -1
    if (cursor >= 0) {
      const page = await rpc('session/page', { request: { address: { kind: 'session', sessionId }, throughSeq: cursor, maxMessages: 1000 } })
      assert.equal(page.hasMore, false, 'History truncated; do not claim completion from a partial page')
      events = page.records.filter(record => record.type === 'event').map(record => record.event)
      ending = events.findLast(event => event.type === 'turn/end')
      if (ending) break
    }
    await new Promise(done => setTimeout(done, 1500))
  }
  if (!ending) {
    await rpc('session/cancel', { request: { sessionId } }).catch(() => undefined)
    summaries.push({ id, sessionId, startedAt, finishedAt: new Date().toISOString(), execution: 'timeout', answerFacts: 'not-evaluated' })
    writeSafe('run-summary.json', summaries)
    throw new Error(`Native case ${id} timed out; no corrective prompt was sent`)
  }
  const accepted = new Set(['user/message', 'assistant/message', 'tool/call', 'tool/result', 'turn/start', 'turn/end', 'openbkn/turn-provenance'])
  const filtered = events.filter(event => accepted.has(event.type))
  const safe = writeSafe(`${id}.json`, { id, sessionId, question: questions[id], startedAt, finishedAt: new Date().toISOString(), events: filtered })
  const final = safe.events.findLast(event => event.type === 'assistant/message' && !event.data.interrupted
    && !event.data.message?.content.some(block => block.type === 'tool-call'))
  const text = final?.data.message?.content.filter(block => block.type === 'text').map(block => block.text).join('\n') ?? ''
  writeFileSync(join(output, `${id}.md`), text + '\n', { mode: 0o600 })
  const notices = safe.events.filter(event => event.type === 'user/message' && event.data.source?.kind === 'openbkn-answer-fidelity').length
  const provenance = final?.data.message?.id
    ? await rpc('openbknBusinessContext/getTurnProvenanceView', { sessionId, messageId: final.data.message.id }) : undefined
  if (provenance) writeSafe(`${id}-provenance.json`, provenance)
  summaries.push({ id, sessionId, startedAt, finishedAt: new Date().toISOString(), turnReason: ending.data.reason?.kind,
    finalAnswerChars: text.length, toolCalls: safe.events.filter(event => event.type === 'tool/call').length,
    correctionNotices: notices, answerFacts: 'not-evaluated; compare fresh oracle independently' })
  writeSafe('run-summary.json', summaries)
  console.log(JSON.stringify(summaries.at(-1)))
  if (ending.data.reason?.kind !== 'completed' || !text || notices) throw new Error(`Native case ${id} lacks unchanged completed delivery; no corrective prompt sent`)
}
