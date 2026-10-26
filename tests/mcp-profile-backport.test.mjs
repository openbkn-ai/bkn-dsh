import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { tarExecutable } from '../scripts/portable-tar.mjs'

const root = new URL('../compat/mcp-profile-backport/', import.meta.url)
const manifest = JSON.parse(readFileSync(new URL('ARTIFACTS.json', root), 'utf8'))
const sha256 = value => createHash('sha256').update(value).digest('hex')

test('release companions retain all previously accepted payload bytes for each fixed Host', () => {
  assert.deepEqual(manifest.artifacts.map(row => row.hostVersion), ['0.2.0-rc.2', '0.2.1-rc.3'])
  for (const row of manifest.artifacts) {
    const archive = fileURLToPath(new URL(row.artifact, root))
    const bytes = readFileSync(archive)
    assert.equal(bytes.length, row.bytes)
    assert.equal(sha256(bytes), row.sha256)
    const inventory = JSON.parse(readFileSync(new URL(row.filesManifest, root), 'utf8'))
    const files = Object.entries(inventory).map(([path, sha256]) => ({ path, sha256 }))
    assert.equal(files.length, 12)
    for (const file of files) {
      const path = file.path.startsWith('package/') ? file.path : `package/${file.path}`
      const content = execFileSync(tarExecutable(), ['-xzOf', archive, path])
      assert.equal(sha256(content), file.sha256, `${row.hostVersion}: ${path}`)
    }
    assert.equal(sha256(execFileSync(tarExecutable(), ['-xzOf', archive, 'package/lib/index.js'])), manifest.protectedEntrySha256)
  }
})
