import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import semver from 'semver'
import { checkDshHostCompatibility, readDshHosts, dshLoadRange } from '../scripts/dsh-host-compatibility.mjs'

const pkg = () => JSON.parse(readFileSync(new URL('../packages/openbkn-business-context/package.json', import.meta.url), 'utf8'))
const build = () => JSON.parse(readFileSync(new URL('../runtime/openbkn-dsh-runtime.manifest.json', import.meta.url), 'utf8'))

test('pinned test anchors are independent of the open-ended loading policy', () => {
  const matrix = checkDshHostCompatibility(pkg(), build())
  assert.deepEqual(matrix.hosts.map(host => host.version), ['0.2.0-rc.2', '0.2.1-rc.3'])
  assert.equal(matrix.buildVersion, '0.2.0-rc.2')
  assert.equal(dshLoadRange(matrix), '0.2.0-rc.2 || >=0.2.1-rc.3')
})

test('DSH native prerelease semantics admit every newer version, including future major releases', () => {
  const range = pkg().engines.dsh
  // These are version-admission examples, not runtime acceptance claims.
  for (const version of ['0.2.0-rc.2', '0.2.1-rc.3', '0.2.1-rc.5', '0.2.1', '0.2.2-alpha.2', '0.3.0-rc.1', '1.0.0', '99.0.0-alpha.1']) {
    assert.equal(semver.satisfies(version, range, { includePrerelease: true }), true, version)
  }
  for (const version of ['0.1.9', '0.2.0', '0.2.1-alpha.9', '0.2.1-rc.2', 'invalid']) {
    assert.equal(semver.satisfies(version, range, { includePrerelease: true }), false, version)
  }
})

test('stale, bounded and inconsistent engine or peer ranges cannot override the policy', () => {
  for (const range of ['0.2.0-rc.2', '0.2.1-rc.3', '0.2.0-rc.2 || 0.2.1-rc.2', '>=0.2.0-rc.2', '>=0.2.1-rc.3 <0.3.0-0', '*']) {
    const candidate = pkg()
    candidate.peerDependencies['@deepseek-ai/dsh-tools'] = range
    assert.throws(() => checkDshHostCompatibility(candidate, build()), /runtime peers/)
    const engineCandidate = pkg(); engineCandidate.engines.dsh = range
    assert.throws(() => checkDshHostCompatibility(engineCandidate, build()), /DSH engine/)
  }
  const missing = pkg(); delete missing.engines.dsh
  assert.throws(() => checkDshHostCompatibility(missing, build()), /DSH engine/)
})

test('shared Host identity peers have no hidden upper version ceiling', () => {
  for (const name of ['@deepseek-ai/cordis', '@deepseek-ai/schemastery']) {
    for (const version of ['5.0.0', '99.0.0-alpha.1']) {
      assert.equal(semver.satisfies(version, pkg().peerDependencies[name], { includePrerelease: true }), true)
    }
    const candidate = pkg(); candidate.peerDependencies[name] = '^3.18.4'
    assert.throws(() => checkDshHostCompatibility(candidate, build()), /Shared/)
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
    matrix => { matrix.loadPolicy.minimumVersion = '0.2.1-rc.5' },
    matrix => { matrix.loadPolicy.legacyVersions.push('0.2.0-rc.2') },
    matrix => { matrix.loadPolicy.legacyVersions = ['0.1.0'] },
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

test('release naming cannot select an unreviewed Host or disagree with package identity', () => {
  for (const version of ['0.2.1-rc.2', '0.2.2-rc.1', '0.2.0-rc.2']) {
    const candidate = build(); candidate.plugin.hostVersion = version
    assert.throws(() => checkDshHostCompatibility(pkg(), candidate), /release identity/)
  }
  assert.doesNotThrow(() => checkDshHostCompatibility(pkg(), build()))
})
