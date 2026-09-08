import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const commitPattern = /^[0-9a-f]{40}$/
const digestPattern = /^[0-9a-f]{64}$/
const bundleVersionPattern = /^0\.1\.2-rc\.1-openbkn\.[1-9][0-9]*$/
const platforms = new Set(['darwin-arm64', 'darwin-x64', 'win32-x64'])

function fail(message) {
  throw new Error(`Invalid compatible runtime manifest: ${message}`)
}

function asObject(value, name) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) fail(`${name} must be an object`)
  return value
}

function string(value, name) {
  if (typeof value !== 'string' || value.length === 0) fail(`${name} must be a non-empty string`)
  return value
}

export function loadRuntimeManifest(source) {
  const raw = source instanceof URL
    ? JSON.parse(readFileSync(fileURLToPath(source), 'utf8'))
    : source
  const manifest = asObject(raw, 'manifest')
  if (manifest.format !== 1) fail('format must be 1')

  const bundle = asObject(manifest.bundle, 'bundle')
  if (string(bundle.name, 'bundle.name') !== 'openbkn-dsh-runtime') fail('bundle.name must be openbkn-dsh-runtime')
  if (!bundleVersionPattern.test(string(bundle.version, 'bundle.version'))) fail('bundle.version is unsupported')
  string(bundle.node, 'bundle.node')
  if (!Array.isArray(bundle.archives) || bundle.archives.length === 0) fail('bundle.archives must be a non-empty array')
  for (const [index, entry] of bundle.archives.entries()) {
    const archive = asObject(entry, `bundle.archives[${index}]`)
    if (!platforms.has(string(archive.platform, `bundle.archives[${index}].platform`))) fail(`bundle.archives[${index}].platform is unsupported`)
    if (!/\.(tar\.gz|zip)$/.test(string(archive.file, `bundle.archives[${index}].file`))) fail(`bundle.archives[${index}].file must be an archive`)
  }

  const dsh = asObject(manifest.dsh, 'dsh')
  if (string(dsh.tag, 'dsh.tag') !== 'dsh-v0.1.2-rc.1') fail('dsh.tag is unsupported')
  if (!commitPattern.test(string(dsh.baseCommit, 'dsh.baseCommit'))) fail('dsh.baseCommit must be a pinned 40-character commit')
  if (!string(dsh.upstream, 'dsh.upstream').startsWith('https://')) fail('dsh.upstream must use https')

  const plugin = asObject(manifest.plugin, 'plugin')
  if (string(plugin.packageName, 'plugin.packageName') !== '@openbkn/dsh-business-context') fail('plugin.packageName is unsupported')
  string(plugin.version, 'plugin.version')
  if (!string(plugin.artifact, 'plugin.artifact').endsWith('.tgz')) fail('plugin.artifact must be a tgz archive')

  const compatibility = asObject(manifest.compatibility, 'compatibility')
  if (!string(compatibility.directory, 'compatibility.directory').startsWith('compat/')) fail('compatibility.directory must stay within compat/')
  if (!Array.isArray(compatibility.patches) || compatibility.patches.length === 0) fail('compatibility.patches must be a non-empty array')
  for (const [index, entry] of compatibility.patches.entries()) {
    const patch = asObject(entry, `compatibility.patches[${index}]`)
    if (!string(patch.file, `compatibility.patches[${index}].file`).startsWith('patches/')) fail(`compatibility.patches[${index}].file must stay within patches/`)
    if (!digestPattern.test(string(patch.sha256, `compatibility.patches[${index}].sha256`))) fail(`compatibility.patches[${index}].sha256 must be a SHA-256 digest`)
  }

  return manifest
}
