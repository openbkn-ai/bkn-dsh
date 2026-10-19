import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const hostSource = new URL('../compat/dsh-hosts.json', import.meta.url)
const packageSource = new URL('../packages/openbkn-business-context/package.json', import.meta.url)
const buildSource = new URL('../runtime/openbkn-dsh-runtime.manifest.json', import.meta.url)

/** Read the explicitly reviewed host versions and their independent build baseline. */
export function readDshHosts(source = hostSource) {
  const value = source instanceof URL ? JSON.parse(readFileSync(source, 'utf8')) : source
  if (value?.format !== 1 || !Array.isArray(value.hosts) || value.hosts.length === 0) throw new Error('Invalid DSH host compatibility manifest')
  const versions = new Set()
  for (const host of value.hosts) {
    if (!/^\d+\.\d+\.\d+-rc\.\d+$/.test(host.version) || versions.has(host.version)
      || host.tag !== `dsh-v${host.version}` || !/^[a-f0-9]{40}$/.test(host.commit)
      || !/^pnpm@\d+\.\d+\.\d+$/.test(host.packageManager)) throw new Error('DSH hosts must have unique versions and pinned tag/commit/toolchain')
    versions.add(host.version)
  }
  if (!versions.has(value.buildVersion)) throw new Error('DSH buildVersion must be an explicitly supported host')
  return value
}

/** Reject a package or build manifest that silently drops or expands the reviewed hosts. */
export function checkDshHostCompatibility(pkg, build, matrix = readDshHosts()) {
  matrix = readDshHosts(matrix)
  const range = matrix.hosts.map(host => host.version).join(' || ')
  const peers = Object.entries(pkg.peerDependencies ?? {}).filter(([name]) => name.startsWith('@deepseek-ai/dsh-'))
  if (peers.length === 0 || peers.some(([, value]) => value !== range)) throw new Error(`DSH runtime peers must declare exactly ${range}`)
  if (pkg.devDependencies?.['@deepseek-ai/dsh-tools'] !== matrix.buildVersion) throw new Error('DSH development dependencies must retain the build baseline')
  const primary = matrix.hosts.find(host => host.version === matrix.buildVersion)
  if (build.dsh?.tag !== primary.tag || build.dsh?.baseCommit !== primary.commit) throw new Error('DSH source build pin disagrees with the host matrix')
  if (pkg.dependencies?.zod !== '4.4.3') throw new Error('Zod must stay pinned to the reviewed DSH storage/Remote schema version')
  return matrix
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const matrix = checkDshHostCompatibility(JSON.parse(readFileSync(packageSource, 'utf8')), JSON.parse(readFileSync(buildSource, 'utf8')))
  process.stdout.write(`${JSON.stringify({ buildVersion: matrix.buildVersion, hosts: matrix.hosts.map(host => host.version) })}\n`)
}
