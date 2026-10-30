import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const hostSource = new URL('../compat/dsh-hosts.json', import.meta.url)
const packageSource = new URL('../packages/openbkn-business-context/package.json', import.meta.url)
const buildSource = new URL('../runtime/openbkn-dsh-runtime.manifest.json', import.meta.url)

/** Read pinned test/build anchors separately from the forward-loading policy. */
export function readDshHosts(source = hostSource) {
  const value = source instanceof URL ? JSON.parse(readFileSync(source, 'utf8')) : source
  if (value?.format !== 1 || !Array.isArray(value.hosts) || value.hosts.length === 0) throw new Error('Invalid DSH host compatibility manifest')
  const versions = new Set()
  const pinnedVersion = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z]+(?:[.-][0-9A-Za-z]+)*)?$/
  for (const host of value.hosts) {
    if (!pinnedVersion.test(host.version) || versions.has(host.version)
      || host.tag !== `dsh-v${host.version}` || !/^[a-f0-9]{40}$/.test(host.commit)
      || !pinnedVersion.test(host.cordis)
      || !pinnedVersion.test(host.schemastery)
      || !/^pnpm@\d+\.\d+\.\d+$/.test(host.packageManager)) throw new Error('DSH hosts must have unique versions and pinned tag/commit/toolchain')
    versions.add(host.version)
  }
  if (!versions.has(value.buildVersion)) throw new Error('DSH buildVersion must remain a pinned test anchor')
  const policy = value.loadPolicy
  if (!policy || !versions.has(policy.minimumVersion) || !Array.isArray(policy.legacyVersions)
    || new Set(policy.legacyVersions).size !== policy.legacyVersions.length
    || policy.legacyVersions.some(version => !versions.has(version) || version === policy.minimumVersion)) {
    throw new Error('DSH load policy requires a reviewed minimum and unique reviewed legacy versions')
  }
  return value
}

/** All newer prereleases and stable versions may attempt loading; anchors are not a ceiling. */
export function dshLoadRange(matrix = readDshHosts()) {
  const { loadPolicy } = readDshHosts(matrix)
  return [...loadPolicy.legacyVersions, `>=${loadPolicy.minimumVersion}`].join(' || ')
}

/** Keep admission metadata consistent without turning test anchors into a version allowlist. */
export function checkDshHostCompatibility(pkg, build, matrix = readDshHosts()) {
  matrix = readDshHosts(matrix)
  const range = dshLoadRange(matrix)
  if (pkg.engines?.dsh !== range) throw new Error(`DSH engine must declare the forward-loading range ${range}`)
  const peers = Object.entries(pkg.peerDependencies ?? {}).filter(([name]) => name.startsWith('@deepseek-ai/dsh-'))
  if (peers.length === 0 || peers.some(([, value]) => value !== range)) throw new Error(`DSH runtime peers must declare exactly ${range}`)
  const development = Object.entries(pkg.devDependencies ?? {}).filter(([name]) => name.startsWith('@deepseek-ai/dsh-'))
  if (development.length === 0 || development.some(([, version]) => version !== matrix.buildVersion)
    || peers.some(([name]) => pkg.devDependencies?.[name] !== matrix.buildVersion)) {
    throw new Error('DSH development dependencies must retain the build baseline')
  }
  const primary = matrix.hosts.find(host => host.version === matrix.buildVersion)
  for (const [name, version] of [['cordis', primary.cordis], ['schemastery', primary.schemastery]]) {
    if (pkg.peerDependencies?.[`@deepseek-ai/${name}`] !== `>=${version}`) {
      throw new Error(`Shared ${name} peer must permit newer Host-provided versions`)
    }
  }
  if (build.dsh?.tag !== primary.tag || build.dsh?.baseCommit !== primary.commit) throw new Error('DSH source build pin disagrees with the host matrix')
  const releaseHostVersion = build.plugin?.hostVersion ?? matrix.buildVersion
  if (!matrix.hosts.some(host => host.version === releaseHostVersion)
    || !pkg.version?.startsWith(`${releaseHostVersion}-openbkn.`)) {
    throw new Error('Plugin release identity must name one explicitly reviewed DSH host')
  }
  if (pkg.dependencies?.zod !== '4.4.3') throw new Error('Zod must stay pinned to the reviewed DSH storage/Remote schema version')
  return matrix
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const matrix = checkDshHostCompatibility(JSON.parse(readFileSync(packageSource, 'utf8')), JSON.parse(readFileSync(buildSource, 'utf8')))
  process.stdout.write(`${JSON.stringify({ buildVersion: matrix.buildVersion, loadRange: dshLoadRange(matrix), hosts: matrix.hosts.map(host => host.version) })}\n`)
}
