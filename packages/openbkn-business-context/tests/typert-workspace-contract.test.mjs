import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import test from 'node:test'

const root = new URL('../../../', import.meta.url)
const packageRoot = new URL('../', import.meta.url)

function readJson(url) {
  return JSON.parse(readFileSync(url))
}

test('keeps the repository as a DSH Typert workspace with one publishable bundle package', () => {
  assert.equal(existsSync(new URL('pnpm-workspace.yaml', root)), true)
  assert.equal(existsSync(new URL('tsconfig.host.json', root)), true)
  assert.equal(existsSync(new URL('tsconfig.client.json', root)), true)
  assert.equal(existsSync(new URL('tsconfig.package.host.json', packageRoot)), true)
  assert.equal(existsSync(new URL('tsconfig.host.json', packageRoot)), false)

  const manifest = readJson(new URL('package.json', packageRoot))
  assert.equal(manifest.name, '@openbkn/dsh-business-context')
  assert.deepEqual(manifest.exports['./typert'], {
    types: './lib/typert.host.d.ts',
    default: './lib/typert.host.js',
  })
  assert.deepEqual(manifest.exports['./remote'], {
    types: './lib/typert.remote-client.d.ts',
    default: './lib/typert.remote-client.js',
  })
})

test('places all plugin runtime assets inside the publishable package', () => {
  for (const path of [
    'src/index.ts',
    'src/client/index.tsx',
    'cordis.patch.yml',
  ]) {
    assert.equal(existsSync(new URL(path, packageRoot)), true, path)
  }
})
