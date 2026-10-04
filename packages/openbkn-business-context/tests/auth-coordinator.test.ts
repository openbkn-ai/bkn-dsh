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

  assert.deepEqual(cli.invocations, [['auth', 'login', 'https://poc.openbkn.ai']])
  assert.equal(JSON.stringify(cli.invocations).includes('token'), false)
})

test('reads one CLI token only after the authenticated platform has been fenced', async () => {
  const cli = new FakeCli([json({
    baseUrl: 'https://poc.openbkn.ai', hasToken: true, expired: false,
  }), { code: 0, stdout: 'token-value\n', stderr: '' }])
  const auth = new AuthCoordinator(cli, 'https://poc.openbkn.ai')

  assert.equal(await auth.readToken(), 'token-value')
  assert.deepEqual(cli.invocations, [['auth', 'status', '--json'], ['auth', 'token']])
})

test('refuses to request a CLI token for an unauthenticated or foreign platform', async () => {
  const cli = new FakeCli([json({
    baseUrl: 'https://other.openbkn.ai', hasToken: true, expired: false,
  })])
  const auth = new AuthCoordinator(cli, 'https://poc.openbkn.ai')

  await assert.rejects(auth.readToken(), /configured platform/i)
  assert.deepEqual(cli.invocations, [['auth', 'status', '--json']])
})

// Real `openbkn auth status --json` shapes captured 2026-10-04 (CLI 0.1.4 and 0.1.5).

test('CLI 0.1.5 omits `expired` when it cannot tell the token expiry: the session is still authenticated', async () => {
  // Seen with a token stored by a 0.1.4 login and read by CLI 0.1.5.
  const cli = new FakeCli([json({
    baseUrl: 'https://poc.openbkn.ai', userId: 'user-1', hasToken: true, username: 'admin',
  }), json({
    baseUrl: 'https://poc.openbkn.ai', userId: 'user-1', hasToken: true, username: 'admin',
  }), { code: 0, stdout: 'token-value\n', stderr: '' }])
  const auth = new AuthCoordinator(cli, 'https://poc.openbkn.ai')

  assert.deepEqual(await auth.status(), {
    kind: 'authenticated', baseUrl: 'https://poc.openbkn.ai', userId: 'user-1', username: 'admin',
  })
  // `auth token` is the CLI's refresh authority, so an unknown expiry is settled there.
  assert.equal(await auth.readToken(), 'token-value')
})

test('a CLI that has never logged in prints only { hasToken: false }: the user is asked to log in', async () => {
  const cli = new FakeCli([json({ hasToken: false })])
  const auth = new AuthCoordinator(cli, 'https://poc.openbkn.ai')

  assert.deepEqual(await auth.status(), { kind: 'authentication-required', baseUrl: 'https://poc.openbkn.ai' })
})

test('an expired token still asks for login, and malformed fields are still refused', async () => {
  const expired = new AuthCoordinator(new FakeCli([json({ baseUrl: 'https://poc.openbkn.ai', hasToken: true, expired: true })]), 'https://poc.openbkn.ai')
  assert.deepEqual(await expired.status(), { kind: 'authentication-required', baseUrl: 'https://poc.openbkn.ai' })

  for (const payload of [
    { baseUrl: 'https://poc.openbkn.ai', hasToken: true, expired: 'no' },
    { baseUrl: 42, hasToken: true },
    { baseUrl: 'https://poc.openbkn.ai' },
    { hasToken: true },
  ]) {
    const auth = new AuthCoordinator(new FakeCli([json(payload)]), 'https://poc.openbkn.ai')
    await assert.rejects(auth.status(), /auth status/i, JSON.stringify(payload))
  }
})
