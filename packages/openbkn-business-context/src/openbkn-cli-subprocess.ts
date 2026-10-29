import type { CliResult, OpenBknCli } from './auth.js'
import { exitCodeEvidence, passiveDiagnostics, type PassiveDiagnosticsWriter } from './diagnostics-observer.js'
import { trimTrailingSlashes } from './trailing-slashes.js'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import type { PrivatePlatformAccess } from './private-platform-access.js'
import { openAuthorizationBrowser } from './authorization-browser.js'

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
    readonly env?: Readonly<Record<string, string | undefined>>
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
    private readonly access?: PrivatePlatformAccess,
  ) {
    this.baseUrl = normalizeBaseUrl(baseUrl)
  }

  async run(args: readonly string[], signal?: AbortSignal): Promise<CliResult> {
    const [, ...rest] = this.resolveArgv(args)
    const login = isAuthLoginCommand(args, this.baseUrl)
    const settings = await this.access?.cliSettings(login, signal)
    let executable: string
    try {
      executable = await this.subprocess.resolveExecutable(this.cliPath, undefined, signal)
    } catch (error: unknown) {
      if (signal?.aborted === true) throw error
      throw new OpenBknCliUnavailableError(this.cliPath, { cause: error }, this.observations)
    }
    signal?.throwIfAborted()
    const controller = settings ? new AbortController() : undefined
    const activeSignal = controller ? signal ? AbortSignal.any([signal, controller.signal]) : controller.signal : signal
    let preload = new URL('./cli-platform-preload.js', import.meta.url)
    if (!existsSync(fileURLToPath(preload))) preload = new URL('../lib/cli-platform-preload.js', import.meta.url)
    const child = this.subprocess.spawn({
      argv: [executable, ...rest, ...(settings && login ? ['--no-browser'] : [])],
      cwd: this.cwd,
      stdio: {
        stdin: { data: '' },
        stdout: { maxBytes: OUTPUT_LIMIT },
        stderr: { maxBytes: OUTPUT_LIMIT },
      },
      graceMs: GRACE_MS,
      ...(activeSignal === undefined ? {} : { signal: activeSignal }),
      ...(settings ? { env: {
        BKN_CONFIG_DIR: join(settings.directory, 'cli'), BKN_BASE_URL: this.baseUrl,
        OPENBKN_PLATFORM_PIN_FILE: settings.pinFile, NODE_OPTIONS: '--import=' + preload.href,
        NODE_EXTRA_CA_CERTS: undefined, NODE_TLS_REJECT_UNAUTHORIZED: undefined,
        SSL_CERT_FILE: undefined, SSL_CERT_DIR: undefined, BKN_TOKEN: undefined,
        BKN_SKIP_VERSION_CHECK: undefined,
      } } : {}),
    })
    let browser: Promise<() => Promise<void>> | undefined, browserError: unknown
    const poll = () => {
      if (!settings || !login || browser) return
      const text = child.collected.stderr?.readFrom(0)
      if (text?.lossy) { controller?.abort(new Error('CLI output overflow')); return }
      const match = /Open this URL to sign in and authorize:\s*\r?\n[ \t]*(\S+)\r?\n/.exec(text?.text ?? '')
      if (!match) return
      try {
        browser = openAuthorizationBrowser(this.subprocess, settings.directory, settings.record,
          new URL(match[1]!, this.baseUrl).href, activeSignal).catch(error => {
            browserError = error; controller?.abort(error); return async () => {}
          })
      } catch (error) { browserError = error; controller?.abort(error) }
    }
    const timer = settings && login ? setInterval(poll, 50) : undefined
    let outcome: { readonly exitCode: number | null }
    try { outcome = await child.done; poll() }
    finally { clearInterval(timer); if (browser) await (await browser)() }
    if (browserError) throw browserError
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
    if (settings && login && result.code === 0) await this.access!.authorize(settings.record.generation, signal)
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
