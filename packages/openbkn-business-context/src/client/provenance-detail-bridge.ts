import type { JsonValue } from '@deepseek-ai/dsh-util-values'
import { PROVENANCE_DETAIL_LIMITS, provenanceDetailResponseLimit, type ProvenanceDetailEvent, type ProvenanceDetailRequest, type ProvenanceDetailFailure } from '../provenance-detail-types.ts'

export interface ProvenanceDetailStream extends AsyncIterable<ProvenanceDetailEvent> {
  dispose(): Promise<void> | void
}

export type ProvenanceDetailStreamOpener = (request: ProvenanceDetailRequest, signal?: AbortSignal) => ProvenanceDetailStream

export type ProvenanceDetailTransport = (
  request: ProvenanceDetailRequest,
  signal?: AbortSignal,
  onAnalysis?: (event: { event: string; data: JsonValue }) => void,
) => Promise<JsonValue>

export class ProvenanceDetailTransportError extends Error {
  readonly response?: { status: number }
  constructor(readonly code: 'invalid-stream' | 'incomplete-stream' | 'result-too-large' | 'remote-failed' | ProvenanceDetailFailure, httpStatus?: number) {
    super('Business provenance could not be read.')
    this.name = 'ProvenanceDetailTransportError'
    if (httpStatus !== undefined && Number.isInteger(httpStatus) && httpStatus >= 100 && httpStatus <= 599) this.response = { status: httpStatus }
  }
}

/**
 * Consume the public cancellable Remote stream without exposing Remote errors
 * or waiting for iterator disposal before delivering a verified result.
 */
export function createProvenanceDetailTransport(open: ProvenanceDetailStreamOpener): ProvenanceDetailTransport {
  return (request, signal, onAnalysis) => new Promise<JsonValue>((resolve, reject) => {
    const aborted = () => new DOMException('Business provenance request was cancelled.', 'AbortError')
    if (signal?.aborted) { reject(aborted()); return }
    let stream: ProvenanceDetailStream
    try { stream = open(request, signal) } catch { reject(new ProvenanceDetailTransportError('remote-failed')); return }
    let disposed = false
    let settled = false
    let bytes = 0
    let pendingSurrogate = ''
    let encoding: 'json' | 'text' | undefined
    const chunks: string[] = []
    const encoder = new TextEncoder()
    const dispose = () => {
      if (disposed) return
      disposed = true
      try { void Promise.resolve(stream.dispose()).catch(() => {}) } catch { /* Cleanup cannot replace the displayed result. */ }
    }
    const finish = (value: JsonValue) => {
      if (settled) return
      settled = true
      signal?.removeEventListener('abort', cancel)
      resolve(value)
      dispose()
    }
    const fail = (error: Error) => {
      if (settled) return
      settled = true
      signal?.removeEventListener('abort', cancel)
      reject(error)
      dispose()
    }
    const cancel = () => fail(aborted())
    signal?.addEventListener('abort', cancel, { once: true })
    if (signal?.aborted) { cancel(); return }
    const admit = (text: string, final = false) => {
      let part = pendingSurrogate + text
      pendingSurrogate = ''
      const last = part.charCodeAt(part.length - 1)
      if (!final && last >= 0xd800 && last <= 0xdbff) {
        pendingSurrogate = part.slice(-1)
        part = part.slice(0, -1)
      }
      bytes += encoder.encode(part).byteLength
      if (bytes > provenanceDetailResponseLimit(request.kind)) throw new ProvenanceDetailTransportError('result-too-large')
    }
    void (async () => {
      try {
        for await (const event of stream) {
          if (settled) break
          if (signal?.aborted) { cancel(); break }
          switch (event.kind) {
            case 'context':
              break
            case 'analysis':
              if (request.kind !== 'analyze' || chunks.length !== 0) throw new ProvenanceDetailTransportError('invalid-stream')
              admit(JSON.stringify(event.data))
              onAnalysis?.({ event: event.event, data: event.data })
              break
            case 'failure':
              throw new ProvenanceDetailTransportError(event.code, event.httpStatus)
            case 'result':
              if (chunks.length !== 0) throw new ProvenanceDetailTransportError('invalid-stream')
              admit(JSON.stringify(event.value), true)
              finish(event.value)
              break
            case 'chunk':
              if (!Number.isSafeInteger(event.index) || event.index !== chunks.length ||
                  !['json', 'text'].includes(event.encoding) || (encoding !== undefined && event.encoding !== encoding) ||
                  event.content.length > PROVENANCE_DETAIL_LIMITS.chunkCharacters) throw new ProvenanceDetailTransportError('invalid-stream')
              encoding = event.encoding
              admit(event.content)
              chunks.push(event.content)
              break
            case 'end': {
              if (encoding === undefined || event.encoding !== encoding || event.chunks !== chunks.length) throw new ProvenanceDetailTransportError('invalid-stream')
              const text = chunks.join('')
              admit('', true)
              if (encoding === 'text') finish(text)
              else {
                let value: JsonValue
                try { value = JSON.parse(text) as JsonValue } catch { throw new ProvenanceDetailTransportError('invalid-stream') }
                finish(value)
              }
              break
            }
            default:
              throw new ProvenanceDetailTransportError('invalid-stream')
          }
          if (settled) break
        }
        if (!settled) {
          if (request.kind === 'analyze' && chunks.length === 0) finish(null)
          else fail(new ProvenanceDetailTransportError('incomplete-stream'))
        }
      } catch (error) {
        fail(error instanceof ProvenanceDetailTransportError ? error : signal?.aborted ? aborted() : new ProvenanceDetailTransportError('remote-failed'))
      } finally { dispose() }
    })()
  })
}
