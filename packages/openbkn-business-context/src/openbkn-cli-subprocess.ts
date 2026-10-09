import type { CliResult, OpenBknCli } from './auth.js'
import { exitCodeEvidence, passiveDiagnostics, type PassiveDiagnosticsWriter } from './diagnostics-observer.js'
import { trimTrailingSlashes } from './trailing-slashes.js'

const OUTPUT_LIMIT = 64 * 1024
const GRACE_MS = 3_000

/** Structural subset of DSH subprocess used for the fixed OpenBKN CLI contract. */
export interface CliSubprocess {
  /**
   * DSH's own executable lookup: absolute paths are checked; bare names are
   * searched on the provider's PATH, with PATHEXT on Windows (`openbkn` →
   * `openbkn.cmd`). `spawn` does neither, so a bare name fails there.
   */
  resolveExecutable(command: string, env?: Readonly<Record<string, string>>, signal?: AbortSignal): Promise<string>
  spawn(spec: {
    readonly argv: readonly string[]
    readonly cwd: string
    readonly stdio: {
      readonly stdin: { readonly data: string }
      readonly stdout: { readonly maxBytes: number }
      readonly stderr: { readonly maxBytes: number }
    }
    readonly graceMs: number
    readonly signal?: AbortSignal
  }): {
    readonly done: Promise<{ readonly exitCode: number | null }>
    readonly collected: {
      readonly stdout?: { readFrom(fromByte: number): { readonly text: string; readonly lossy: boolean } }
      readonly stderr?: { readFrom(fromByte: number): { readonly text: string; readonly lossy: boolean } }
    }
  }
}

/** The configured OpenBKN CLI cannot be found or executed by the DSH host. */
export class OpenBknCliUnavailableError extends Error {
  constructor(readonly cliPath: string, options?: ErrorOptions, observations: PassiveDiagnosticsWriter = passiveDiagnostics.writer()) {
    super(`OpenBKN CLI ${JSON.stringify(cliPath)} is not available to the DSH host.`, options)
    this.name = 'OpenBknCliUnavailableError'
    observations.record({ subject: 'cli', stage: 'cli', code: 'cli-missing', status: 'fail' })
  }
}

/** DSH-managed invocation of the OpenBKN CLI with a fixed authentication contract. */
export class OpenBknCliSubprocess implements OpenBknCli {
  private readonly baseUrl: string
  private readonly observations = passiveDiagnostics.writer()

  constructor(
    private readonly subprocess: CliSubprocess,
    private readonly cwd: string,
    baseUrl: string,
    private readonly cliPath = 'openbkn',
  ) {
    this.baseUrl = normalizeBaseUrl(baseUrl)
  }

  async run(args: readonly string[], signal?: AbortSignal): Promise<CliResult> {
    const [, ...rest] = this.resolveArgv(args)
    let executable: string
    try {
      executable = await this.subprocess.resolveExecutable(this.cliPath, undefined, signal)
    } catch (error: unknown) {
      if (signal?.aborted === true) throw error
      throw new OpenBknCliUnavailableError(this.cliPath, { cause: error }, this.observations)
    }
    signal?.throwIfAborted()
    const child = this.subprocess.spawn({
      argv: [executable, ...rest],
      cwd: this.cwd,
      stdio: {
        stdin: { data: '' },
        stdout: { maxBytes: OUTPUT_LIMIT },
        stderr: { maxBytes: OUTPUT_LIMIT },
      },
      graceMs: GRACE_MS,
      ...(signal === undefined ? {} : { signal }),
    })
    const outcome = await child.done
    signal?.throwIfAborted()
    const stdout = child.collected.stdout?.readFrom(0)
    const stderr = child.collected.stderr?.readFrom(0)
    if (stdout?.lossy || stderr?.lossy) {
      // The refusal must land as an outcome: an untrustworthy output is a
      // bounded CLI failure, not silence.
      this.observations.record({ subject: 'cli', stage: 'cli', code: 'cli-output-invalid', status: 'fail', evidence: { lossy: true } })
      throw new Error('OpenBKN CLI output exceeded the safe size limit.')
    }
    const result = { code: outcome.exitCode ?? 1, stdout: stdout?.text ?? '', stderr: stderr?.text ?? '' }
    // One outcome boundary per invocation: a clean exit reconciles earlier
    // CLI failures (missing binary, parse refusals) on the same subject.
    this.observations.record(result.code === 0
      ? { subject: 'cli', stage: 'cli', code: 'cli', status: 'pass', evidence: exitCodeEvidence(result.code) }
      : { subject: 'cli', stage: 'cli', code: 'cli-execution-failed', status: 'fail', evidence: exitCodeEvidence(result.code) })
    return result
  }

  private resolveArgv(args: readonly string[]): readonly string[] {
    if (isAuthStatusCommand(args)) return [this.cliPath, 'auth', 'status', '--json']
    if (isAuthTokenCommand(args)) return [this.cliPath, 'auth', 'token']
    if (isAuthLoginCommand(args, this.baseUrl)) {
      return [this.cliPath, 'auth', 'login', this.baseUrl]
    }
    throw new Error('OpenBKN CLI command is not allowed by this plugin.')
  }
}

function isAuthStatusCommand(args: readonly string[]): boolean {
  return args.length === 3 && args[0] === 'auth' && args[1] === 'status' && args[2] === '--json'
}

function isAuthTokenCommand(args: readonly string[]): boolean {
  return args.length === 2 && args[0] === 'auth' && args[1] === 'token'
}

function isAuthLoginCommand(args: readonly string[], baseUrl: string): boolean {
  return args.length === 3
    && args[0] === 'auth'
    && args[1] === 'login'
    && normalizeBaseUrl(args[2] ?? '') === baseUrl
}

function normalizeBaseUrl(value: string): string {
  return trimTrailingSlashes(value.trim())
}
