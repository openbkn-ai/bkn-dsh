import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { checkDshHostCompatibility, readDshHosts } from '../scripts/dsh-host-compatibility.mjs'

const pkg = () => JSON.parse(readFileSync(new URL('../packages/openbkn-business-context/package.json', import.meta.url), 'utf8'))
const build = () => JSON.parse(readFileSync(new URL('../runtime/openbkn-dsh-runtime.manifest.json', import.meta.url), 'utf8'))

test('one plugin declares both pinned hosts while retaining the old build baseline', () => {
  const matrix = checkDshHostCompatibility(pkg(), build())
  assert.deepEqual(matrix.hosts.map(host => host.version), ['0.2.0-rc.2', '0.2.1-rc.3'])
  assert.equal(matrix.buildVersion, '0.2.0-rc.2')
})

test('an old-only, new-only or broad host range cannot pass the release check', () => {
  for (const range of ['0.2.0-rc.2', '0.2.1-rc.3', '0.2.0-rc.2 || 0.2.1-rc.2', '>=0.2.0-rc.2', '*']) {
    const candidate = pkg()
    candidate.peerDependencies['@deepseek-ai/dsh-tools'] = range
    assert.throws(() => checkDshHostCompatibility(candidate, build()), /runtime peers/)
  }
})

test('the compatibility gate rejects schema dependency drift and a different source build pin', () => {
  const candidate = pkg(); candidate.dependencies.zod = '^4.4.3'
  assert.throws(() => checkDshHostCompatibility(candidate, build()), /Zod/)
  const other = build(); other.dsh.tag = 'dsh-v0.2.1-rc.3'
  assert.throws(() => checkDshHostCompatibility(pkg(), other), /build pin/)
})

test('host identities cannot be duplicated, unpinned or replaced by an unreviewed build version', () => {
  for (const change of [
    matrix => { matrix.hosts.push(matrix.hosts[0]) },
    matrix => { matrix.hosts[1].commit = 'main' },
    matrix => { matrix.hosts[1].tag = 'dsh-v0.2.1-rc.1' },
    matrix => { matrix.buildVersion = '0.2.2' },
  ]) {
    const matrix = structuredClone(readDshHosts()); change(matrix)
    assert.throws(() => readDshHosts(matrix))
  }
})

test('a second DSH version cannot slip into any development dependency', () => {
  for (const change of [
    candidate => { candidate.devDependencies['@deepseek-ai/dsh-api-remotes'] = '0.2.1-rc.3' },
    candidate => { delete candidate.devDependencies['@deepseek-ai/dsh-storage'] },
  ]) {
    const candidate = pkg(); change(candidate)
    assert.throws(() => checkDshHostCompatibility(candidate, build()), /development dependencies/)
  }
})
