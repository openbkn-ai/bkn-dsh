#!/usr/bin/env node
/** Official npm Gateway + generated Host/Client codecs + compiled production service.
 * Only a controlled in-memory platform stand-in is used. Default scenes issue
 * GET only; one explicit analyze scenario receives a simulated POST SSE stream.
 * No real network, model, platform, CLI,
 * profile or credentials. Provide an isolated DSH_HOME when launching this probe.
 */
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { parseArgs } from 'node:util'

const { values } = parseArgs({ options: { runtime: { type: 'string' }, plugin: { type: 'string' }, fixture: { type: 'string' } } })
if (!values.runtime || !values.plugin) throw new Error('Usage: --runtime <isolated npm root> --plugin <compiled candidate> [--fixture <controlled fixture>]')
if (!process.env.DSH_HOME || !resolve(process.env.DSH_HOME).startsWith(resolve(values.runtime) + '/')) throw new Error('DSH_HOME must be an explicit child of the isolated runtime')
const runtimeRequire = createRequire(resolve(values.runtime, 'package.json'))
const fromRuntime = name => import(pathToFileURL(runtimeRequire.resolve(`@deepseek-ai/${name}`)).href)
const artifact = name => import(pathToFileURL(resolve(values.plugin, 'lib', name)).href)
const version = runtimeRequire('@deepseek-ai/dsh-api-gateway/package.json').version
const fixture = JSON.parse(readFileSync(values.fixture ?? fileURLToPath(new URL('../fixtures/provenance-parity/conversation.json', import.meta.url)), 'utf8'))
assert.equal(fixture.kind, 'controlled-synthetic')
const [{ Context }, { default: Registry }, { default: Gateway }, { Peer }, { CredentialProvider }, prompt, tools, business, host, remote] = await Promise.all([
  fromRuntime('cordis'), fromRuntime('dsh-typert-registry'), fromRuntime('dsh-api-gateway'), fromRuntime('dsh-client-connection'),
  fromRuntime('dsh-credentials'), fromRuntime('dsh-system-prompt'), fromRuntime('dsh-tools'), artifact('business.js'), artifact('typert.host.js'), artifact('typert.remote-client.js'),
])
const ctx = new Context(), fibers = [], peers = [], requests = []
const originalFetch = globalThis.fetch
let unexpectedNetworkAttempts = 0
globalThis.fetch = async () => { unexpectedNetworkAttempts++; throw new Error('Real network is forbidden in this controlled Gateway probe') }
const identity = fixture.identity
const selected = Object.keys(fixture.details).find(id => id !== identity.initialInteractionId)
assert.ok(selected)
const rounds = [...fixture.rounds]
const selectedIndex = rounds.findIndex(item => item.interaction_id === selected)
;[rounds[selectedIndex], rounds[60]] = [rounds[60], rounds[selectedIndex]]
const handle = { schemaVersion: 2, interactionId: identity.initialInteractionId, conversationId: identity.conversationId, requestIds: [], traceIds: [], receiptIds: [], status: 'completed', partial: false, turn: 1 }
const events = [
  { type: 'openbkn/turn-provenance', data: { messageId: 'answer1', handle } },
  { type: 'user/message', time: 1000, data: { turn: 1, message: { id: 'question1', role: 'user', content: [{ type: 'text', text: 'Controlled question' }] } } },
  { type: 'assistant/message', time: 1100, data: { turn: 1, message: { id: 'answer1', role: 'assistant', content: [{ type: 'text', text: 'Unchanged controlled answer' }] } } },
]
const agent = { id: 'session1', session: { id: 'session1', header: { cwd: '/controlled-fixture' }, snapshotEvents: () => events } }
const binding = { platformBaseUrl: 'https://controlled-provenance.invalid', knowledgeNetworkId: identity.knowledgeNetworkId, displayName: 'Controlled fixture' }
let status = 200
let allowControlledAnalysis = false
const nativeAnalysisEvents = [
  {event:'meta',data:{analysis_id:'analysis-original',status:'running'}},
  {event:'token',data:{content:'平台原文😀123.450000'}},
  {event:'tool_call',data:{id:'tool-original',name:'platform-tool',arguments:{raw:'123.450000'},platform_future_field:{status:'invalid',reason:'platform-original'}}},
  {event:'meta',data:{phase:'platform-original-phase',opaque:{value:null}}},
  {event:'structured',data:{analysis_id:'analysis-original',content:{decision:'no_change',summary:'平台原文',recommendations:[]}}},
  {event:'done',data:{analysis_id:'analysis-original',status:'completed'}},
]
const detail = structuredClone(fixture.details[identity.initialInteractionId])
detail.platform_future_field = { exact: '123.450000', null_value: null, nested: [{ status: 'invalid', reason: 'platform-original' }] }
detail.platform_long_original = '保留原文😀123.450000\n'.repeat(20000)
const dataFor = (url) => {
  const path = url.pathname, id = path.split('/interactions/')[1]?.split('/')[0]
  if (path.endsWith('/conversations')) return { entries: [fixture.conversation], total: 1, page: 1, page_size: 50 }
  if (path.endsWith('/interactions')) { const page = Number(url.searchParams.get('page') ?? 1), size = Number(url.searchParams.get('page_size') ?? 50); return { entries: rounds.slice((page - 1) * size, page * size), total: rounds.length, page, page_size: size } }
  if (path.endsWith('/markdown')) return fixture.markdown[id]
  if (path.endsWith('/explanations')) return fixture.explanations[id]
  if (path.endsWith('/analysis')) return fixture.history[id]
  return id === identity.initialInteractionId ? detail : fixture.details[id]
}
const fetcher = async (url, init) => {
  assert.equal(url.origin, binding.platformBaseUrl)
  assert.equal(init.redirect, 'error')
  requests.push({ path: url.pathname, query: Object.fromEntries(url.searchParams), method: init.method ?? 'GET' })
  if (init.method === 'POST') {
    assert.ok(allowControlledAnalysis, 'default scenes must never dispatch a platform POST')
    assert.ok(url.pathname.endsWith(`/interactions/${identity.initialInteractionId}/analysis`))
    assert.deepEqual(JSON.parse(init.body), {markdown:fixture.markdown[identity.initialInteractionId]})
    const wire=': keepalive\r\n\r\n'+nativeAnalysisEvents.map(event=>`event: ${event.event}\r\ndata: ${JSON.stringify(event.data)}\r\n\r\n: keepalive\r\n\r\n`).join('')
    const bytes=new TextEncoder().encode(wire)
    return new Response(new ReadableStream({start(controller){for(let i=0;i<bytes.length;i+=3)controller.enqueue(bytes.slice(i,i+3));controller.close()}}),{headers:{'content-type':'text/event-stream; charset=utf-8'}})
  }
  assert.ok(!init.method || init.method === 'GET', 'unexpected platform method')
  const value = status === 200 ? dataFor(url) : { secret: 'must never cross the Remote error' }
  assert.notEqual(value, undefined, `controlled fixture route is missing: ${url.pathname}`)
  return new Response(typeof value === 'string' ? value : JSON.stringify(value), { status, headers: { 'content-type': typeof value === 'string' ? 'text/plain' : 'application/json' } })
}
const resultSchemas = contribution => {
  const descriptor = (contribution.invocations ?? contribution.descriptors).find(item => item.namespace === 'openbknBusinessContext' && item.method === 'provenanceDetailStream')
  assert.ok(descriptor, 'compiled Remote descriptor must register the new stream')
  assert.equal(descriptor.mode, 'stream')
  return descriptor.result.create()
}
try {
  fibers.push(await ctx.plugin(Registry))
  if (version === '0.2.1-rc.3') fibers.push(await ctx.plugin((await fromRuntime('dsh-api-remote-access')).default))
  fibers.push(await ctx.plugin(Gateway))
  fibers.push(await ctx.plugin(prompt.default))
  fibers.push(await ctx.plugin(tools.default))
  class FixtureCredentials extends CredentialProvider { async describe() { return { configured: false } } }
  fibers.push(await ctx.plugin(FixtureCredentials))
  fibers.push(await ctx.plugin({ apply(scope) {
    scope.provide('agents', { list: () => [], get: id => id === 'session1' ? agent : undefined })
    scope.provide('subprocess', { resolveExecutable: async () => { throw new Error('CLI is forbidden in this read-only probe') } })
    scope.provide('openbknWorkspaceBindingRegistry', {})
  } }))
  fibers.push(await ctx.plugin(business.OpenBknBusinessContextService, business.Config({ baseUrl: binding.platformBaseUrl })))
  const service = ctx.get('openbknBusinessContext')
  assert.ok(service)
  service.bindingRecords = { read: () => ({ binding }) }
  service.platformReader = () => new business.OpenBknPlatformReader({ baseUrl: binding.platformBaseUrl, requestTimeoutMs: 1000, maxResultBytes: 1024, allowInsecureTls: false, resolveToken: async () => 'controlled-not-a-real-token' }, fetcher)
  const contribution = ctx.typert.register(host.TYPERT)
  const peer = version === '0.2.1-rc.3' ? new Peer(ctx, { principal: { kind: 'owner' } }) : undefined
  if (peer) peers.push(peer)
  const hostSchema = resultSchemas(host.TYPERT), clientSchema = resultSchemas(remote.default)
  const read = async (request, signal = AbortSignal.timeout(5000), args = {}) => {
    const source = await ctx.typertGateway.stream({ namespace: 'openbknBusinessContext', method: 'provenanceDetailStream', args: { sessionId: 'session1', messageId: 'answer1', request, ...args }, peer, signal })
    const result = []
    for await (const event of source) {
      // Exercise the actual generated strict result codecs on a JSON carrier round trip.
      const transmitted = JSON.parse(JSON.stringify(hostSchema.parse(event)))
      result.push(clientSchema.parse(transmitted))
    }
    return result
  }
  const extract = events => {
    const direct = events.find(item => item.kind === 'result')
    if (direct) return direct.value
    const chunks = events.filter(item => item.kind === 'chunk'), end = events.find(item => item.kind === 'end')
    assert.ok(end); assert.equal(chunks.length, end.chunks)
    const text = chunks.map((item, index) => { assert.equal(item.index, index); return item.content }).join('')
    return end.encoding === 'text' ? text : JSON.parse(text)
  }
  const anchor = await read({ kind: 'detail' })
  assert.deepEqual(anchor[0], {kind:'context',...identity,interactionId:identity.initialInteractionId})
  assert.deepEqual(extract(anchor), detail)
  assert.ok(anchor.some(item => item.kind === 'chunk'), 'long complete raw data crosses the native chunk codec')
  assert.equal(requests.length, 1, 'trusted answer anchor is readable outside the first 50 rounds without selecting a fallback')
  const start = requests.length
  assert.deepEqual(extract(await read({kind:'detail',interactionId:selected})),fixture.details[selected])
  assert.equal(requests.slice(start).filter(item => item.path.endsWith('/interactions')).length,2)
  assert.ok(requests.slice(start).every(item => !item.path.endsWith('/interactions') || item.query.conversation_id === identity.conversationId))
  for (const kind of ['conversation','rounds','explanation','markdown','history']) assert.ok(await read({kind}))
  status=403
  assert.deepEqual((await read({kind:'detail'})).at(-1),{kind:'failure',code:'ACCESS_DENIED',httpStatus:403})
  status=200
  const denied = await read({kind:'detail',interactionId:'foreign-interaction'})
  assert.deepEqual(denied.at(-1),{kind:'failure',code:'RECORD_NOT_DISCLOSED'})
  const before=requests.length
  await assert.rejects(read({kind:'not-a-fixed-action'}),error=>/^gateway\/(input|arguments)-invalid$/.test(error.code))
  assert.equal(requests.length,before)
  const cancelled=new AbortController();cancelled.abort()
  await assert.rejects(read({kind:'detail'},cancelled.signal))
  assert.equal(requests.length,before)
  assert.ok(requests.every(item=>item.method==='GET'),'every default/open/read/error scene must remain GET only')
  allowControlledAnalysis=true
  const analysis=await read({kind:'analyze',markdown:'browser modified answer must not be submitted'})
  assert.deepEqual(analysis.filter(item=>item.kind==='analysis'),nativeAnalysisEvents.map(event=>({kind:'analysis',...event})))
  assert.equal(requests.filter(item=>item.method==='POST').length,1,'one explicitly triggered simulated analysis POST only')
  contribution()
  assert.equal(ctx.typert.local.get('openbknBusinessContext/provenanceDetailStream'),undefined)
  const hashes=Object.fromEntries(['business.js','typert.host.js','typert.remote-client.js'].map(name=>[name,createHash('sha256').update(readFileSync(resolve(values.plugin,'lib',name))).digest('hex')]))
  assert.equal(unexpectedNetworkAttempts,0,'no code path may fall through to a real network request')
  console.log(JSON.stringify({evidence:'official npm Gateway and compiled codecs; in-memory GET and explicit analysis SSE stand-in; not live Host UI/platform/model acceptance',dsh:version,cordis:runtimeRequire('@deepseek-ai/cordis/package.json').version,verdict:'pass',hashes,checks:['compiled stream registration','locally owned recursive JSON Host and Client codec','unknown nested fields and platform invalid unchanged','long raw data chunk carrier round trip','exact anchor outside first50','same-conversation member page2','all default GET endpoints','safe classified failure','foreign interaction denied','invalid action input denied','cancellation','explicit native meta token tool_call structured done and heartbeat through compiled Reader Scope Gateway and codecs','Host native Markdown submitted without browser business text','contribution unload'],platformMethods:[...new Set(requests.map(item=>item.method))],controlledAnalysisPOST:1,defaultScenePOST:0,actualNetworkRequests:0,actualPlatformPOST:0,requestCount:requests.length}))
} finally {
  globalThis.fetch=originalFetch
  for(const peer of peers.reverse())await peer.dispose()
  for(const fiber of fibers.reverse())await fiber.dispose()
}
