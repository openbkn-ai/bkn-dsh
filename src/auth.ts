/** A deliberately narrow process boundary around the installed OpenBKN CLI. */
export interface OpenBknCli {
  run(args: readonly string[]): Promise<CliResult>
}

/** Process result exposed to the coordinator; credential output is never requested. */
export interface CliResult {
  readonly code: number
  readonly stdout: string
  readonly stderr: string
}

/** Safe, UI-ready representation of OpenBKN authentication state. */
export type AuthSnapshot =
  | { readonly kind: 'authenticated'; readonly baseUrl: string; readonly userId?: string; readonly username?: string }
  | { readonly kind: 'authentication-required'; readonly baseUrl: string }
  | { readonly kind: 'platform-mismatch'; readonly expectedBaseUrl: string; readonly actualBaseUrl: string }

interface CliAuthStatus {
  readonly baseUrl: string
  readonly userId?: string
  readonly username?: string
  readonly hasToken: boolean
  readonly expired: boolean
}

/** Thrown when the CLI cannot provide a trustworthy authentication status. */
export class OpenBknCliError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'OpenBknCliError'
  }
}

/**
 * Owns only authentication lifecycle decisions. OpenBKN CLI remains the
 * credential store and refresh authority; this class never calls `token` or
 * `export`, and therefore never receives a credential value.
 */
export class AuthCoordinator {
  private readonly baseUrl: string

  constructor(private readonly cli: OpenBknCli, baseUrl: string) {
    this.baseUrl = normalizeBaseUrl(baseUrl)
  }

  /** Read the active CLI session and fence it to this plugin's configured platform. */
  async status(): Promise<AuthSnapshot> {
    const result = await this.cli.run(['auth', 'status', '--json'])
    if (result.code !== 0) throw cliFailure('read authentication status', result)

    const status = parseStatus(result.stdout)
    const actualBaseUrl = normalizeBaseUrl(status.baseUrl)
    if (actualBaseUrl !== this.baseUrl) {
      return {
        kind: 'platform-mismatch',
        expectedBaseUrl: this.baseUrl,
        actualBaseUrl,
      }
    }
    if (!status.hasToken || status.expired) {
      return { kind: 'authentication-required', baseUrl: this.baseUrl }
    }
    return {
      kind: 'authenticated',
      baseUrl: this.baseUrl,
      ...(status.userId === undefined ? {} : { userId: status.userId }),
      ...(status.username === undefined ? {} : { username: status.username }),
    }
  }

  /**
   * Ask the CLI to initiate browser login. Its human-facing output is not
   * persisted here; a later DSH interaction adapter owns presentation.
   */
  async beginLogin(): Promise<void> {
    const result = await this.cli.run(['auth', 'login', this.baseUrl, '--no-browser'])
    if (result.code !== 0) throw cliFailure('start login', result)
  }
}

function parseStatus(stdout: string): CliAuthStatus {
  let value: unknown
  try {
    value = JSON.parse(stdout)
  } catch {
    throw new OpenBknCliError('OpenBKN CLI returned invalid JSON for auth status')
  }
  if (typeof value !== 'object' || value === null) {
    throw new OpenBknCliError('OpenBKN CLI returned an invalid auth status payload')
  }
  const candidate = value as Record<string, unknown>
  if (typeof candidate.baseUrl !== 'string'
    || typeof candidate.hasToken !== 'boolean'
    || typeof candidate.expired !== 'boolean') {
    throw new OpenBknCliError('OpenBKN CLI auth status is missing required fields')
  }
  if (candidate.userId !== undefined && typeof candidate.userId !== 'string') {
    throw new OpenBknCliError('OpenBKN CLI auth status contains an invalid user id')
  }
  if (candidate.username !== undefined && typeof candidate.username !== 'string') {
    throw new OpenBknCliError('OpenBKN CLI auth status contains an invalid username')
  }
  return {
    baseUrl: candidate.baseUrl,
    hasToken: candidate.hasToken,
    expired: candidate.expired,
    ...(candidate.userId === undefined ? {} : { userId: candidate.userId }),
    ...(candidate.username === undefined ? {} : { username: candidate.username }),
  }
}

function normalizeBaseUrl(value: string): string {
  return value.replace(/\/+$/, '')
}

function cliFailure(action: string, result: CliResult): OpenBknCliError {
  const detail = result.stderr.trim() || 'no diagnostic output'
  return new OpenBknCliError(`OpenBKN CLI could not ${action}: ${detail}`)
}
