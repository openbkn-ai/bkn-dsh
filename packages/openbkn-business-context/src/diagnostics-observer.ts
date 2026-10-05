/**
 * Passive, in-process observation buffer shared by the business boundary
 * modules and the diagnostics service.
 *
 * Business code records outcome boundaries (a failed platform request, a CLI
 * refusal, an MCP handshake failure) through {@link passiveDiagnostics};
 * the diagnostics entry reads them back as checks. The module imports no
 * business code, so the dependency direction keeps the diagnostics entry
 * loadable while the business entry is broken — in that state there simply
 * are no observations yet and the fiber-based checks carry the report.
 *
 * Observations are keyed by {@link PassiveObservationInput.subject}: one
 * subject is one checkable point (login state, context loader, platform
 * request, CLI). A success recorded on the same subject supersedes the
 * earlier failure (marked `recovered` with the last failure code kept as
 * evidence), so a stale failure never presents as current after a retry
 * succeeded. Redaction happens at capture time: evidence passes
 * {@link sanitizeDiagnosticsEvidence} before it is stored, so a raw error,
 * message, stack, URL, or credential can never enter the buffer even if a
 * caller passes one by mistake.
 * @module diagnostics-observer
 */

import {
  sanitizeDiagnosticsEvidence,
  type DiagnosticsCheck,
  type DiagnosticsEvidenceValue,
  type DiagnosticsStage,
  type DiagnosticsStatus,
} from './diagnostics-contract.js'

/** Upper bound on distinct observed subjects; further novel keys are dropped. */
export const PASSIVE_BUFFER_LIMIT = 20

/** One recorded outcome boundary. */
export interface PassiveObservationInput {
  /** Stable check-point this outcome belongs to; successes and failures on one subject reconcile. */
  readonly subject: string
  /** Stage of the newest outcome. */
  readonly stage: DiagnosticsStage
  /** Classification of the newest outcome (the subject's own name on success). */
  readonly code: string
  readonly status: 'pass' | 'fail'
  /** Candidate evidence; sanitized at capture, never stored raw. */
  readonly evidence?: Readonly<Record<string, unknown>>
}

/** Aggregated state for one subject. */
interface PassiveRecord {
  readonly subject: string
  stage: DiagnosticsStage
  code: string
  lastFailureCode: string | null
  failures: number
  passes: number
  lastStatus: 'pass' | 'fail'
  lastAt: number
  evidence: Readonly<Record<string, DiagnosticsEvidenceValue>>
}

/**
 * Bounded passive outcome buffer keyed by subject. One instance is shared
 * per process via {@link passiveDiagnostics}; tests construct isolated
 * instances.
 */
export class PassiveDiagnosticsBuffer {
  private readonly records = new Map<string, PassiveRecord>()
  private droppedSubjects = 0

  /** Record one outcome; the newest outcome on a subject defines its state. */
  record(input: PassiveObservationInput): void {
    const existing = this.records.get(input.subject)
    if (existing === undefined && this.records.size >= PASSIVE_BUFFER_LIMIT) {
      this.droppedSubjects += 1
      return
    }
    const now = Date.now()
    const record: PassiveRecord = existing ?? {
      subject: input.subject, stage: input.stage, code: input.code, lastFailureCode: null,
      failures: 0, passes: 0, lastStatus: input.status, lastAt: now, evidence: {},
    }
    if (input.status === 'fail') {
      record.failures += 1
      record.lastFailureCode = input.code
    } else {
      record.passes += 1
    }
    record.stage = input.stage
    record.code = input.code
    record.lastStatus = input.status
    record.lastAt = now
    // The newest outcome's evidence replaces the previous one for this subject.
    record.evidence = input.evidence === undefined ? {} : sanitizeDiagnosticsEvidence(input.evidence)
    this.records.set(input.subject, record)
  }

  /** Forget everything (tests and explicit resets only). */
  clear(): void {
    this.records.clear()
    this.droppedSubjects = 0
  }

  /**
   * Project the buffer into passive checks. A subject whose newest outcome
   * is a pass reports `pass` (with `recovered` when a failure preceded it);
   * the report never presents a failure older than the latest retry.
   * @returns checks in first-observed order.
   */
  snapshot(): readonly DiagnosticsCheck[] {
    const now = Date.now()
    return [...this.records.values()].map(record => {
      const status: DiagnosticsStatus = record.lastStatus === 'pass' ? 'pass' : 'fail'
      const recovered = record.lastStatus === 'pass' && record.failures > 0
      return {
        id: `observed:${record.subject}`,
        stage: record.stage,
        status,
        source: 'observed-operation' as const,
        code: record.code,
        evidence: {
          failureCount: record.failures,
          lastOutcomeAgoMs: Math.max(0, now - record.lastAt),
          ...(recovered ? { recovered: true, lastFailureCode: record.lastFailureCode } : {}),
          ...record.evidence,
        },
        nextAction: status === 'fail'
          ? 'Export this report and send it to support; the failing stage is listed above.'
          : null,
      }
    })
  }

  /** How many novel subjects were dropped after the buffer bound was reached. */
  get droppedObservationCount(): number {
    return this.droppedSubjects
  }
}

/** The process-wide passive buffer the business boundaries record into. */
export const passiveDiagnostics = new PassiveDiagnosticsBuffer()

/** Map a bounded platform HTTP status into evidence, or omit it. */
export function httpStatusEvidence(status: unknown): Readonly<Record<string, number>> {
  return typeof status === 'number' && Number.isInteger(status) && status >= 100 && status <= 599
    ? { httpStatus: status }
    : {}
}

/** Map a bounded CLI exit code into evidence, or omit it. */
export function exitCodeEvidence(code: unknown): Readonly<Record<string, number>> {
  return typeof code === 'number' && Number.isInteger(code) && code >= 0 && code <= 255
    ? { exitCode: code }
    : {}
}

/** Marker patterns for bounded transport classification of a cause chain. */
const TLS_MARKER = /CERT|SSL|TLS|SIGNATURE/i
const TIMEOUT_MARKER = /TimeoutError|TIMED?OUT|UND_ERR_HEADERS_TIMEOUT|UND_ERR_CONNECT_TIMEOUT|UND_ERR_BODY_TIMEOUT/
/** undici's generic connection wrapper (DNS, refused, TLS): network layer, cause not distinguishable. */
const TRANSPORT_MARKER = /fetch failed|ECONNREFUSED|ENOTFOUND|EAI_AGAIN|ECONNRESET|EPIPE/

/**
 * Classify the transport layer of a bounded cause chain: certificate/TLS
 * shapes and timeout brands are recognized without reading message text.
 * Shared by every boundary that dials the platform (reader and MCP mount).
 * The default depth crosses the MCP SDK's wrapper layers (client error →
 * transport error → undici TypeError → socket code).
 * The generic `transport` marker names the network layer without guessing a
 * cause: the MCP SDK's SdkError truncates the undici chain to a plain
 * "fetch failed", so a certificate problem on that route is not
 * distinguishable from DNS or a refused connection (a recorded limitation).
 * @param cause - the error chain to classify (marker fields only).
 * @param depth - maximum cause-chain depth walked.
 * @returns which transport markers the chain carries.
 */
export function transportMarkersOf(cause: unknown, depth = 8): { tls: boolean, timeout: boolean, transport: boolean } {
  let tls = false
  let timeout = false
  let transport = false
  let current: unknown = cause
  for (let level = 0; level < depth && current !== null && typeof current === 'object'; level += 1) {
    const candidate = current as { name?: unknown, code?: unknown, message?: unknown, cause?: unknown }
    // Name and code carry undici's socket codes directly; the message is
    // matched only against the same fixed marker vocabulary (never exported).
    const parts = `${String(candidate.name ?? '')} ${String(candidate.code ?? '')} ${String(candidate.message ?? '')}`
    if (TLS_MARKER.test(parts)) tls = true
    if (TIMEOUT_MARKER.test(parts)) timeout = true
    if (TRANSPORT_MARKER.test(parts)) transport = true
    current = candidate.cause
  }
  return { tls, timeout, transport }
}
