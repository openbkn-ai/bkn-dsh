import type { BusinessNetworkBinding } from './session-binding.js'
import type { JsonValue } from '@deepseek-ai/dsh-util-values'

export type { JsonValue } from '@deepseek-ai/dsh-util-values'

/** Fixed runner protocol version shared with the packaged Python runner. */
const RUNNER_PROTOCOL_VERSION = 1
const RUNNER_STDERR_MAX_BYTES = 16 * 1024
const RUNNER_GRACE_MS = 3_000

/** Minimal DSH subprocess surface used by this plugin's one-shot runner calls. */
export interface RunnerSubprocess {
  spawn(spec: {
    readonly argv: readonly string[]
    readonly cwd: string
    readonly stdio: {
      readonly stdin: { readonly data: string }
      readonly stdout: { readonly maxBytes: number }
      readonly stderr: { readonly maxBytes: number }
    }
    readonly graceMs: number
    readonly signal: AbortSignal
    readonly env: Record<string, string>
  }): {
    readonly done: Promise<{ readonly exitCode: number | null; readonly signal: string | null }>
    readonly collected: {
      readonly stdout?: { readFrom(fromByte: number): { readonly text: string; readonly lossy: boolean } }
      readonly stderr?: { readFrom(fromByte: number): { readonly text: string; readonly lossy: boolean } }
    }
  }
}

export type OsdkRunnerErrorCode =
  | 'PLATFORM_MISMATCH'
  | 'RUNNER_START_FAILED'
  | 'RUNNER_FAILED'
  | 'RUNNER_ABORTED'
  | 'OUTPUT_OVERFLOW'
  | 'INVALID_RESPONSE'

/** Safe model-facing failure; original implementation details remain in the causal chain only. */
export class OsdkRunnerError extends Error {
  constructor(readonly code: OsdkRunnerErrorCode, message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'OsdkRunnerError'
  }
}

/** Host-side runner configuration; credentials are deliberately absent. */
export interface OsdkRunnerConfig {
  readonly baseUrl: string
  readonly runnerPath: string
  readonly requestTimeoutMs: number
  readonly maxResultBytes: number
  readonly allowInsecureTls: boolean
}

interface RunnerSuccess {
  readonly version: number
  readonly ok: true
  readonly result: unknown
}

/**
 * Runs the packaged Python OSDK bridge with a fixed argv and a host-derived
 * session binding. It never accepts a route, raw SQL, tool name, token, or
 * caller-provided knowledge-network id.
 */
export class OsdkRunnerClient {
  constructor(
    private readonly subprocess: RunnerSubprocess,
    private readonly config: OsdkRunnerConfig,
  ) {}

  async getKnowledgeNetworkDetail(
    binding: BusinessNetworkBinding,
    signal: AbortSignal,
    cwd: string,
  ): Promise<JsonValue> {
    const baseUrl = normalizeBaseUrl(this.config.baseUrl)
    if (normalizeBaseUrl(binding.platformBaseUrl) !== baseUrl) {
      throw new OsdkRunnerError('PLATFORM_MISMATCH', 'The selected business network belongs to another OpenBKN platform.')
    }
    if (signal.aborted) throw new OsdkRunnerError('RUNNER_ABORTED', 'OpenBKN context request was cancelled.')

    const request = JSON.stringify({
      version: RUNNER_PROTOCOL_VERSION,
      operation: 'get_knowledge_network_detail',
      context: { knowledge_network_id: binding.knowledgeNetworkId },
    })
    let handle: ReturnType<RunnerSubprocess['spawn']>
    try {
      handle = this.subprocess.spawn({
        argv: [this.config.runnerPath, '-m', 'openbkn_dsh_runner'],
        cwd,
        stdio: {
          stdin: { data: request },
          stdout: { maxBytes: this.config.maxResultBytes },
          stderr: { maxBytes: RUNNER_STDERR_MAX_BYTES },
        },
        graceMs: RUNNER_GRACE_MS,
        signal,
        env: {
          BKN_BASE_URL: baseUrl,
          OPENBKN_DSH_MAX_RESULT_BYTES: String(this.config.maxResultBytes),
          OPENBKN_DSH_INSECURE_TLS: String(this.config.allowInsecureTls),
          OPENBKN_DSH_REQUEST_TIMEOUT_MS: String(this.config.requestTimeoutMs),
        },
      })
    } catch (error: unknown) {
      if (signal.aborted) throw new OsdkRunnerError('RUNNER_ABORTED', 'OpenBKN context request was cancelled.', { cause: error })
      throw new OsdkRunnerError('RUNNER_START_FAILED', 'OpenBKN context runner could not start.', { cause: error })
    }

    let outcome: Awaited<ReturnType<RunnerSubprocess['spawn']>['done']>
    try {
      outcome = await handle.done
    } catch (error: unknown) {
      if (signal.aborted) throw new OsdkRunnerError('RUNNER_ABORTED', 'OpenBKN context request was cancelled.', { cause: error })
      throw new OsdkRunnerError('RUNNER_START_FAILED', 'OpenBKN context runner could not start.', { cause: error })
    }
    if (signal.aborted) throw new OsdkRunnerError('RUNNER_ABORTED', 'OpenBKN context request was cancelled.')
    if (outcome.exitCode !== 0 || outcome.signal !== null) {
      throw new OsdkRunnerError('RUNNER_FAILED', 'OpenBKN context runner did not complete successfully.')
    }

    const stdout = handle.collected.stdout?.readFrom(0)
    if (stdout === undefined) throw new OsdkRunnerError('INVALID_RESPONSE', 'OpenBKN context runner returned no response.')
    if (stdout.lossy) throw new OsdkRunnerError('OUTPUT_OVERFLOW', 'OpenBKN context result exceeded the configured size limit.')
    return parseSuccess(stdout.text)
  }
}

function parseSuccess(text: string): JsonValue {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch (error: unknown) {
    throw new OsdkRunnerError('INVALID_RESPONSE', 'OpenBKN context runner returned an invalid response.', { cause: error })
  }
  if (!isRunnerSuccess(parsed)) {
    throw new OsdkRunnerError('INVALID_RESPONSE', 'OpenBKN context runner returned an unexpected response.')
  }
  return parsed.result as JsonValue
}

function isRunnerSuccess(value: unknown): value is RunnerSuccess {
  return typeof value === 'object' && value !== null
    && (value as Record<string, unknown>).version === RUNNER_PROTOCOL_VERSION
    && (value as Record<string, unknown>).ok === true
    && 'result' in value
}

function normalizeBaseUrl(value: string): string {
  const normalized = value.trim().replace(/\/+$/, '')
  if (normalized.length === 0) throw new OsdkRunnerError('PLATFORM_MISMATCH', 'OpenBKN platform URL is not configured.')
  return normalized
}
