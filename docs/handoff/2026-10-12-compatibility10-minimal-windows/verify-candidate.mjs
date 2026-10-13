import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, mkdtempSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, relative, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'

const kit = dirname(fileURLToPath(import.meta.url))
const { values } = parseArgs({ options: { tarball: { type: 'string' }, installed: { type: 'string' } } })
assert.ok(values.tarball, '--tarball is required')
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const manifest = JSON.parse(readFileSync(join(kit, 'candidate-manifest.json'), 'utf8'))
const filesBytes = readFileSync(join(kit, 'candidate-files.json'))
assert.equal(sha(filesBytes), manifest.filesManifestSha256, 'candidate file inventory SHA mismatch')
const files = JSON.parse(filesBytes.toString('utf8'))
assert.equal(Object.keys(files).length, manifest.fileCount, 'candidate inventory count mismatch')
function extract(tarball) {
  const root = mkdtempSync(join(tmpdir(), 'bkn-compat10-verify-'))
  const proc = spawnSync('tar', ['-xf', tarball, '-C', root], { encoding: 'utf8' })
  assert.equal(proc.status, 0, `tar failed: ${proc.stderr}`)
  return join(root, 'package')
}
function list(root, current = root) {
  return readdirSync(current, { withFileTypes: true }).flatMap(entry => {
    if (entry.name === 'node_modules') return []
    const path = join(current, entry.name)
    if (entry.isDirectory()) return list(root, path)
    assert.ok(entry.isFile(), `unexpected package entry: ${path}`)
    return [relative(root, path).split('\\').join('/')]
  })
}
function checkPackage(root) {
  root = resolve(root)
  const missing = [], different = []
  for (const [name, expected] of Object.entries(files)) {
    const path = join(root, name)
    if (!existsSync(path)) missing.push(name)
    else if (sha(readFileSync(path)) !== expected) different.push(name)
  }
  const extra = list(root).filter(name => !Object.hasOwn(files, name))
  const version = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version
  const result = { root, version, expected: manifest.fileCount, matched: manifest.fileCount - missing.length - different.length, missing, different, extra }
  assert.equal(version, manifest.version, 'installed version mismatch')
  assert.deepEqual([missing, different, extra], [[], [], []], JSON.stringify(result))
  return result
}
const tarball = resolve(values.tarball)
assert.equal(sha(readFileSync(tarball)), manifest.sha256, 'candidate tarball SHA mismatch')
assert.equal(statSync(tarball).size, manifest.bytes, 'candidate tarball size mismatch')
const sdk = JSON.parse(readFileSync(join(kit, 'sdk-manifest.json'), 'utf8'))
const sdkPath = join(kit, sdk.file)
assert.equal(sha(readFileSync(sdkPath)), sdk.sha256, 'SDK source-build tarball SHA mismatch')
assert.equal(statSync(sdkPath).size, sdk.bytes, 'SDK tarball size mismatch')
assert.equal(JSON.parse(readFileSync(join(extract(sdkPath), 'package.json'), 'utf8')).version, sdk.version, 'SDK package version mismatch')
const extracted = checkPackage(extract(tarball))
console.log(JSON.stringify({ sourceCommit: manifest.sourceCommit, ciRun: manifest.ciRun, sha256: manifest.sha256, sdk, extracted, ...(values.installed ? { installed: checkPackage(values.installed) } : {}) }, null, 2))
