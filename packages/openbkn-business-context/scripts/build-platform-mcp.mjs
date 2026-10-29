// Build a private copy of the pinned native MCP factory with two transport seams.
// The installed Host and its module cache are never edited. Framework imports stay external.
import { readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { createHash } from 'node:crypto'
const require = createRequire(import.meta.url)
const source = readFileSync(require.resolve('@deepseek-ai/dsh-mcp-client'), 'utf8')
if (createHash('sha256').update(source).digest('hex') !== '758d8fc473b700b5d351158d06ce9f9e92c16e8b25497b08bb7bd2122a87f5dd') {
  throw Error('Native MCP input differs from the reviewed rc.2/rc.3 stock entry')
}
let output = source
function replace(needle, replacement) {
  if (output.split(needle).length !== 2) throw Error('Native MCP build seam changed')
  output = output.replace(needle, replacement)
}
replace('case "streamable-http": return new StreamableHTTPClientTransport(new URL(config.url), { requestInit: { headers: config.headers } });',
  'case "streamable-http": return new StreamableHTTPClientTransport(new URL(config.url), { requestInit: { headers: config.headers }, fetch: fetchWithinOrigin(config.platformFetch ?? fetch) });')
replace('headers: z.dict(String).default({}),', 'headers: z.dict(String).default({}), platformFetch: z.function(),')
output += '\n' + readFileSync(new URL('./mcp-same-origin.js', import.meta.url), 'utf8')
output += '\nexport const platformFetchSupported = true;\n'
writeFileSync(new URL('../lib/platform-mcp-client.js', import.meta.url), output)
