import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { once } from 'node:events'
import test from 'node:test'
import { Context } from '@deepseek-ai/cordis'
import { SystemPrompt } from '@deepseek-ai/dsh-system-prompt'
import { ToolRuntime } from '@deepseek-ai/dsh-tools'
import { OpenBknBusinessContextService } from '../src/business-context-service.ts'

test('a native service call keeps its MCP child inside the business owner across reload', async () => {
  const ctx = new Context()
  const bearerReads: string[] = []
  const server = createServer(async (request, response) => {
    if (request.method === 'GET') {
      if (request.url?.startsWith('/api/bkn-backend/v1/knowledge-networks')) {
        response.setHeader('content-type', 'application/json')
        response.end(JSON.stringify({ entries: [], total_count: 0 }))
      } else { response.writeHead(405); response.end() }
      return
    }
    if (request.method === 'DELETE') { response.writeHead(200); response.end(); return }
    const chunks: Buffer[] = []
    for await (const chunk of request) chunks.push(Buffer.from(chunk))
    const body = JSON.parse(Buffer.concat(chunks).toString())
    bearerReads.push(request.headers.authorization ?? '')
    if (!('id' in body)) { response.writeHead(202); response.end(); return }
    const result = body.method === 'initialize'
      ? { protocolVersion: body.params.protocolVersion, capabilities: { tools: {} }, serverInfo: { name: 'native-owner-fixture', version: '1' } }
      : { tools: [{ name: 'bkn_start_interaction', description: 'lifetime fixture only', inputSchema: { type: 'object', properties: {} } }] }
    response.setHeader('content-type', 'application/json')
    response.end(JSON.stringify({ jsonrpc: '2.0', id: body.id, result }))
  })
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  const port = (server.address() as { port: number }).port
  try {
    await ctx.plugin(SystemPrompt)
    await ctx.plugin(ToolRuntime)
    await ctx.plugin({ apply(scope: Context) {
      scope.provide('agents', { list: () => [], get: () => undefined } as never)
      scope.provide('credentials', { set: async () => {} } as never)
      scope.provide('subprocess', {} as never)
      scope.provide('openbknWorkspaceBindingRegistry', {} as never)
    } })
    const config = OpenBknBusinessContextService.Config({ baseUrl: `http://127.0.0.1:${port}` })
    const owner = await ctx.plugin(OpenBknBusinessContextService, config)
    // The native root service lookup rebinds this.ctx to the caller. It must
    // not make a dynamically mounted MCP client outlive the business fiber.
    await ctx.openbknBusinessContext.remoteConfigureToken('first-synthetic-token', AbortSignal.timeout(10_000))
    assert.ok(ctx.tools.get('mcp__openbkn__bkn_start_interaction'))
    assert.ok(bearerReads.includes('Bearer first-synthetic-token'))
    await owner.dispose()
    assert.equal(ctx.tools.get('mcp__openbkn__bkn_start_interaction'), undefined,
      'the old MCP client must leave with the business configuration owner')

    const replacement = await ctx.plugin(OpenBknBusinessContextService, config)
    try {
      await ctx.openbknBusinessContext.remoteConfigureToken('replacement-synthetic-token', AbortSignal.timeout(10_000))
      assert.ok(ctx.tools.get('mcp__openbkn__bkn_start_interaction'))
      assert.ok(bearerReads.includes('Bearer replacement-synthetic-token'), 'a new owner must perform a fresh authorized MCP mount')
    } finally { await replacement.dispose() }
    assert.equal(ctx.tools.get('mcp__openbkn__bkn_start_interaction'), undefined)
  } finally {
    await ctx.fiber.dispose()
    server.closeAllConnections()
    await new Promise<void>(done => server.close(() => done()))
  }
})
