import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

// Exercise the shipped consumer rather than a second implementation.
const client = readFileSync(new URL('../lib/client.js', import.meta.url), 'utf8')
const start = client.indexOf('function remotePort(')
const end = client.indexOf('function createNetworkSessionOpener(', start)
assert.ok(start > 0 && end > start)
const remotePort = new Function(client.slice(start, end) + ';return remotePort;')()
const networks = [{ id: 'synthetic-network', displayName: 'Synthetic directory' }]

function portFor(handle) {
  return remotePort({ remote: { openbknBusinessContext: { beginLoginStream: () => handle } } })
}

test('a verified login result is returned without awaiting iterator cleanup', async () => {
  let disposed = false, returned = false, release
  const cleanup = new Promise(resolve => { release = resolve })
  const handle = {
    [Symbol.asyncIterator]() {
      return { next: async () => ({ done: false, value: networks }),
        return: async () => { returned = true; await cleanup; return { done: true } } }
    },
    dispose() { disposed = true },
  }
  let timer
  try {
    const result = await Promise.race([
      portFor(handle).beginLogin(),
      new Promise((_, reject) => { timer = setTimeout(() => reject(Error('verified result blocked on iterator cleanup')), 100) }),
    ])
    assert.equal(result, networks)
    assert.equal(disposed, true)
    assert.equal(returned, false)
  } finally { clearTimeout(timer); release() }
})

test('a login stream without a verified result is refused and disposed', async () => {
  let disposed = false
  const handle = { [Symbol.asyncIterator]: () => ({ next: async () => ({ done: true }) }), dispose() { disposed = true } }
  await assert.rejects(portFor(handle).beginLogin(), /without a verified network list/)
  assert.equal(disposed, true)
})

test('a rejected first login read is preserved and the stream is disposed', async () => {
  let disposed = false
  const failure = Error('synthetic stream failure')
  const handle = { [Symbol.asyncIterator]: () => ({ next: async () => { throw failure } }), dispose() { disposed = true } }
  await assert.rejects(portFor(handle).beginLogin(), error => error === failure)
  assert.equal(disposed, true)
})

test('the caller cancellation signal still reaches the native login handle', async () => {
  const controller = new AbortController()
  const reason = Error('synthetic cancellation')
  let received, disposed = false
  const port = remotePort({ remote: { openbknBusinessContext: { beginLoginStream(signal) {
    received = signal
    return { [Symbol.asyncIterator]: () => ({ next: () => new Promise((_, reject) => signal.addEventListener('abort', () => reject(signal.reason), { once: true })) }),
      dispose() { disposed = true } }
  } } } })
  const pending = port.beginLogin(controller.signal)
  controller.abort(reason)
  await assert.rejects(pending, error => error === reason)
  assert.equal(received, controller.signal)
  assert.equal(disposed, true)
})
