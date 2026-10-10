import assert from 'node:assert/strict'
import test from 'node:test'
import { OpenBknCliSetup } from '../src/cli-setup.ts'
import type { CliSubprocess } from '../src/openbkn-cli-subprocess.ts'
import { passiveDiagnostics } from '../src/diagnostics-observer.ts'

function fixture(platform: NodeJS.Platform = 'darwin') {
  const prefix = platform === 'win32' ? 'C:\\CLI Folder' : '/isolated npm'
  const npm = platform === 'win32' ? 'C:\\node\\npm.cmd' : '/node/npm'
  const node = platform === 'win32' ? 'C:\\node\\node.exe' : '/node/node'
  const binary = platform === 'win32' ? `${prefix}\\openbkn.cmd` : `${prefix}/bin/openbkn`
  const available = new Map<string, string>([['npm', npm], ['node', node]])
  const files = new Set<string>()
  const commands: (readonly string[])[] = []
  let installCode = 0, installError = '', versionCode = 0, version = '0.1.5', nodeVersion = 'v24.19.0', postVerify = true
  let release: (() => void) | undefined
  let held = false
  const subprocess: CliSubprocess = {
    async resolveExecutable(command, _env, signal) {
      signal?.throwIfAborted()
      const executable = available.get(command)
      if (executable === undefined) throw new Error('not found; SECRET_CANARY')
      return executable
    },
    spawn(spec) {
      commands.push(spec.argv)
      assert.equal(spec.stdio.stdin.data, '')
      let stdout = '', stderr = '', code = 0
      const done = (async () => {
        if (spec.argv[0] === npm && spec.argv[1] === 'prefix') stdout = prefix
        else if (spec.argv[0] === npm && spec.argv[1] === 'install') {
          if (held) await new Promise<void>(resolve => { release = resolve })
          code = installCode; stderr = installError
          if (code === 0 && postVerify) available.set(binary, binary)
        } else if (spec.argv[0] === node) stdout = nodeVersion
        else { stdout = version; code = versionCode }
        return { exitCode: code }
      })()
      return { done, collected: {
        stdout: { readFrom: () => ({ text: stdout, lossy: false }) },
        stderr: { readFrom: () => ({ text: stderr, lossy: false }) },
      } }
    },
  }
  const setup = new OpenBknCliSetup(subprocess, '/work', { platform, home: platform === 'win32' ? 'C:\\Users\\tester' : '/user', env: {}, exists: async file => files.has(file) })
  return { setup, available, files, commands, prefix, npm, node, binary,
    setInstall: (code: number, error: string) => { installCode = code; installError = error },
    setVersion: (code: number, value: string) => { versionCode = code; version = value },
    setNode: (value: string) => { nodeVersion = value },
    hold: () => { held = true }, release: () => release?.(), noVerification: () => { postVerify = false },
  }
}

test('a usable existing CLI is resolved and never installed or upgraded', async () => {
  const f = fixture()
  f.available.set('openbkn', '/existing/openbkn')
  f.setVersion(0, '0.1.4')
  const ready = { state: 'ready', canInstall: false, resolvedPath: '/existing/openbkn', version: '0.1.4' }
  assert.deepEqual(await f.setup.check('openbkn'), ready)
  assert.deepEqual(await f.setup.install('openbkn'), ready)
  assert.ok(f.commands.every(command => command[1] === '--version'))
})

test('SDK outside PATH is found through npm prefix and can be used without restarting', async () => {
  const f = fixture()
  f.available.set(f.binary, f.binary)
  const result = await f.setup.check('openbkn')
  assert.equal(result.state, 'ready')
  assert.equal(result.resolvedPath, f.binary)
  assert.equal(f.commands.filter(command => command[1] === 'install').length, 0)
})

test('read-only detection never installs; explicit setup installs only fixed SDK and verifies it', async () => {
  const f = fixture()
  assert.deepEqual(await f.setup.check('openbkn'), { state: 'missing', canInstall: true })
  assert.equal(f.commands.some(command => command[1] === 'install'), false)
  assert.equal((await f.setup.install('openbkn')).state, 'ready')
  assert.deepEqual(f.commands.find(command => command[1] === 'install'), [f.npm, 'install', '--global', '@openbkn/bkn-sdk@0.1.5', '--prefix', f.prefix, '--ignore-scripts', '--no-audit', '--no-fund', '--loglevel=error'])
  assert.deepEqual(f.commands.at(-1), [f.binary, '--version'])
})

test('Windows lookup uses the real .cmd path including spaces', async () => {
  const f = fixture('win32')
  assert.equal((await f.setup.install('openbkn')).resolvedPath, 'C:\\CLI Folder\\openbkn.cmd')
  assert.deepEqual(f.commands.at(-1), [f.binary, '--version'])
})

test('missing custom paths and invalid path input cannot trigger installation', async () => {
  const f = fixture()
  for (const value of ['/custom/missing', 'relative/path', '', 'openbkn\n--other']) {
    assert.equal((await f.setup.install(value)).reason, 'custom-path-missing')
  }
  assert.equal(f.commands.length, 0)
})

test('found but broken CLI and broken existing SDK are never overwritten', async () => {
  const f = fixture()
  f.available.set('openbkn', '/broken/openbkn')
  f.setVersion(1, '')
  assert.equal((await f.setup.install('openbkn')).reason, 'execution-failed')
  f.available.delete('openbkn')
  f.files.add(`${f.prefix}/lib/node_modules/@openbkn/bkn-sdk/package.json`)
  assert.equal((await f.setup.install('openbkn')).reason, 'existing-installation')
  assert.equal(f.commands.some(command => command[1] === 'install'), false)
})

test('file found without execute permission blocks install rather than treating it as absent', async () => {
  const f = fixture()
  f.files.add(f.binary)
  assert.equal((await f.setup.install('openbkn')).reason, 'execution-failed')
  assert.equal(f.commands.some(command => command[1] === 'install'), false)
})

test('missing npm, missing Node and old Node return actionable prerequisites', async () => {
  const f = fixture()
  f.available.delete('npm')
  assert.equal((await f.setup.install('openbkn')).reason, 'npm-missing')
  f.available.set('npm', f.npm)
  f.available.delete('node')
  assert.equal((await f.setup.install('openbkn')).reason, 'node-unavailable')
  f.available.set('node', f.node)
  f.setNode('v22.18.0')
  assert.equal((await f.setup.install('openbkn')).reason, 'node-unavailable')
  assert.equal(f.commands.some(command => command[1] === 'install'), false)
})

test('install exit zero without executable verification is not ready', async () => {
  const f = fixture()
  f.noVerification()
  assert.deepEqual(await f.setup.install('openbkn'), { state: 'failed', canInstall: false, reason: 'verification-failed' })
})

test('installation prerequisites follow the supported Node range and reject Node 23', async () => {
  for (const version of ['v20.20.0', 'v22.18.0', 'v23.11.0']) {
    const f = fixture()
    f.setNode(version)
    assert.equal((await f.setup.install('openbkn')).reason, 'node-unavailable')
    assert.equal(f.commands.some(command => command[1] === 'install'), false)
  }
  for (const version of ['v22.19.0', 'v22.20.0', 'v24.0.0', 'v25.0.0']) {
    const f = fixture()
    f.setNode(version)
    assert.deepEqual(await f.setup.check('openbkn'), { state: 'missing', canInstall: true })
  }
})

test('installed CLI must report the requested version before setup claims success', async () => {
  const f = fixture()
  f.setVersion(0, '0.1.4')
  assert.equal((await f.setup.install('openbkn')).reason, 'verification-failed')
})

test('npm errors are classified without exporting raw secrets', async () => {
  for (const [code, reason] of [['EACCES', 'permission-denied'], ['ECONNRESET', 'network-failed'], ['DEPTH_ZERO_SELF_SIGNED_CERT', 'tls-failed'], ['OTHER', 'installation-failed']]) {
    const f = fixture()
    f.setInstall(1, `npm error ${code} https://secret:SECRET_CANARY@private-registry`)
    const result = await f.setup.install('openbkn')
    assert.equal(result.state, 'failed')
    assert.equal(result.reason, reason)
    assert.ok(!JSON.stringify(result).includes('SECRET_CANARY'))
  }
})

test('simultaneous setup requests share one installation; reopened checks see installing', async () => {
  const f = fixture()
  f.hold()
  const first = f.setup.install('openbkn')
  const second = f.setup.install('openbkn')
  assert.equal(first, second)
  assert.deepEqual(await f.setup.check('openbkn'), { state: 'installing', canInstall: false })
  while (!f.commands.some(command => command[1] === 'install')) await new Promise(resolve => setImmediate(resolve))
  f.release()
  assert.equal((await first).state, 'ready')
  assert.equal((await second).state, 'ready')
  assert.equal(f.commands.filter(command => command[1] === 'install').length, 1)
})

test('aborted read-only detection does not install or project a success', async () => {
  const f = fixture()
  const controller = new AbortController()
  controller.abort()
  await assert.rejects(f.setup.check('openbkn', controller.signal), { name: 'AbortError' })
  assert.equal(f.commands.length, 0)
})

test('version availability cannot clear earlier CLI/authentication diagnostic failures', async () => {
  passiveDiagnostics.clear()
  try {
    const writer = passiveDiagnostics.writer()
    writer.record({ subject: 'cli', stage: 'cli', code: 'cli-output-invalid', status: 'fail' })
    writer.record({ subject: 'login-state', stage: 'authentication', code: 'auth-rejected', status: 'fail' })
    const f = fixture()
    f.available.set('openbkn', '/existing/openbkn')
    assert.equal((await f.setup.check('openbkn')).state, 'ready')
    assert.deepEqual(passiveDiagnostics.snapshot().map(check => [check.code, check.status]), [['cli-output-invalid', 'fail'], ['auth-rejected', 'fail']])
  } finally { passiveDiagnostics.clear() }
})
