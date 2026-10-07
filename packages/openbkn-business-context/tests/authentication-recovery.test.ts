import assert from 'node:assert/strict'
import test from 'node:test'
import { OpenBknBusinessContextService } from '../src/business-context-service.ts'
import { OpenBknUiController } from '../src/client/openbkn-ui-controller.ts'
import { Config } from '../src/config.ts'
import { OpenBknPlatformReader } from '../src/platform-reader.ts'

const baseUrl = 'https://platform.example'
const networks = [{ id: 'kn-supply', displayName: 'Supply' }]
const signal = () => AbortSignal.timeout(1_000)

/** The rejected credential stays locally present, as in the Windows report. */
function recoveryCase(handshakeFailure: unknown, catalogueStatus = 200) {
  let token = 'rejected-test-credential'
  let stored: string | undefined
  let rejectHandshake = true
  let loginRepairs = true
  const commands: string[][] = []
  const tools = new Map<string, object>()
  const service = Object.create(OpenBknBusinessContextService.prototype) as OpenBknBusinessContextService
  const config = Config({ baseUrl })
  Object.assign(service, {
    config,
    ctx: {
      credentials: {
        set: async (_ref: unknown, value: string) => { stored = value },
        resolve: async () => stored === undefined ? undefined : { value: stored },
        describe: async () => ({ configured: stored !== undefined }),
      },
      tools: { get: (name: string) => tools.get(name) },
      plugin: async () => {
        if (rejectHandshake) throw handshakeFailure
        tools.set('mcp__openbkn__bkn_start_interaction', {})
        return { dispose: async () => { tools.clear() } }
      },
      subprocess: {
        resolveExecutable: async () => 'openbkn',
        spawn: ({ argv }: { argv: readonly string[] }) => {
          const args = argv.slice(1)
          commands.push([...args])
          let stdout: string
          if (args[1] === 'login') {
            assert.deepEqual(args, ['auth', 'login', baseUrl])
            token = 'renewed-test-credential'
            rejectHandshake = !loginRepairs
            stdout = 'Login completed'
          } else if (args[1] === 'token') stdout = token
          else stdout = JSON.stringify({ baseUrl, hasToken: true })
          return {
            done: Promise.resolve({ exitCode: 0 }),
            collected: { stdout: { readFrom: () => ({ text: stdout, lossy: false }) } },
          }
        },
      },
      openbknWorkspaceBindingRegistry: { get: () => undefined },
    },
    platformReader: () => new OpenBknPlatformReader({
      ...config, resolveToken: async () => stored,
    }, async () => new Response(JSON.stringify({ entries: [{ id: 'kn-supply', name: 'Supply' }] }), { status: catalogueStatus })),
  })
  const controller = new OpenBknUiController({
    status: () => service.remoteStatus(signal()),
    beginLogin: () => service.remoteBeginLogin(signal()),
    configureToken: value => service.remoteConfigureToken(value, signal()),
    listNetworks: () => service.remoteListNetworks(signal()),
    bindNetworkWorkspace: async () => { throw new Error('must not bind') },
    bindNetwork: async () => { throw new Error('must not bind') },
  }, async () => 'session')
  controller.open()
  return { service, controller, commands, allowHandshake: () => { rejectHandshake = false }, rejectAfterLogin: () => { loginRepairs = false } }
}

function rejected(status: 401 | 403) {
  return new Error('initial connection or tool synchronization failed', {
    cause: Object.assign(new Error(`private upstream detail: rejected-test-credential`), {
      code: status === 401 ? 'CLIENT_HTTP_AUTHENTICATION' : 'CLIENT_HTTP_FORBIDDEN',
    }),
  })
}

test('a locally present CLI token rejected by MCP exposes login and recovers through the existing CLI flow', async () => {
  const { controller, commands } = recoveryCase(rejected(401))
  await controller.refresh()
  assert.equal(controller.snapshot().phase, 'authentication-required')
  assert.match(controller.snapshot().message ?? '', /Context Loader MCP.*401/)
  assert.doesNotMatch(JSON.stringify(controller.snapshot()), /rejected-test-credential|已连接/)
  assert.equal(commands.some(args => args[1] === 'login'), false, 'login remains an explicit user action')
  await controller.beginLogin()
  assert.equal(controller.snapshot().phase, 'ready')
  assert.deepEqual(controller.snapshot().networks, networks)
  assert.equal(commands.filter(args => args[1] === 'login').length, 1)
  assert.doesNotMatch(JSON.stringify(controller.snapshot()), /renewed-test-credential/)
})

test('manual-token and login verification retain an MCP 401 as an authentication-required Remote error', async () => {
  const { service, controller } = recoveryCase(rejected(401))
  await controller.configureToken('rejected-test-credential')
  assert.equal(controller.snapshot().phase, 'authentication-required')
  await assert.rejects(service.remoteStatus(signal()), (error: unknown) => {
    const failure = error as { code?: string; details?: object; cause?: unknown }
    assert.equal(failure.code, 'openbkn/authentication-required')
    assert.deepEqual(failure.details, { baseUrl, layer: 'context-loader-mcp', httpStatus: 401 })
    assert.equal(failure.cause, undefined, 'the upstream error may contain private details')
    return true
  })
})

test('a completed CLI login whose credential is still rejected keeps the login recovery state', async () => {
  const { controller, rejectAfterLogin } = recoveryCase(rejected(401))
  rejectAfterLogin()
  await controller.beginLogin()
  assert.equal(controller.snapshot().phase, 'authentication-required')
  assert.match(controller.snapshot().message ?? '', /401/)
  assert.deepEqual(controller.snapshot().networks, [])
})

test('MCP permission denial and transport failures do not offer re-login as their classification', async () => {
  for (const failure of [rejected(403), Object.assign(new Error('certificate rejected'), { code: 'DEPTH_ZERO_SELF_SIGNED_CERT' }), new Error('connect ECONNREFUSED')]) {
    const { controller, commands } = recoveryCase(failure)
    await controller.refresh()
    assert.equal(controller.snapshot().phase, 'error')
    assert.equal(commands.some(args => args[1] === 'login'), false)
    if (failure.cause !== undefined) assert.match(controller.snapshot().message ?? '', /403.*管理员/)
    assert.doesNotMatch(JSON.stringify(controller.snapshot()), /private upstream detail|rejected-test-credential/)
  }
})

test('the platform catalogue reports 401 and 403 separately after a successful MCP handshake', async () => {
  for (const status of [401, 403]) {
    const { controller, allowHandshake } = recoveryCase(undefined, status)
    allowHandshake()
    await controller.refresh()
    assert.equal(controller.snapshot().phase, status === 401 ? 'authentication-required' : 'error')
    assert.match(controller.snapshot().message ?? '', new RegExp(`平台.*${status}`))
  }
})
