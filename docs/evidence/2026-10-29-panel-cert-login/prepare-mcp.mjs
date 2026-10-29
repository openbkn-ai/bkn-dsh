// Task-scoped companion build; inputs are reviewed #105 source copies and a pinned registry runtime.
// Never modify either input. No network install, Host start, global dispatcher or upstream upgrade.
import { cpSync, readFileSync, writeFileSync, mkdirSync, realpathSync, symlinkSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { createHash } from 'node:crypto'
import { build } from 'tsdown'
const [sourceArg, runtimeArg, outputArg] = process.argv.slice(2)
if (!sourceArg || !runtimeArg || !outputArg) throw new Error('Usage: prepare-mcp.mjs reviewed-source-package pinned-runtime output-directory')
const source = resolve(sourceArg), runtime = resolve(runtimeArg), output = resolve(outputArg)
const digest = p => createHash('sha256').update(readFileSync(p)).digest('hex')
const original = digest(join(source, 'lib/index.js'))
if (original !== 'b3cd7156c0b8639656ce117530fec4d006b74cafdc9a78ac426fec084e62972c') throw new Error('Expected the frozen reviewed #105 source build')
const replace = (path, needle, replacement) => {
 const text = readFileSync(path, 'utf8')
 if (text.split(needle).length !== 2) throw new Error('Unexpected source seam: ' + path)
 writeFileSync(path, text.replace(needle, replacement))
}
mkdirSync(output, { recursive: false })
const copied = join(output, 'source')
cpSync(source, copied, { recursive: true, force: false })
// A package-only archive has no monorepo tsconfig ancestor. Use a local
// build-only config instead of changing the pinned source checkout.
writeFileSync(join(copied, 'tsconfig.json'), JSON.stringify({ compilerOptions: { target: 'ES2022', module: 'NodeNext', moduleResolution: 'NodeNext' } }) + '\n')
const index = join(copied, 'src/index.ts')
replace(index, '  headers: Record<string, string>', '  headers: Record<string, string>\n  /** Host-only, connection-scoped fetch; never persisted by the plugin. */\n  platformFetch?: typeof fetch')
replace(index, '    headers: z.dict(String).default({}),', '    headers: z.dict(String).default({}),\n    platformFetch: z.function(),')
writeFileSync(index, readFileSync(index, 'utf8') + '\n/** Capability for the scoped platform certificate adapter. */\nexport const platformFetchSupported = true\n')
replace(join(copied, 'src/transport.ts'), 'fetch: fetchWithinOrigin(fetch)', 'fetch: fetchWithinOrigin(config.platformFetch ?? fetch)')
await build({ config: false, cwd: copied, entry: ['src/index.ts'], outDir: 'lib', dts: false, tsconfig: false,
 platform: 'node', format: 'esm', outExtensions: () => ({ js: '.js' }), clean: true,
 external: id => !id.startsWith('.') && !id.startsWith('/') })
const require = createRequire(join(runtime, 'package.json'))
const registry = dirname(realpathSync(require.resolve('@deepseek-ai/dsh-mcp-client/package.json')))
const payload = join(output, 'payload')
cpSync(registry, payload, { recursive: true, force: false, dereference: true, filter: path => !path.slice(registry.length + 1).split('/').includes('node_modules') })
cpSync(join(copied, 'lib/index.js'), join(payload, 'lib/index.js'))
cpSync(join(source, 'MCP-SDK-LICENSE.txt'), join(payload, 'MCP-SDK-LICENSE.txt'))
const pkgPath = join(payload, 'package.json'), pkg = JSON.parse(readFileSync(pkgPath))
pkg.files = [...new Set([...pkg.files, 'MCP-SDK-LICENSE.txt'])]
pkg.openbknLocalPatch = 'platform-fetch-certificate-local1'
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')
const declarations = join(payload, 'lib/types/index.d.ts')
replace(declarations, '    headers: Record<string, string>;', '    headers: Record<string, string>;\n    platformFetch?: typeof fetch;')
writeFileSync(declarations, readFileSync(declarations, 'utf8') + '\nexport declare const platformFetchSupported = true;\n')
symlinkSync(dirname(dirname(registry)), join(payload, 'node_modules'), 'dir')
if (digest(join(source, 'lib/index.js')) !== original) throw new Error('Source input changed')
const record = { upstreamVersion: pkg.version, kind: 'local-unpublished-companion', upstreamStockSha256: digest(join(registry, 'lib/index.js')),
 frozenSameOriginSha256: original, entrySha256: digest(join(payload, 'lib/index.js')), sourceUnchanged: true,
 change: 'optional in-memory connection-scoped fetch, composed under the unchanged same-origin wrapper; capability flag; no persistence/editor call',
 globalDispatcherChanged: false, hostChanged: false }
writeFileSync(join(output, 'IDENTITY.json'), JSON.stringify(record, null, 2) + '\n')
console.log(JSON.stringify(record))
