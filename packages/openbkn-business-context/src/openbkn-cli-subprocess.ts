import type { CliResult, OpenBknCli } from './auth.js'

const OUTPUT_LIMIT = 64 * 1024
const GRACE_MS = 3_000

/** Structural subset of DSH subprocess used for the fixed OpenBKN CLI contract. */
export interface CliSubprocess {
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

/** DSH-managed invocation of the OpenBKN CLI; only status and normal browser login are accepted. */
export class OpenBknCliSubprocess implements OpenBknCli {
  private readonly baseUrl: string

  constructor(
    private readonly subprocess: CliSubprocess,
    private readonly cwd: string,
    baseUrl: string,
  ) {
    this.baseUrl = normalizeBaseUrl(baseUrl)
  }

  async run(args: readonly string[], signal?: AbortSignal): Promise<CliResult> {
    const argv = this.resolveArgv(args)
    const child = this.subprocess.spawn({
      argv,
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
    const stdout = child.collected.stdout?.readFrom(0)
    const stderr = child.collected.stderr?.readFrom(0)
    if (stdout?.lossy || stderr?.lossy) throw new Error('OpenBKN CLI output exceeded the safe size limit.')
    return { code: outcome.exitCode ?? 1, stdout: stdout?.text ?? '', stderr: stderr?.text ?? '' }
  }

  private resolveArgv(args: readonly string[]): readonly string[] {
    if (isAuthStatusCommand(args)) return ['openbkn', 'auth', 'status', '--json']
    if (isAuthLoginCommand(args, this.baseUrl)) {
      return ['openbkn', 'auth', 'login', this.baseUrl]
    }
    throw new Error('OpenBKN CLI command is not allowed by this plugin.')
  }
}

function isAuthStatusCommand(args: readonly string[]): boolean {
  return args.length === 3 && args[0] === 'auth' && args[1] === 'status' && args[2] === '--json'
}

function isAuthLoginCommand(args: readonly string[], baseUrl: string): boolean {
  return args.length === 3
    && args[0] === 'auth'
    && args[1] === 'login'
    && normalizeBaseUrl(args[2] ?? '') === baseUrl
}

function normalizeBaseUrl(value: string): string {
  return value.trim().replace(/\/+$/, '')
}
