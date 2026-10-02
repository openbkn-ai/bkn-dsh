import assert from 'node:assert/strict'
import test from 'node:test'
import { OpenBknCliSubprocess, OpenBknCliUnavailableError } from '../src/openbkn-cli-subprocess.ts'

function runtime(resolve: (command: string) => Promise<string> = async command => `/usr/local/bin/${command}`) {
  let spec: unknown
  const resolved: string[] = []
  return {
    resolved,
    subprocess: {
      async resolveExecutable(command: string) {
        resolved.push(command)
        return await resolve(command)
      },
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

  assert.deepEqual(fake.spec().argv, ['/usr/local/bin/openbkn', 'auth', 'login', 'https://poc.openbkn.ai'])
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

test('allows only the fixed CLI token command for Host credential synchronization', async () => {
  const fake = runtime()
  const cli = new OpenBknCliSubprocess(fake.subprocess, '.', 'https://poc.openbkn.ai')

  await cli.run(['auth', 'token'])

  assert.deepEqual(fake.spec().argv, ['/usr/local/bin/openbkn', 'auth', 'token'])
})

test('spawns the executable DSH resolves, so a Windows PATHEXT shim like openbkn.cmd is found', async () => {
  const fake = runtime(async command => `C:\\Users\\u\\scoop\\persist\\nodejs-lts\\bin\\${command}.cmd`)
  const cli = new OpenBknCliSubprocess(fake.subprocess, '.', 'https://poc.openbkn.ai')

  await cli.run(['auth', 'status', '--json'])

  assert.deepEqual(fake.resolved, ['openbkn'])
  assert.deepEqual(fake.spec().argv, ['C:\\Users\\u\\scoop\\persist\\nodejs-lts\\bin\\openbkn.cmd', 'auth', 'status', '--json'])
})

test('resolves a configured cliPath instead of the default name', async () => {
  const fake = runtime(async command => command)
  const cli = new OpenBknCliSubprocess(fake.subprocess, '.', 'https://poc.openbkn.ai', '/opt/openbkn/bin/openbkn')

  await cli.run(['auth', 'token'])

  assert.deepEqual(fake.resolved, ['/opt/openbkn/bin/openbkn'])
  assert.equal(fake.spec().argv[0], '/opt/openbkn/bin/openbkn')
})

test('reports a missing CLI as unavailable and never spawns', async () => {
  const fake = runtime(async () => { throw new Error('subprocess-local: command "openbkn" was not found on PATH') })
  const cli = new OpenBknCliSubprocess(fake.subprocess, '.', 'https://poc.openbkn.ai')

  await assert.rejects(cli.run(['auth', 'status', '--json']), (error: unknown) =>
    error instanceof OpenBknCliUnavailableError && error.cliPath === 'openbkn' && /not found on PATH/.test(String((error.cause as Error).message)))
  assert.equal(fake.spec(), undefined)
})
