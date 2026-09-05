import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import test from 'node:test'

test('generates a strict DSH Remote contract for safe authentication status', () => {
  const host = new URL('../lib/typert.host.js', import.meta.url)
  const remote = new URL('../lib/typert.remote-client.js', import.meta.url)
  const remoteTypes = new URL('../lib/typert.remote-client.d.ts', import.meta.url)
  const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))

  assert.equal(existsSync(host), true)
  assert.equal(existsSync(remote), true)
  assert.equal(existsSync(remoteTypes), true)
  assert.deepEqual(manifest.exports['./types'], {
    types: './lib/types/types.d.ts',
    default: './lib/types/types.js',
  })
  const source = readFileSync(remote, 'utf8')
  const declaration = readFileSync(remoteTypes, 'utf8')
  assert.match(source, /namespace:\s*["']openbknBusinessContext["']/)
  assert.match(source, /method:\s*["']status["']/)
  assert.match(source, /method:\s*["']configureToken["']/)
  assert.match(source, /method:\s*["']getNetworkBinding["']/)
  assert.match(source, /method:\s*["']getTurnProvenance["']/)
  assert.match(source, /method:\s*["']getTurnProvenanceView["']/)
  assert.match(source, /method:\s*["']getSessionSuggestions["']/)
  assert.match(source, /method:\s*["']listNetworks["']/)
  assert.match(source, /method:\s*["']bindNetwork["']/)
  assert.match(declaration, /from ['"]@openbkn\/dsh-business-context\/types['"]/)
  assert.doesNotMatch(source, /method:\s*["']token["']/i)
  assert.doesNotMatch(source, /method:\s*["']runCommand["']/i)
  assert.doesNotMatch(source, /method:\s*["']runSql["']/i)
})
