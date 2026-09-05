import type { BusinessNetworkBinding } from './session-binding.js'
import type { JsonValue } from '@deepseek-ai/dsh-util-values'
import { delimiter } from 'node:path'
import { fileURLToPath } from 'node:url'

export type { JsonValue } from '@deepseek-ai/dsh-util-values'

/** Fixed runner protocol version shared with the packaged Python runner. */
const RUNNER_PROTOCOL_VERSION = 1
const RUNNER_STDERR_MAX_BYTES = 16 * 1024
const RUNNER_GRACE_MS = 3_000
// `src` becomes `lib` after bundling, so one parent always resolves to the
// published package's adjacent Python module directory.
const PACKAGED_RUNNER_PATH = fileURLToPath(new URL('../runner', import.meta.url))

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
  | 'AUTHENTICATION_REQUIRED'
  | 'PLATFORM_MISMATCH'
  | 'RUNNER_START_FAILED'
  | 'RUNNER_FAILED'
  | 'PLATFORM_UNAVAILABLE'
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

/** Host-side runner configuration. Credentials are resolved just-in-time and never persisted here. */
export interface OsdkRunnerConfig {
  readonly baseUrl: string
  readonly runnerPath: string
  readonly requestTimeoutMs: number
  readonly maxResultBytes: number
  readonly allowInsecureTls: boolean
  /** Resolves the managed OpenBKN token immediately before one subprocess invocation. */
  readonly resolveToken?: () => Promise<string | undefined>
}

interface RunnerSuccess {
  readonly version: number
  readonly ok: true
  readonly result: unknown
}

interface RunnerFailure {
  readonly version: number
  readonly ok: false
  readonly error: { readonly code: string; readonly message: string }
}

type RunnerOperation =
  | 'get_knowledge_network_detail'
  | 'get_interaction_business_provenance'
  | 'get_interaction_operations'
  | 'list_knowledge_networks'

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

    return await this.run(
      'get_knowledge_network_detail',
      { knowledge_network_id: binding.knowledgeNetworkId },
      signal,
      cwd,
    )
  }

  /** List only the OpenBKN networks visible to the CLI-owned current identity. */
  async listKnowledgeNetworks(signal: AbortSignal, cwd: string): Promise<JsonValue> {
    if (signal.aborted) throw new OsdkRunnerError('RUNNER_ABORTED', 'OpenBKN context request was cancelled.')
    return await this.run('list_knowledge_networks', {}, signal, cwd)
  }

  /** Read only the ordered operation facts for a Host-derived managed Interaction. */
  async getInteractionOperations(interactionId: string, signal: AbortSignal, cwd: string): Promise<JsonValue> {
    return await this.run('get_interaction_operations', { interaction_id: interactionId }, signal, cwd)
  }

  /** Read only the EE-owned deterministic projection for a Host-derived Interaction. */
  async getInteractionBusinessProvenance(interactionId: string, signal: AbortSignal, cwd: string): Promise<JsonValue> {
    return await this.run('get_interaction_business_provenance', { interaction_id: interactionId }, signal, cwd)
  }

  private async run(
    operation: RunnerOperation,
    context: Readonly<Record<string, string>>,
    signal: AbortSignal,
    cwd: string,
  ): Promise<JsonValue> {
    const baseUrl = normalizeBaseUrl(this.config.baseUrl)
    const token = await this.config.resolveToken?.()

    const request = JSON.stringify({
      version: RUNNER_PROTOCOL_VERSION,
      operation,
      context,
    })
    const noProxy = loopbackNoProxy(baseUrl)
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
          ...(noProxy === undefined ? {} : { NO_PROXY: noProxy }),
          BKN_BASE_URL: baseUrl,
          ...(token === undefined || token.length === 0 ? {} : { BKN_TOKEN: token }),
          PYTHONPATH: [PACKAGED_RUNNER_PATH, process.env.PYTHONPATH].filter(Boolean).join(delimiter),
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
    const stdout = handle.collected.stdout?.readFrom(0)
    if (stdout === undefined) throw new OsdkRunnerError('INVALID_RESPONSE', 'OpenBKN context runner returned no response.')
    if (stdout.lossy) throw new OsdkRunnerError('OUTPUT_OVERFLOW', 'OpenBKN context result exceeded the configured size limit.')
    const failure = parseFailure(stdout.text)
    if (failure !== undefined) {
      if (failure.error.code === 'authentication_required') {
        throw new OsdkRunnerError('AUTHENTICATION_REQUIRED', 'OpenBKN authentication is required.')
      }
      if (failure.error.code === 'platform_unavailable') {
        throw new OsdkRunnerError('PLATFORM_UNAVAILABLE', 'OpenBKN platform data is temporarily unavailable.')
      }
    }
    if (outcome.exitCode !== 0 || outcome.signal !== null) {
      throw new OsdkRunnerError('RUNNER_FAILED', 'OpenBKN context runner did not complete successfully.')
    }
    return parseSuccess(stdout.text)
  }
}

function parseFailure(text: string): RunnerFailure | undefined {
  try {
    const parsed: unknown = JSON.parse(text)
    return isRunnerFailure(parsed) ? parsed : undefined
  } catch {
    return undefined
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

function isRunnerFailure(value: unknown): value is RunnerFailure {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Record<string, unknown>
  if (candidate.version !== RUNNER_PROTOCOL_VERSION || candidate.ok !== false) return false
  if (typeof candidate.error !== 'object' || candidate.error === null) return false
  const error = candidate.error as Record<string, unknown>
  return typeof error.code === 'string' && typeof error.message === 'string'
}

function normalizeBaseUrl(value: string): string {
  const normalized = value.trim().replace(/\/+$/, '')
  if (normalized.length === 0) throw new OsdkRunnerError('PLATFORM_MISMATCH', 'OpenBKN platform URL is not configured.')
  return normalized
}

/** Keep Python's transport on the loopback interface when macOS has a system proxy. */
function loopbackNoProxy(baseUrl: string): string | undefined {
  let hostname: string
  try {
    hostname = new URL(baseUrl).hostname.toLowerCase()
  } catch {
    return undefined
  }
  if (hostname !== 'localhost' && hostname !== '127.0.0.1' && hostname !== '[::1]') return undefined

  const entries = new Set(
    (process.env.NO_PROXY ?? process.env.no_proxy ?? '')
      .split(',')
      .map(value => value.trim())
      .filter(Boolean),
  )
  entries.add('localhost')
  entries.add('127.0.0.1')
  entries.add('::1')
  return [...entries].join(',')
}
