import assert from 'node:assert/strict'
import test from 'node:test'
import { AuthCoordinator, type CliResult, type OpenBknCli } from '../src/auth.ts'

class FakeCli implements OpenBknCli {
  readonly invocations: string[][] = []

  constructor(private readonly responses: CliResult[]) {}

  async run(args: readonly string[]): Promise<CliResult> {
    this.invocations.push([...args])
    const response = this.responses.shift()
    if (response === undefined) throw new Error('unexpected CLI invocation')
    return response
  }
}

const json = (value: object): CliResult => ({ code: 0, stdout: JSON.stringify(value), stderr: '' })

test('reports the authenticated CLI session without reading a token', async () => {
  const cli = new FakeCli([json({
    baseUrl: 'https://poc.openbkn.ai',
    userId: 'user-1',
    username: 'admin',
    hasToken: true,
    expired: false,
  })])
  const auth = new AuthCoordinator(cli, 'https://poc.openbkn.ai')

  assert.deepEqual(await auth.status(), {
    kind: 'authenticated',
    baseUrl: 'https://poc.openbkn.ai',
    userId: 'user-1',
    username: 'admin',
  })
  assert.deepEqual(cli.invocations, [['auth', 'status', '--json']])
})

test('requires an OpenBKN login for missing or expired CLI credentials', async () => {
  const cli = new FakeCli([json({
    baseUrl: 'https://poc.openbkn.ai',
    hasToken: true,
    expired: true,
  })])
  const auth = new AuthCoordinator(cli, 'https://poc.openbkn.ai')

  assert.deepEqual(await auth.status(), {
    kind: 'authentication-required',
    baseUrl: 'https://poc.openbkn.ai',
  })
})

test('does not accept an authenticated CLI session for another platform', async () => {
  const cli = new FakeCli([json({
    baseUrl: 'https://another.openbkn.ai',
    hasToken: true,
    expired: false,
  })])
  const auth = new AuthCoordinator(cli, 'https://poc.openbkn.ai')

  assert.deepEqual(await auth.status(), {
    kind: 'platform-mismatch',
    expectedBaseUrl: 'https://poc.openbkn.ai',
    actualBaseUrl: 'https://another.openbkn.ai',
  })
})

test('starts login for the configured platform without passing or retaining a token', async () => {
  const cli = new FakeCli([{ code: 0, stdout: 'Open the browser to continue', stderr: '' }])
  const auth = new AuthCoordinator(cli, 'https://poc.openbkn.ai')

  await auth.beginLogin()

  assert.deepEqual(cli.invocations, [['auth', 'login', 'https://poc.openbkn.ai', '--no-browser']])
  assert.equal(JSON.stringify(cli.invocations).includes('token'), false)
})
