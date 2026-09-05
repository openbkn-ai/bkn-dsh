import assert from 'node:assert/strict'
import test from 'node:test'
import { OpenBknCliSubprocess } from '../src/openbkn-cli-subprocess.ts'

function runtime() {
  let spec: unknown
  return {
    subprocess: {
      spawn(next: unknown) {
        spec = next
        return {
          done: Promise.resolve({ exitCode: 0 }),
          collected: {
            stdout: { readFrom: () => ({ text: 'login started', lossy: false }) },
            stderr: { readFrom: () => ({ text: '', lossy: false }) },
          },
        }
      },
    },
    spec: () => spec as { argv: readonly string[]; cwd: string; stdio: { stdout: { maxBytes: number } } },
  }
}

test('starts login only for the plugin configured OpenBKN platform', async () => {
  const fake = runtime()
  const cli = new OpenBknCliSubprocess(fake.subprocess, '.', 'https://poc.openbkn.ai')

  await cli.run(['auth', 'login', 'https://poc.openbkn.ai'])

  assert.deepEqual(fake.spec().argv, ['openbkn', 'auth', 'login', 'https://poc.openbkn.ai'])
  assert.equal(fake.spec().cwd, '.')
  assert.equal(fake.spec().stdio.stdout.maxBytes, 64 * 1024)
})

test('rejects a login request that attempts to select another OpenBKN platform', async () => {
  const fake = runtime()
  const cli = new OpenBknCliSubprocess(fake.subprocess, '.', 'https://poc.openbkn.ai')

  await assert.rejects(
    cli.run(['auth', 'login', 'https://other.openbkn.ai']),
    /not allowed/i,
  )
  assert.equal(fake.spec(), undefined)
})
