// Isolated proposal probe. No Host/plugin/profile/platform files are changed.
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { createRequire } from 'node:module'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'

const repo = resolve(process.argv[2] ?? process.cwd())
const selection = process.argv[3] ?? 'npm'
const rows = []
const requests = []
const servers = []
const sha = p => createHash('sha256').update(readFileSync(p)).digest('hex')
const markers = { authorization: 'Bearer synthetic-probe-only', session: 'synthetic-session-only', custom: 'synthetic-custom-only', question: 'synthetic-question-only' }
const addresses = {}
function record(origin, req, body) {
  const row = { origin, method: req.method, path: req.url, authorization: req.headers.authorization === markers.authorization, session: req.headers['mcp-session-id'] === markers.session, custom: req.headers['x-probe-key'] === markers.custom, question: body.includes(markers.question), hasBody: body.length > 0 }
  requests.push(row)
  return row
}
async function server(origin) {
  const s = createServer(async (req, res) => {
    let body = ''
    for await (const chunk of req) body += chunk
    record(origin, req, body)
    const path = new URL(req.url, addresses[origin]).pathname
    const redirect = path.match(/^\/redirect\/(301|302|303|307|308)\/(cross|same)$/)
    if (redirect) {
      res.writeHead(Number(redirect[1]), { location: `${addresses[redirect[2] === 'cross' ? 'B' : 'A']}/final` }).end()
      return
    }
    if (path === '/unauthorized') {
      res.writeHead(401, { 'www-authenticate': `Bearer resource_metadata="${addresses.B}/oauth-discovery"` }).end('synthetic unauthorized')
      return
    }
    if (req.method === 'GET') {
      if (path === '/mcp') {
        res.writeHead(200, { 'content-type': 'text/event-stream' })
        res.write('event: message\ndata: {"jsonrpc":"2.0","method":"notifications/message","params":{"level":"info","data":"synthetic-event"}}\n\n')
      } else res.writeHead(405).end()
      return
    }
    if (req.method === 'DELETE') { res.writeHead(200).end(); return }
    const message = body ? JSON.parse(body) : {}
    if (message.id === undefined) { res.writeHead(202).end(); return }
    let result = {}
    if (message.method === 'initialize') result = { protocolVersion: '2025-06-18', capabilities: { tools: {} }, serverInfo: { name: 'synthetic-only', version: '1' } }
    if (message.method === 'tools/list') result = { tools: [{ name: 'bkn_start_interaction', inputSchema: { type: 'object', properties: { question: { type: 'string' } } } }] }
    if (message.method === 'tools/call') result = { content: [{ type: 'text', text: 'synthetic-result' }] }
    const headers = { 'content-type': 'application/json' }
    if (message.method === 'initialize') headers['mcp-session-id'] = markers.session
    res.writeHead(200, headers).end(JSON.stringify({ jsonrpc: '2.0', id: message.id, result }))
  })
  servers.push(s)
  await new Promise(resolve => s.listen(0, '127.0.0.1', resolve))
  addresses[origin] = `http://127.0.0.1:${s.address().port}`
}
const call = { jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'bkn_start_interaction', arguments: { question: markers.question } } }
function create(sdk, path, deny, session = true) {
  // This is the exact proposed requestInit delta at the fixed DSH factory seam.
  const requestInit = { headers: { Authorization: markers.authorization, 'X-Probe-Key': markers.custom }, ...(deny ? { redirect: 'error' } : {}) }
  const t = new sdk.StreamableHTTPClientTransport(new URL(addresses.A + path), { requestInit, ...(session ? { sessionId: markers.session } : {}) })
  const messages = [], errors = []
  t.onmessage = value => messages.push(value)
  t.onerror = value => errors.push(value)
  return { t, messages, errors }
}
function boundedError(e) { return { name: e?.name, code: e?.code, status: e?.status, cause: e?.cause?.message } }

let failure
try {
  await server('A'); await server('B')
  for (const host of selection.startsWith('desktop-') ? [selection.slice(8)] : ['old', 'new']) {
    const runtime = selection.startsWith('desktop-')
      ? join(repo, 'release/local-32/desktop', host === 'old' ? '0.2.0-rc.2' : '0.2.1-rc.2', 'DeepSeek Harness.app/Contents/Resources/app.asar/dsh')
      : join(repo, 'release/local-51', `npm-${host}-runtime`)
    const req = createRequire(join(runtime, 'package.json'))
    const dshPath = req.resolve('@deepseek-ai/dsh-mcp-client/package.json')
    const sdkReq = createRequire(dshPath)
    const sdkPath = sdkReq.resolve('@modelcontextprotocol/client')
    const sdk = sdkReq('@modelcontextprotocol/client')
    const version = JSON.parse(readFileSync(join(dirname(dirname(sdkPath)), 'package.json'))).version
    rows.push({ host, sdk: version, entrySha256: sha(sdkPath), runtime: process.version, execution: 'actual installed SDK transport; synthetic loopback servers; no full Host or CLI' })
    for (const deny of [false, true]) for (const method of ['POST', 'GET', 'DELETE']) for (const status of [301, 302, 303, 307, 308]) {
      const start = requests.length
      const { t } = create(sdk, `/redirect/${status}/cross`, deny)
      let error
      try {
        await t.start()
        if (method === 'POST') await t.send(call)
        if (method === 'GET') await t.resumeStream('synthetic-event-id')
        if (method === 'DELETE') await t.terminateSession()
      } catch (e) { error = boundedError(e) }
      finally { await t.close() }
      const observed = requests.slice(start)
      const second = observed.filter(r => r.origin === 'B')
      assert.equal(observed.filter(r => r.origin === 'A').length, 1)
      if (deny) { assert(error); assert.equal(second.length, 0) }
      else {
        assert.equal(second.length, 1)
        assert(second[0].session && second[0].custom)
        assert.equal(second[0].authorization, false)
        assert.equal(second[0].question, method === 'POST' && [307, 308].includes(status))
      }
      rows.push({ host, sdk: version, kind: deny ? 'proposed-deny-redirects' : 'frozen-control', method, status, secondOriginRequests: second.length, secondOrigin: second, rejected: !!error, error, result: 'PASS' })
    }
    // Make the intentional same-origin compatibility difference visible.
    for (const deny of [false, true]) for (const status of [301, 302, 303, 307, 308]) {
      const start = requests.length
      const { t } = create(sdk, `/redirect/${status}/same`, deny)
      let error
      try { await t.start(); await t.send(call) } catch (e) { error = boundedError(e) }
      finally { await t.close() }
      const final = requests.slice(start).filter(r => r.path === '/final')
      assert.equal(final.length, deny ? 0 : 1)
      // Native fetch rewrites 301/302/303 POST to GET; this fixture deliberately returns 405 on GET /final.
      assert.equal(!!error, deny || [301, 302, 303].includes(status))
      rows.push({ host, kind: 'same-origin-policy-observation', status, deny, finalRequests: final.length, finalMethod: final[0]?.method, rejected: !!error, contractDecisionRequired: deny, result: 'PASS' })
    }
    // Non-redirected transport semantics including handshake, session, SSE and shutdown.
    {
      const start = requests.length
      const { t, messages, errors } = create(sdk, '/mcp', true, false)
      await t.start()
      await t.send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'synthetic-probe', version: '1' } } })
      assert.equal(t.sessionId, markers.session)
      await t.send({ jsonrpc: '2.0', method: 'notifications/initialized' })
      await t.send({ jsonrpc: '2.0', id: 2, method: 'tools/list' })
      await t.send(call)
      assert.equal(messages.find(x => x.id === 2).result.tools[0].name, 'bkn_start_interaction')
      assert.equal(messages.find(x => x.id === 3).result.content[0].text, 'synthetic-result')
      await t.resumeStream('synthetic-resume')
      const end = Date.now() + 1500
      while (!messages.find(x => x.method === 'notifications/message') && Date.now() < end) await new Promise(r => setTimeout(r, 5))
      assert(messages.find(x => x.method === 'notifications/message'))
      await t.terminateSession()
      assert.equal(t.sessionId, undefined)
      await t.close()
      const observed = requests.slice(start)
      assert.equal(observed[0].session, false)
      assert(observed.slice(1).every(x => x.session && x.authorization && x.custom))
      assert.equal(errors.length, 0)
      rows.push({ host, kind: 'normal-nonredirected-mcp', initialize: true, notification: true, toolsList: true, toolCall: true, sessionPropagation: true, sseResumeRead: true, closeInvoked: true, deleteSession: true, result: 'PASS' })
    }
    {
      const start = requests.length
      const { t } = create(sdk, '/unauthorized', true)
      let error
      try { await t.start(); await t.send(call) } catch (e) { error = boundedError(e) }
      finally { await t.close() }
      assert(error)
      assert.equal(requests.slice(start).length, 1)
      assert.equal(requests.slice(start).filter(r => r.origin === 'B').length, 0)
      rows.push({ host, kind: 'explicit-401-no-sdk-oauth-provider', rejected: true, error, discoveryRequests: 0, result: 'PASS' })
    }
  }
} catch (e) { failure = { name: e.name, message: e.message, stack: e.stack }; process.exitCode = 1 }
finally {
  for (const s of servers) { s.closeAllConnections(); await new Promise(resolve => s.close(resolve)) }
  const report = { checkedAt: new Date().toISOString(), node: process.version, electron: process.versions.electron, selection, scope: 'isolated one-line policy proposal, not production repair or acceptance', realCredentialsOrPlatformCalls: false, frozenArtifactsChanged: false, hostsLaunched: false, rows, failure, serversClosed: servers.every(s => !s.listening), ports: Object.values(addresses).map(x => new URL(x).port) }
  writeFileSync(join(repo, `release/local-52/redirect-probe-${selection}.json`), JSON.stringify(report, null, 2) + '\n')
  console.log(JSON.stringify({ sdkVersions: rows.filter(x => x.sdk && !x.kind).map(x => x.sdk), crossOriginCases: rows.filter(x => x.kind === 'proposed-deny-redirects' || x.kind === 'frozen-control').length, guardedSecondOriginRequests: rows.filter(x => x.kind === 'proposed-deny-redirects').reduce((n,x) => n+x.secondOriginRequests, 0), rows: rows.length, failure, serversClosed: report.serversClosed }))
}
