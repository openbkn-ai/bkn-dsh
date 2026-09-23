import type { JsonValue } from '@deepseek-ai/dsh-util-values'
import type { BusinessNetworkBinding } from './session-binding.js'

export type PlatformReaderErrorCode =
  | 'AUTHENTICATION_REQUIRED'
  | 'LICENSE_REQUIRED'
  | 'RECORD_NOT_DISCLOSED'
  | 'PLATFORM_MISMATCH'
  | 'PLATFORM_UNAVAILABLE'
  | 'REQUEST_ABORTED'
  | 'OUTPUT_OVERFLOW'
  | 'INVALID_RESPONSE'

/** A bounded Host-side error. It never includes platform response bodies. */
export class PlatformReaderError extends Error {
  /** The platform's own required_action from a permission_denied envelope, truncated. */
  readonly requiredAction?: string

  constructor(readonly code: PlatformReaderErrorCode, message: string, options?: ErrorOptions & { readonly requiredAction?: string }) {
    super(message, options)
    this.name = 'PlatformReaderError'
    this.requiredAction = options?.requiredAction
  }
}

export interface PlatformReaderConfig {
  readonly baseUrl: string
  readonly requestTimeoutMs: number
  /** Maximum projected payload sent from Host to the DSH browser. */
  readonly maxResultBytes: number
  readonly allowInsecureTls: boolean
  /** Business domain header sent on platform requests; defaults to the platform default `bd_public`. */
  readonly businessDomain?: string
  readonly resolveToken?: () => Promise<string | undefined>
}

export type PlatformFetch = (input: URL, init: RequestInit) => Promise<Response>

const MAX_PLATFORM_RESPONSE_BYTES = 8 * 1024 * 1024

/**
 * A fixed-route Host reader for plugin control-plane data. It is deliberately
 * separate from the model path: agents use Context Loader MCP; this reader
 * only obtains the catalog, schema profile, and safe Trace projections.
 */
export class OpenBknPlatformReader {
  constructor(private readonly config: PlatformReaderConfig, private readonly fetcher: PlatformFetch = fetch) {}

  async listKnowledgeNetworks(signal: AbortSignal, _cwd?: string): Promise<JsonValue> {
    return this.admit(await this.get('/api/bkn-backend/v1/knowledge-networks?limit=100', signal))
  }

  async getKnowledgeNetworkDetail(binding: BusinessNetworkBinding, signal: AbortSignal, _cwd?: string): Promise<JsonValue> {
    if (normalizeBaseUrl(binding.platformBaseUrl) !== normalizeBaseUrl(this.config.baseUrl)) {
      throw new PlatformReaderError('PLATFORM_MISMATCH', 'The selected business network belongs to another OpenBKN platform.')
    }
    return this.admit(await this.post('/api/agent-retrieval/v1/kn/get_kn_detail', {
      kn_id: binding.knowledgeNetworkId,
      detail_level: 'summary',
      response_format: 'json',
    }, signal))
  }

  async getInteractionOperations(interactionId: string, signal: AbortSignal, _cwd?: string): Promise<JsonValue> {
    const value = await this.get(`/api/agent-observability/v1/interactions/${encodeURIComponent(interactionId)}/operations`, signal, { licenseGated: true })
    return this.admit(projectOperations(value))
  }

  async getInteractionBusinessGraph(interactionId: string, signal: AbortSignal, _cwd?: string): Promise<JsonValue> {
    const value = await this.get(`/api/agent-observability/v1/interactions/${encodeURIComponent(interactionId)}/business-graph`, signal, { licenseGated: true })
    return this.admit(projectBusinessGraph(value))
  }

  /** Resolve the deployment's license edition so license-gated failures can explain themselves. */
  async getLicenseEdition(signal: AbortSignal): Promise<{ edition?: string; licensed?: boolean } | undefined> {
    const value = await this.get('/api/safe/v1/capabilities', signal)
    const source = record(value)
    const edition = string(source?.edition)
    return { ...(edition === undefined ? {} : { edition }), ...(typeof source?.licensed === 'boolean' ? { licensed: source.licensed } : {}) }
  }

  private async get(path: string, signal: AbortSignal, options?: { readonly licenseGated?: boolean }): Promise<JsonValue> {
    return await this.request(path, { method: 'GET' }, signal, options)
  }

  private async post(path: string, body: Record<string, unknown>, signal: AbortSignal): Promise<JsonValue> {
    return await this.request(path, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }, signal)
  }

  private async request(path: string, init: RequestInit, signal: AbortSignal, options?: { readonly licenseGated?: boolean }): Promise<JsonValue> {
    if (signal.aborted) throw new PlatformReaderError('REQUEST_ABORTED', 'OpenBKN context request was cancelled.')
    const url = fixedUrl(this.config.baseUrl, path, this.config.allowInsecureTls)
    const token = await this.config.resolveToken?.()
    if (token === undefined || token.trim().length === 0) {
      throw new PlatformReaderError('AUTHENTICATION_REQUIRED', 'OpenBKN authentication is required.')
    }
    const timeout = AbortSignal.timeout(this.config.requestTimeoutMs)
    const requestSignal = AbortSignal.any([signal, timeout])
    let response: Response
    try {
      response = await this.fetcher(url, {
        ...init,
        headers: {
          ...init.headers,
          'x-business-domain': this.config.businessDomain?.trim() || 'bd_public',
          authorization: `Bearer ${token}`,
        },
        // Fixed routes: following redirects would silently tolerate endpoint
        // drift and https→http downgrades for no benefit.
        redirect: 'error',
        signal: requestSignal,
      })
    } catch (error: unknown) {
      if (signal.aborted) throw new PlatformReaderError('REQUEST_ABORTED', 'OpenBKN context request was cancelled.', { cause: error })
      throw new PlatformReaderError('PLATFORM_UNAVAILABLE', 'OpenBKN platform data is temporarily unavailable.', { cause: error })
    }
    if (response.status === 401) {
      // 401 is a caller-identity problem (expired or rejected token class);
      // the deployment-license gate answers 403 below.
      throw new PlatformReaderError('AUTHENTICATION_REQUIRED', 'OpenBKN authentication is required.')
    }
    if (response.status === 403) {
      // Only the observability lifecycle routes answer the deployment
      // license/domain gate with permission_denied; elsewhere that code means
      // a caller-authorization problem.
      if (options?.licenseGated === true) {
        const failure = await errorEnvelope(response)
        if (string(record(failure)?.code) === 'permission_denied') {
          throw new PlatformReaderError(
            'LICENSE_REQUIRED',
            'The requested OpenBKN capability requires an enterprise license for this business domain.',
            { requiredAction: truncateRequiredAction(string(record(failure)?.required_action)) },
          )
        }
      }
      throw new PlatformReaderError('AUTHENTICATION_REQUIRED', 'OpenBKN authentication is required.')
    }
    if (response.status === 404 && options?.licenseGated === true) {
      // Scoped to the observability routes like the 403 gate above, so the
      // catalog routes keep their existing error mapping. There, a 404 with
      // error.code resource_not_disclosed means the record is not on the
      // platform (or is not disclosed to this caller — the platform
      // deliberately does not distinguish). Retrying cannot fix that, so it
      // gets its own code; every other 404 stays a generic unavailable.
      const failure = await errorEnvelope(response)
      if (string(record(failure)?.code) === 'resource_not_disclosed') {
        throw new PlatformReaderError('RECORD_NOT_DISCLOSED', 'The requested OpenBKN record is not disclosed.')
      }
      throw new PlatformReaderError('PLATFORM_UNAVAILABLE', 'OpenBKN platform data is temporarily unavailable.')
    }
    if (!response.ok) throw new PlatformReaderError('PLATFORM_UNAVAILABLE', 'OpenBKN platform data is temporarily unavailable.')
    const contentLength = response.headers.get('content-length')
    if (contentLength !== null && Number(contentLength) > MAX_PLATFORM_RESPONSE_BYTES) {
      throw new PlatformReaderError('OUTPUT_OVERFLOW', 'OpenBKN platform response exceeded the safe Host limit.')
    }
    // Stream with a hard cap: buffering a header-less body first would let an
    // oversized or hostile response consume Host memory before the check runs.
    let text: string
    try {
      text = await readCappedBody(response, MAX_PLATFORM_RESPONSE_BYTES)
    } catch (error: unknown) {
      if (error instanceof PlatformReaderError) throw error
      throw new PlatformReaderError('PLATFORM_UNAVAILABLE', 'OpenBKN platform data is temporarily unavailable.', { cause: error })
    }
    let value: unknown
    try { value = JSON.parse(text) } catch (error: unknown) {
      throw new PlatformReaderError('INVALID_RESPONSE', 'OpenBKN platform returned an invalid response.', { cause: error })
    }
    return value as JsonValue
  }

  private admit(value: JsonValue): JsonValue {
    if (new TextEncoder().encode(JSON.stringify(value)).byteLength > this.config.maxResultBytes) {
      throw new PlatformReaderError('OUTPUT_OVERFLOW', 'OpenBKN context result exceeded the configured size limit.')
    }
    return value
  }
}

function projectOperations(value: JsonValue): JsonValue {
  const source = record(value)
  const entries = array(source?.entries ?? source?.operations).flatMap(entry => {
    const value = record(entry)
    const operationId = string(value?.operation_id)
    if (operationId === undefined) return []
    return [{
      operation_id: operationId,
      tool_name: string(value?.tool_name), source_module: string(value?.source_module), protocol: string(value?.protocol),
      status: string(value?.status), started_at: string(value?.started_at), finished_at: string(value?.finished_at),
      request_id: string(value?.request_id), trace_id: string(value?.trace_id), receipt_id: string(value?.receipt_id),
    }]
  })
  return json({ entries, total: number(source?.total) ?? entries.length })
}

function projectBusinessGraph(value: JsonValue): JsonValue {
  const source = record(value)
  const assembly = record(source?.assembly)
  const projectRef = (candidate: unknown) => {
    const ref = record(candidate); const technical = record(ref?.technical_ref); const display = record(ref?.display)
    const id = string(technical?.ref_id); const type = string(technical?.ref_type); const name = string(display?.name)
    return id === undefined || type === undefined || name === undefined ? undefined : {
      technical_ref: { ref_id: id, ref_type: type, visibility: string(technical?.visibility), version_status: string(technical?.version_status) },
      display: { name, resolution_status: string(display?.resolution_status), source_version: string(display?.source_version) },
    }
  }
  const refs = array(assembly?.business_refs).flatMap(candidate => {
    const projected = projectRef(candidate); return projected === undefined ? [] : [projected]
  })
  const edges = array(assembly?.operation_business_edges).flatMap(candidate => {
    const edge = record(candidate); const operationId = string(edge?.operation_id); const ref = projectRef(edge?.business_ref)
    return operationId === undefined || ref === undefined ? [] : [{ operation_id: operationId, role: string(edge?.role), observed_at: string(edge?.observed_at), business_ref: ref }]
  })
  const events = array(source?.events).flatMap(candidate => {
    const event = record(candidate); const eventId = string(event?.event_id); const eventType = string(event?.event_type)
    return eventId === undefined || eventType === undefined ? [] : [{ event_id: eventId, event_type: eventType, layer: string(event?.layer), operation_id: string(event?.operation_id) }]
  })
  return json({
    interaction_id: string(source?.interaction_id), conversation_id: string(source?.conversation_id),
    execution_status: string(source?.execution_status), evidence_status: string(source?.evidence_status),
    assembly: { business_refs: refs, operation_business_edges: edges }, events,
  })
}

/** Hosts for which plaintext http is tolerated regardless of the insecure switch. */
export function isLoopbackHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]'
}

/**
 * Scheme fence shared by every outbound OpenBKN path so the Bearer token can
 * never be configured onto a plaintext or unexpected endpoint: https is
 * required outside loopback unless plaintext was explicitly allowed.
 */
export function assertHttpsEndpoint(url: URL, allowPlaintext: boolean): void {
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && (isLoopbackHost(url.hostname) || allowPlaintext))) {
    throw new PlatformReaderError('PLATFORM_MISMATCH', 'OpenBKN platform URL must use HTTPS outside loopback.')
  }
}

function fixedUrl(baseUrl: string, path: string, allowInsecureTls: boolean): URL {
  let url: URL
  try { url = new URL(path, `${normalizeBaseUrl(baseUrl)}/`) } catch {
    throw new PlatformReaderError('PLATFORM_MISMATCH', 'OpenBKN platform URL is not configured.')
  }
  assertHttpsEndpoint(url, allowInsecureTls)
  return url
}

/** Bounded error-envelope read shared by the 403/404 gates: stream-capped, never buffered whole. */
async function errorEnvelope(response: Response): Promise<Record<string, unknown> | undefined> {
  let text: string
  try {
    text = await readCappedBody(response, 4096)
  } catch {
    // Oversized or unreadable body: no envelope, caller falls through to the generic path.
    return undefined
  }
  const parsed = record(safeParse(text))
  return parsed === undefined ? undefined : record(parsed.error)
}

function normalizeBaseUrl(value: string): string { return value.trim().replace(/\/+$/, '') }
function record(value: unknown): Record<string, unknown> | undefined { return typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : undefined }
function safeParse(text: string): unknown { try { return JSON.parse(text) } catch { return undefined } }
/** Pass the platform's next-step token through, bounded; never the message body around it. */
function truncateRequiredAction(value: string | undefined): string | undefined {
  if (value === undefined || value.length === 0) return undefined
  return value.length > 256 ? value.slice(0, 256) : value
}

/** Read a response body as text, aborting the stream once the byte cap is exceeded. */
async function readCappedBody(response: Response, capBytes: number): Promise<string> {
  if (response.body === null) return response.text()
  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let received = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done === true) break
    if (value === undefined) continue
    received += value.byteLength
    if (received > capBytes) {
      await reader.cancel().catch(() => undefined)
      throw new PlatformReaderError('OUTPUT_OVERFLOW', 'OpenBKN platform response exceeded the safe Host limit.')
    }
    chunks.push(value)
  }
  const merged = new Uint8Array(received)
  let offset = 0
  for (const chunk of chunks) {
    merged.set(chunk, offset)
    offset += chunk.byteLength
  }
  return new TextDecoder().decode(merged)
}
function array(value: unknown): readonly unknown[] { return Array.isArray(value) ? value : [] }
function string(value: unknown): string | undefined { return typeof value === 'string' && value.trim() ? value.trim().slice(0, 512) : undefined }
function number(value: unknown): number | undefined { return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : undefined }
/** Removes absent optional fields before the value crosses the Host boundary. */
function json(value: unknown): JsonValue { return JSON.parse(JSON.stringify(value)) as JsonValue }
