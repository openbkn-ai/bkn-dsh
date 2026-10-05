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
 * Redaction happens at capture time: evidence passes
 * {@link sanitizeDiagnosticsEvidence} before it is stored, so a raw error,
 * message, stack, URL, or credential can never enter the buffer even if a
 * caller passes one by mistake. The buffer is bounded and keyed by
 * stage+code, and a later success on the same key marks the earlier failure
 * as recovered instead of leaving a stale "current" failure in the report.
 * @module diagnostics-observer
 */

import {
  DIAGNOSTICS_EVIDENCE_TEXT_LIMIT,
  sanitizeDiagnosticsEvidence,
  type DiagnosticsCheck,
  type DiagnosticsEvidenceValue,
  type DiagnosticsStage,
  type DiagnosticsStatus,
} from './diagnostics-contract.js'

/** Upper bound on distinct observed keys; further novel keys are dropped. */
export const PASSIVE_BUFFER_LIMIT = 20

/** One recorded outcome boundary. */
export interface PassiveObservationInput {
  readonly stage: DiagnosticsStage
  readonly code: string
  readonly status: 'pass' | 'fail'
  /** Candidate evidence; sanitized at capture, never stored raw. */
  readonly evidence?: Readonly<Record<string, unknown>>
}

/** Aggregated state for one stage+code key. */
interface PassiveRecord {
  readonly stage: DiagnosticsStage
  readonly code: string
  failures: number
  passes: number
  lastStatus: 'pass' | 'fail'
  lastAt: number
  evidence: Readonly<Record<string, DiagnosticsEvidenceValue>>
}

/**
 * Bounded passive outcome buffer. One instance is shared per process via
 * {@link passiveDiagnostics}; tests construct isolated instances.
 */
export class PassiveDiagnosticsBuffer {
  private readonly records = new Map<string, PassiveRecord>()
  private droppedKeys = 0

  /** Record one outcome; the newest outcome on a key defines its status. */
  record(input: PassiveObservationInput): void {
    const key = `${input.stage}/${input.code}`
    const existing = this.records.get(key)
    if (existing === undefined && this.records.size >= PASSIVE_BUFFER_LIMIT) {
      this.droppedKeys += 1
      return
    }
    const now = Date.now()
    const record: PassiveRecord = existing ?? {
      stage: input.stage, code: input.code, failures: 0, passes: 0,
      lastStatus: input.status, lastAt: now, evidence: {},
    }
    if (input.status === 'fail') record.failures += 1
    else record.passes += 1
    record.lastStatus = input.status
    record.lastAt = now
    // New evidence replaces old only on the newest outcome for this key.
    record.evidence = input.evidence === undefined ? {} : sanitizeDiagnosticsEvidence(input.evidence)
    this.records.set(key, record)
  }

  /** Forget everything (tests and explicit resets only). */
  clear(): void {
    this.records.clear()
    this.droppedKeys = 0
  }

  /**
   * Project the buffer into passive checks. A key whose newest outcome is a
   * pass reports `pass` (with `recovered` when a failure preceded it); the
   * report never presents a failure older than the latest retry.
   * @returns checks in first-observed order.
   */
  snapshot(): readonly DiagnosticsCheck[] {
    const now = Date.now()
    return [...this.records.values()].map(record => {
      const status: DiagnosticsStatus = record.lastStatus === 'pass' ? 'pass' : 'fail'
      const recovered = record.lastStatus === 'pass' && record.failures > 0
      const check: DiagnosticsCheck = {
        id: `observed:${record.stage}:${record.code}`,
        stage: record.stage,
        status,
        source: 'observed-operation',
        code: record.code,
        evidence: {
          failureCount: record.failures,
          lastOutcomeAgoMs: Math.max(0, now - record.lastAt),
          ...(recovered ? { recovered: true } : {}),
          ...record.evidence,
        },
        nextAction: status === 'fail' ? 'Export this report and send it to support; the failing stage is listed above.' : null,
      }
      return check
    })
  }

  /** How many novel keys were dropped after the buffer bound was reached. */
  get droppedObservationCount(): number {
    return this.droppedKeys
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

/** Re-exported so boundary modules validate echoable text against the same limit. */
export { DIAGNOSTICS_EVIDENCE_TEXT_LIMIT }
