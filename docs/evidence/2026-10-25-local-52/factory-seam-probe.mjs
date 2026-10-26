import assert from 'node:assert/strict'
import { createRequire, stripTypeScriptTypes } from 'node:module'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, join } from 'node:path'
const repo = resolve(process.argv[2] ?? process.cwd())
const records = []
for (const [host, folder] of [['old', 'deepseek-harness'], ['new', 'dsh-0.2.1-rc.2']]) {
  const req = createRequire(join(repo, `release/local-51/npm-${host}-runtime/package.json`))
  const sdkReq = createRequire(req.resolve('@deepseek-ai/dsh-mcp-client/package.json'))
  const sdk = sdkReq('@modelcontextprotocol/client')
  for (const proposed of [false, true]) {
    const file = proposed ? join(repo, `release/local-52/${host}-transport-proposal.ts`) : join(repo, `release/${folder}/packages/mcp/mcp-client/src/transport.ts`)
    // Strip only imports/types/export from an isolated text copy of the actual factory.
    const source = readFileSync(file, 'utf8').replace(/^import .*$/gm, '').replace('export function createTransport', 'function createTransport')
    const js = stripTypeScriptTypes(source)
    let captured
    const Constructor = new Proxy(sdk.StreamableHTTPClientTransport, { construct(target, args) { captured = args[1]; return Reflect.construct(target, args) } })
    const factory = new Function('StreamableHTTPClientTransport', 'StdioClientTransport', 'scrubbedParentEnv', `${js}\nreturn createTransport`)(Constructor, undefined, () => { throw new Error('stdio is outside this proposal probe') })
    const config = { transport: 'streamable-http', url: 'https://example.invalid/mcp', headers: { Authorization: 'Bearer synthetic-only' } }
    const transport = factory(config)
    assert(transport instanceof sdk.StreamableHTTPClientTransport)
    assert.deepEqual(captured.requestInit.headers, config.headers)
    assert.equal(captured.requestInit.redirect, proposed ? 'error' : undefined)
    await transport.start(); await transport.close()
    records.push({ host, proposed, actualSdkConstructor: true, headersPreserved: true, redirectOption: captured.requestInit.redirect ?? 'SDK default', networkRequests: 0, result: 'PASS' })
  }
}
writeFileSync(join(repo, 'release/local-52/factory-seam-probe.json'), JSON.stringify({ scope: 'actual pinned factory source and draft source executed in isolation; actual SDK constructor; not a full Host', records }, null, 2) + '\n')
console.log(JSON.stringify({ cases: records.length, passed: records.every(x => x.result === 'PASS') }))
