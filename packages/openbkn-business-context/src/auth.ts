/** A deliberately narrow process boundary around the installed OpenBKN CLI. */
export interface OpenBknCli {
  run(args: readonly string[], signal?: AbortSignal): Promise<CliResult>
}

/** Process result exposed only inside the Host authentication coordinator. */
export interface CliResult {
  readonly code: number
  readonly stdout: string
  readonly stderr: string
}

import type { AuthSnapshot } from './types.js'
import { passiveDiagnostics, type PassiveDiagnosticsWriter } from './diagnostics-observer.js'
import { trimTrailingSlashes } from './trailing-slashes.js'

export type { AuthSnapshot } from './types.js'

/**
 * `openbkn auth status --json`. Two fields are not always printed: a CLI
 * that has never logged in prints only `{ hasToken: false }`, and CLI 0.1.5
 * omits `expired` when it cannot determine the token's expiry.
 */
interface CliAuthStatus {
  readonly baseUrl?: string
  readonly userId?: string
  readonly username?: string
  readonly hasToken: boolean
  readonly expired?: boolean
}

/** Thrown when the CLI cannot provide a trustworthy authentication status. */
export class OpenBknCliError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'OpenBknCliError'
  }
}

/**
 * Owns authentication lifecycle decisions. OpenBKN CLI remains the credential
 * store and refresh authority. Its token value is read only after an exact
 * platform fence and is returned only to Host-side credential synchronization.
 */
export class AuthCoordinator {
  private readonly baseUrl: string
  private readonly observations = passiveDiagnostics.writer()

  constructor(private readonly cli: OpenBknCli, baseUrl: string) {
    this.baseUrl = normalizeBaseUrl(baseUrl)
  }

  /** Read the active CLI session and fence it to this plugin's configured platform. */
  async status(signal?: AbortSignal): Promise<AuthSnapshot> {
    const result = await this.cli.run(['auth', 'status', '--json'], signal)
    signal?.throwIfAborted()
    if (result.code !== 0) throw cliFailure('read authentication status', result)

    const status = parseStatus(result.stdout, this.observations)
    // No active platform in the CLI: nobody has logged in yet.
    if (status.baseUrl === undefined) return observed({ kind: 'authentication-required', baseUrl: this.baseUrl }, this.observations)
    const actualBaseUrl = normalizeBaseUrl(status.baseUrl)
    if (actualBaseUrl !== this.baseUrl) {
      return observed({
        kind: 'platform-mismatch',
        expectedBaseUrl: this.baseUrl,
        actualBaseUrl,
      }, this.observations)
    }
    // An unknown expiry is not a refusal: `auth token` is the CLI's refresh
    // authority and fails by itself when the session cannot be renewed.
    if (!status.hasToken || status.expired === true) {
      return observed({ kind: 'authentication-required', baseUrl: this.baseUrl }, this.observations)
    }
    return observed({
      kind: 'authenticated',
      baseUrl: this.baseUrl,
      ...(status.userId === undefined ? {} : { userId: status.userId }),
      ...(status.username === undefined ? {} : { username: status.username }),
    }, this.observations)
  }

  /**
   * Ask the CLI to initiate its normal local-browser OAuth flow. The plugin
   * deliberately does not use `--no-browser`: that variant requires a human
   * to paste an OAuth callback into stdin, while DSH's managed subprocess has
   * no terminal input surface. Its human-facing output is not persisted here.
   */
  async beginLogin(signal?: AbortSignal): Promise<void> {
    const result = await this.cli.run(['auth', 'login', this.baseUrl], signal)
    signal?.throwIfAborted()
    if (result.code !== 0) throw cliFailure('start login', result)
  }

  /**
   * Read one refreshed token for the configured, authenticated platform.
   * Callers must immediately write it to DSH credentials and must never expose
   * this value through a Remote result, UI state, diagnostics, or logs.
   */
  async readToken(signal?: AbortSignal): Promise<string> {
    const snapshot = await this.status(signal)
    if (snapshot.kind !== 'authenticated') {
      throw new OpenBknCliError('OpenBKN CLI is not authenticated for the configured platform')
    }
    const result = await this.cli.run(['auth', 'token'], signal)
    signal?.throwIfAborted()
    if (result.code !== 0) throw cliFailure('read authentication token', result)
    const token = result.stdout.trim()
    if (token.length === 0 || token.length > 16_384 || /[\r\n]/.test(token)) {
      throw cliOutputInvalid('OpenBKN CLI returned an invalid authentication token', this.observations)
    }
    return token
  }
}

function parseStatus(stdout: string, observations: PassiveDiagnosticsWriter): CliAuthStatus {
  let value: unknown
  try {
    value = JSON.parse(stdout)
  } catch {
    throw cliOutputInvalid('OpenBKN CLI returned invalid JSON for auth status', observations)
  }
  if (typeof value !== 'object' || value === null) {
    throw cliOutputInvalid('OpenBKN CLI returned an invalid auth status payload', observations)
  }
  const candidate = value as Record<string, unknown>
  if (typeof candidate.hasToken !== 'boolean') {
    throw cliOutputInvalid('OpenBKN CLI auth status is missing required fields', observations)
  }
  // A session with a token must name its platform; only a logged-out CLI may omit it.
  if (candidate.baseUrl === undefined ? candidate.hasToken : typeof candidate.baseUrl !== 'string') {
    throw cliOutputInvalid('OpenBKN CLI auth status has no valid platform address', observations)
  }
  if (candidate.expired !== undefined && typeof candidate.expired !== 'boolean') {
    throw cliOutputInvalid('OpenBKN CLI auth status contains an invalid expiry flag', observations)
  }
  if (candidate.userId !== undefined && typeof candidate.userId !== 'string') {
    throw cliOutputInvalid('OpenBKN CLI auth status contains an invalid user id', observations)
  }
  if (candidate.username !== undefined && typeof candidate.username !== 'string') {
    throw cliOutputInvalid('OpenBKN CLI auth status contains an invalid username', observations)
  }
  return {
    hasToken: candidate.hasToken,
    ...(candidate.baseUrl === undefined ? {} : { baseUrl: candidate.baseUrl as string }),
    ...(candidate.expired === undefined ? {} : { expired: candidate.expired as boolean }),
    ...(candidate.userId === undefined ? {} : { userId: candidate.userId }),
    ...(candidate.username === undefined ? {} : { username: candidate.username }),
  }
}

function normalizeBaseUrl(value: string): string {
  return trimTrailingSlashes(value)
}

function cliFailure(action: string, result: CliResult): OpenBknCliError {
  const detail = result.stderr.trim() || 'no diagnostic output'
  return new OpenBknCliError(`OpenBKN CLI could not ${action}: ${detail}`)
}

/** Record one observed authentication outcome, then hand the snapshot through. */
function observed(snapshot: AuthSnapshot, observations: PassiveDiagnosticsWriter): AuthSnapshot {
  if (snapshot.kind === 'authenticated') {
    observations.record({ subject: 'login-state', stage: 'authentication', code: 'login-state', status: 'pass', evidence: { loggedIn: true } })
  } else if (snapshot.kind === 'platform-mismatch') {
    observations.record({ subject: 'login-state', stage: 'authentication', code: 'platform-mismatch', status: 'fail', evidence: { platformMismatch: true } })
  } else {
    observations.record({ subject: 'login-state', stage: 'authentication', code: 'not-logged-in', status: 'fail', evidence: { loggedIn: false } })
  }
  return snapshot
}

/** Record one CLI-output parse refusal as its own bounded category. */
function cliOutputInvalid(reason: string, observations: PassiveDiagnosticsWriter): OpenBknCliError {
  observations.record({ subject: 'cli', stage: 'cli', code: 'cli-output-invalid', status: 'fail' })
  return new OpenBknCliError(reason)
}
