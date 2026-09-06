import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'

const readJson = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url)))

test('ships a DSH bundle with separate host and browser entry points', () => {
  const manifestUrl = new URL('../package.json', import.meta.url)
  assert.equal(existsSync(manifestUrl), true)

  const manifest = readJson('../package.json')
  assert.equal(manifest.type, 'module')
  assert.equal(manifest.dsh.bundle.patch, './cordis.patch.yml')
  assert.equal(manifest.exports['.'].default, './lib/index.js')
  assert.equal(manifest.exports['./client'].default, './lib/client.js')
  assert.equal(manifest.dsh.client.platform, 'web')
  assert.equal(manifest.dsh.client.inject.includes('@deepseek-ai/dsh-client-ui-slots'), true)
})

test('activates only its own host row through the bundle patch', () => {
  const patchUrl = new URL('../cordis.patch.yml', import.meta.url)
  assert.equal(existsSync(patchUrl), true)

  const patch = readFileSync(patchUrl, 'utf8')
  assert.match(patch, /id: openbkn-business-context/)
  assert.match(patch, /name: '@openbkn\/dsh-business-context'/)
  assert.doesNotMatch(patch, /ui-conversation/)
  assert.doesNotMatch(patch, /ui-layout/)
})

test('build output matches the manifest entry points', () => {
  assert.equal(existsSync(new URL('../lib/index.js', import.meta.url)), true)
  assert.equal(existsSync(new URL('../lib/client.js', import.meta.url)), true)
})

test('browser entry registers a lazy module factory for the DSH module table', () => {
  let registration
  const source = readFileSync(new URL('../lib/client.js', import.meta.url), 'utf8')
  vm.runInNewContext(source, {
    window: {
      __ModuleLoader__: {
        load: (value) => { registration = value },
      },
    },
  })

  assert.equal(registration.id, '@openbkn/dsh-business-context')
  const requested = []
  const exports = registration.factory((id) => {
    requested.push(id)
    return {}
  })
  assert.equal(typeof exports.apply, 'function')
  assert.deepEqual(requested.sort(), ['react', 'react/jsx-runtime'])
})

test('does not publish an obsolete Host Python runner', () => {
  const manifest = readJson('../package.json')

  assert.equal(manifest.files.some((path) => path.startsWith('runner/')), false)
  assert.equal(manifest.files.includes('schemas/**'), false)
})

test('does not retain an overly broad runner directory glob', () => {
  const manifest = readJson('../package.json')

  assert.equal(manifest.files.includes('runner/**'), false)
})
