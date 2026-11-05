import type { JsonValue } from '@deepseek-ai/dsh-util-values'
import { PlatformReaderError } from './platform-reader.js'
import { PROVENANCE_DETAIL_LIMITS, provenanceDetailResponseLimit, type ProvenanceDetailEvent, type ProvenanceDetailIdentity, type ProvenanceDetailRequest } from './provenance-detail-types.js'

export interface ProvenanceDetailReader {
  readProvenanceDetailData(request: ProvenanceDetailRequest, conversationId: string, interactionId: string, signal: AbortSignal, beforeDispatch?: () => void | Promise<void>): Promise<JsonValue>
  streamProvenanceDetailAnalysis(interactionId: string, markdown: string, signal: AbortSignal, beforeDispatch?: () => void | Promise<void>): AsyncIterable<{ event: string; data: JsonValue }>
}

const identifier = /^[A-Za-z0-9][A-Za-z0-9_-]{0,511}$/
const kinds = new Set(['conversation', 'rounds', 'detail', 'explanation', 'markdown', 'history', 'generate', 'analyze'])
const requestFields = new Set(['kind', 'interactionId', 'page', 'pageSize', 'keyword', 'markdown'])
const record = (value: unknown): Record<string, unknown> | undefined => value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : undefined
const invalid = () => new PlatformReaderError('INVALID_RESPONSE', 'OpenBKN provenance identity or response is invalid.')

/** Preserve the selected platform baseline's content and control SSE frames verbatim. */
export function admitProvenanceAnalysisEvent(event: { event: string; data: unknown }): { event: string; data: JsonValue } {
  const data = record(event.data)
  if (!data || !['meta', 'token', 'tool_call', 'structured', 'error', 'done'].includes(event.event)) throw invalid()
  if (event.event === 'token' && typeof data.content !== 'string') throw invalid()
  if (event.event === 'structured' && !record(data.content)) throw invalid()
  if (event.event === 'error' && (data.message !== undefined && typeof data.message !== 'string' || data.code !== undefined && typeof data.code !== 'string')) throw invalid()
  return { event: event.event, data: admitProvenanceDetailJson(event.data) }
}

/** Preserve JSON values verbatim while rejecting unbounded or non-JSON stub/transport values. */
export function admitProvenanceDetailJson(value: unknown, maxBytes: number = PROVENANCE_DETAIL_LIMITS.wireBytes): JsonValue {
  let nodes = 0
  const seen = new Set<object>()
  const visit = (item: unknown, depth: number): void => {
    if (++nodes > 250_000 || depth > 64) throw new PlatformReaderError('OUTPUT_OVERFLOW', 'OpenBKN provenance data exceeded the safe structural limit.')
    if (item === null || typeof item === 'string' || typeof item === 'boolean') return
    if (typeof item === 'number' && Number.isFinite(item)) return
    if (typeof item !== 'object' || item === null || seen.has(item)) throw invalid()
    seen.add(item)
    for (const child of Array.isArray(item) ? item : Object.values(item)) visit(child, depth + 1)
    seen.delete(item)
  }
  visit(value, 0)
  if (new TextEncoder().encode(JSON.stringify(value)).byteLength > maxBytes) throw new PlatformReaderError('OUTPUT_OVERFLOW', 'OpenBKN provenance data exceeded the safe Host limit.')
  return value as JsonValue
}

/**
 * One trusted DSH message supplies the anchor. Other round IDs must be observed
 * in that same platform conversation; a page miss is never a fallback selection.
 */
export class ProvenanceDetailScope {
  constructor(
    private readonly identity: ProvenanceDetailIdentity,
    private readonly reader: ProvenanceDetailReader,
    private readonly guard: () => void | Promise<void> = () => {},
  ) {
    if (![identity.conversationId, identity.initialInteractionId, identity.knowledgeNetworkId].every(value => typeof value === 'string' && identifier.test(value))) throw invalid()
  }

  private async check(signal: AbortSignal): Promise<void> { signal.throwIfAborted(); await this.guard(); signal.throwIfAborted() }

  private request(request: ProvenanceDetailRequest): ProvenanceDetailRequest {
    if (!record(request) || !kinds.has(request.kind) || Object.keys(request).some(key => !requestFields.has(key))) throw invalid()
    if (request.interactionId !== undefined && (typeof request.interactionId !== 'string' || !identifier.test(request.interactionId))) throw invalid()
    if (request.page !== undefined && (!Number.isInteger(request.page) || request.page < 1 || request.page > 100_000)) throw invalid()
    if (request.pageSize !== undefined && (!Number.isInteger(request.pageSize) || request.pageSize < 1 || request.pageSize > PROVENANCE_DETAIL_LIMITS.listPageSize)) throw invalid()
    if (request.keyword !== undefined && (typeof request.keyword !== 'string' || request.keyword.length > 512)) throw invalid()
    if (request.markdown !== undefined && (typeof request.markdown !== 'string' || new TextEncoder().encode(request.markdown).byteLength > PROVENANCE_DETAIL_LIMITS.markdownBytes)) throw invalid()
    // Snapshot only the admitted display request. No caller-controlled URL, token or payload ref exists.
    return { kind: request.kind, ...(request.interactionId === undefined ? {} : { interactionId: request.interactionId }),
      ...(request.page === undefined ? {} : { page: request.page }), ...(request.pageSize === undefined ? {} : { pageSize: request.pageSize }),
      ...(request.keyword === undefined ? {} : { keyword: request.keyword }) }
  }

  private page(value: JsonValue, conversation: boolean): readonly Record<string, unknown>[] {
    const data = record(value)
    if (!data || !Array.isArray(data.entries) || data.entries.length > PROVENANCE_DETAIL_LIMITS.listPageSize) throw invalid()
    if (data.conversation_id !== undefined && data.conversation_id !== this.identity.conversationId) throw invalid()
    const ids = new Set<string>()
    return data.entries.map(value => {
      const item = record(value)
      const id = item?.[conversation ? 'conversation_id' : 'interaction_id']
      if (!item || typeof id !== 'string' || !identifier.test(id) || ids.has(id)) throw invalid()
      if (item.conversation_id !== this.identity.conversationId) throw invalid()
      ids.add(id)
      return item
    })
  }

  private async member(interactionId: string, signal: AbortSignal): Promise<void> {
    if (interactionId === this.identity.initialInteractionId) return
    const bounded = AbortSignal.any([signal, AbortSignal.timeout(30_000)])
    let bytes = 0
    for (let page = 1; page <= PROVENANCE_DETAIL_LIMITS.membershipPages; page++) {
      await this.check(bounded)
      const value = admitProvenanceDetailJson(await this.reader.readProvenanceDetailData({ kind: 'rounds', page, pageSize: PROVENANCE_DETAIL_LIMITS.listPageSize }, this.identity.conversationId, this.identity.initialInteractionId, bounded, () => this.check(bounded)))
      await this.check(bounded)
      bytes += new TextEncoder().encode(JSON.stringify(value)).byteLength
      if (bytes > PROVENANCE_DETAIL_LIMITS.wireBytes) throw new PlatformReaderError('OUTPUT_OVERFLOW', 'OpenBKN round membership exceeded the safe Host limit.')
      const entries = this.page(value, false), info = record(value)!
      if (entries.some(entry => entry.interaction_id === interactionId)) return
      if (info.partial === true || info.truncated === true) break
      if (entries.length === 0 || entries.length < PROVENANCE_DETAIL_LIMITS.listPageSize || (typeof info.total === 'number' && page * PROVENANCE_DETAIL_LIMITS.listPageSize >= info.total)) break
    }
    throw new PlatformReaderError('RECORD_NOT_DISCLOSED', 'The selected round was not verified in this business conversation.')
  }

  private scopeRecord(value: JsonValue, interactionId: string, kind: string): void {
    if (kind === 'markdown') { if (typeof value !== 'string') throw invalid(); return }
    const data = record(value)
    if (!data) throw invalid()
    if (data.knowledge_network_id !== undefined && data.knowledge_network_id !== this.identity.knowledgeNetworkId) throw invalid()
    if (data.interaction_id !== undefined && data.interaction_id !== interactionId) throw invalid()
    if (data.conversation_id !== undefined && data.conversation_id !== this.identity.conversationId) throw invalid()
    if (kind === 'detail' || kind === 'explanation' || kind === 'generate') {
      if (data.interaction_id !== interactionId) throw invalid()
      if (data.conversation_id !== undefined && data.conversation_id !== this.identity.conversationId) throw invalid()
      const operations = data.operations
      if (operations !== undefined && !Array.isArray(operations)) throw invalid()
      for (const operation of Array.isArray(operations) ? operations : []) {
        const item = record(operation)
        if (!item) throw invalid()
        if (item.knowledge_network_id !== undefined && item.knowledge_network_id !== this.identity.knowledgeNetworkId) throw invalid()
      }
      for (const key of ['conversation_context', 'context_relations']) {
        const entries = data[key]
        if (entries !== undefined && !Array.isArray(entries)) throw invalid()
        for (const entry of Array.isArray(entries) ? entries : []) {
          const item = record(entry)
          if (!item || item.knowledge_network_id !== undefined && item.knowledge_network_id !== this.identity.knowledgeNetworkId) throw invalid()
        }
      }
      if (kind !== 'detail') {
        if (data.schema_version !== '1' || !['ready', 'not_generated'].includes(String(data.status))) throw invalid()
        const view = record(data.view)
        if (data.status === 'ready' && (!view || view.interactionId !== interactionId)) throw invalid()
      }
    }
    if (kind === 'history') {
      if (!Array.isArray(data.entries)) throw invalid()
      for (const entry of data.entries) if (record(entry)?.interaction_id !== interactionId) throw invalid()
    }
  }

  async *run(input: ProvenanceDetailRequest, signal: AbortSignal): AsyncIterable<ProvenanceDetailEvent> {
    const request = this.request(input), interactionId = request.interactionId ?? this.identity.initialInteractionId
    await this.check(signal)
    if (request.kind !== 'conversation' && request.kind !== 'rounds') await this.member(interactionId, signal)
    else if (interactionId !== this.identity.initialInteractionId) throw invalid()
    await this.check(signal)
    yield { kind: 'context', ...this.identity, interactionId }
    // Markdown and explanations do not disclose a KN identity themselves.
    // Verify the selected platform record before exposing them or dispatching an action.
    if (!['conversation', 'rounds', 'detail'].includes(request.kind)) {
      const detail = admitProvenanceDetailJson(await this.reader.readProvenanceDetailData({ kind: 'detail' }, this.identity.conversationId, interactionId, signal, () => this.check(signal)), PROVENANCE_DETAIL_LIMITS.detailWireBytes)
      await this.check(signal)
      this.scopeRecord(detail, interactionId, 'detail')
    }
    if (request.kind === 'analyze') {
      // The Host obtains the exact platform Markdown; browser-supplied business text is not trusted.
      const markdown = await this.reader.readProvenanceDetailData({ kind: 'markdown' }, this.identity.conversationId, interactionId, signal, () => this.check(signal))
      if (typeof markdown !== 'string' || new TextEncoder().encode(markdown).byteLength > PROVENANCE_DETAIL_LIMITS.markdownBytes) throw invalid()
      await this.check(signal)
      for await (const event of this.reader.streamProvenanceDetailAnalysis(interactionId, markdown, signal, () => this.check(signal))) {
        await this.check(signal)
        yield { kind: 'analysis', ...admitProvenanceAnalysisEvent(event) }
      }
      return
    }
    const value = admitProvenanceDetailJson(await this.reader.readProvenanceDetailData(request, this.identity.conversationId, interactionId, signal, () => this.check(signal)), provenanceDetailResponseLimit(request.kind))
    await this.check(signal)
    if (request.kind === 'conversation' || request.kind === 'rounds') this.page(value, request.kind === 'conversation')
    else this.scopeRecord(value, interactionId, request.kind)
    const encoding = request.kind === 'markdown' ? 'text' : 'json'
    const text = encoding === 'text' ? value as string : JSON.stringify(value)
    if (text.length <= PROVENANCE_DETAIL_LIMITS.chunkCharacters) { yield { kind: 'result', value }; return }
    let chunks = 0
    for (let offset = 0; offset < text.length; offset += PROVENANCE_DETAIL_LIMITS.chunkCharacters) {
      await this.check(signal)
      yield { kind: 'chunk', index: chunks++, encoding, content: text.slice(offset, offset + PROVENANCE_DETAIL_LIMITS.chunkCharacters) }
    }
    await this.check(signal)
    yield { kind: 'end', chunks, encoding }
  }
}
