/**
 * Frozen wire contract for the OpenBKN diagnostics report (DIAG-01).
 *
 * This module is the one file both Host faces (business and diagnostics) and
 * the client bundle may share. It must stay importable from
 * `src/diagnostics.ts` without touching `src/index.ts` or any business
 * module, so a broken business entry can never take the diagnostics entry
 * down with it. Keep it free of Cordis, DSH, and business imports.
 *
 * Report semantics (verified against the plan, section 4):
 * - every check carries its own status; nothing may be merged into a global
 *   "all healthy" verdict that the evidence does not support;
 * - `evidence` admits only whitelisted scalars (booleans, counts, versions,
 *   HTTP statuses, bounded exit codes, durations, config field names);
 * - raw messages, stacks, URLs beyond their shape, paths, and credentials
 *   never enter this structure on the Host side.
 * @module diagnostics-contract
 */

/** Wire format version of {@link DiagnosticsReport}; independent of the package version. */
export const DIAGNOSTICS_SCHEMA_VERSION = 1

/** Loader/Cordis entry ids this package contributes. */
export const BUSINESS_ENTRY_ID = 'openbkn-business-context'
export const DIAGNOSTICS_ENTRY_ID = 'openbkn-business-context-diagnostics'

/**
 * Configuration field names the business entry validates. Listed here as a
 * closed whitelist so a configuration failure can name the offending field
 * without importing the business schema (or echoing a raw validation message).
 */
export const BUSINESS_CONFIG_FIELDS = [
  'baseUrl', 'mcpUrl', 'businessDomain', 'cliPath', 'requestTimeoutMs',
  'toolCallTimeoutMs', 'maxResultBytes', 'maxGraphNodes', 'maxGraphEdges',
  'allowInsecureTls',
] as const

/** Lifecycle stage one check belongs to. */
export type DiagnosticsStage =
  | 'installation'
  | 'configuration'
  | 'component'
  | 'cli'
  | 'authentication'
  | 'network'
  | 'context-loader'
  | 'platform-directory'
  | 'export'
  | 'diagnostics'

/** Outcome of one check. `insufficient-evidence` is explicit, never coerced to pass or fail. */
export type DiagnosticsStatus = 'pass' | 'fail' | 'not-run' | 'insufficient-evidence'

/** Where a check's evidence came from. `simulated` marks fixtures and never counts as live acceptance. */
export type DiagnosticsSource =
  | 'package-files'
  | 'host-runtime'
  | 'observed-operation'
  | 'active-request'
  | 'simulated'

/** Local classification codes. Server-provided codes join only after review. */
export const DIAGNOSTICS_CODES = {
  componentLoaded: 'component-loaded',
  configurationInvalid: 'configuration-invalid',
  moduleResolutionFailed: 'module-resolution-failed',
  initializationFailed: 'initialization-failed',
  componentWaitingServices: 'component-waiting-services',
  componentUnknownState: 'component-unknown-state',
  diagnosticsServiceDegraded: 'diagnostics-service-degraded',
  cliMissing: 'cli-missing',
  cliExecutionFailed: 'cli-execution-failed',
  cliOutputInvalid: 'cli-output-invalid',
  notLoggedIn: 'not-logged-in',
  authRejected: 'auth-rejected',
  loginState: 'login-state',
  platformMismatch: 'platform-mismatch',
  platformResponseOverflow: 'platform-response-overflow',
  platformResponseInvalid: 'platform-response-invalid',
  networkUnreachable: 'network-unreachable',
  tlsFailed: 'tls-failed',
  timeout: 'timeout',
  mcpInitializationFailed: 'mcp-initialization-failed',
  platformDirectoryFailed: 'platform-directory-failed',
  storageInitializationFailed: 'storage-initialization-failed',
  unknownError: 'unknown-error',
} as const

/** The scalar values evidence admits; no free-form objects, arrays, or text blobs. */
export type DiagnosticsEvidenceValue = boolean | number | string | null

/** One diagnosable result. */
export interface DiagnosticsCheck {
  /** Stable identifier of the check within this report. */
  id: string
  /** Stage the check observes. */
  stage: DiagnosticsStage
  /** Outcome. */
  status: DiagnosticsStatus
  /** Evidence origin. */
  source: DiagnosticsSource
  /** Whitelisted local classification (see {@link DIAGNOSTICS_CODES}). */
  code: string
  /** Whitelisted scalars only; absence of a key means "not measured", not "false". */
  evidence: Readonly<Record<string, DiagnosticsEvidenceValue>>
  /** Suggested user-facing next step, or null when status is pass. */
  nextAction: string | null
}

/** Host form and versions, each null when unverifiable (never inferred from disk). */
export interface DiagnosticsTarget {
  /** Which supported host shape is running. */
  hostForm: 'desktop' | 'npm' | 'source' | 'unknown'
  /** `process.platform` on the Host. */
  platform: string | null
  /** DSH version, when the Host exposes it. */
  dshVersion: string | null
  /** Version of this package on disk (manifest read), if readable. */
  pluginDiskVersion: string | null
  /** Version the Host actually loaded, when observable; not inferred from disk. */
  pluginLoadedVersion: string | null
}

/** What the report did and did not establish. */
export interface DiagnosticsCoverage {
  /** Count of checks that executed (any status except not-run). */
  executedChecks: number
  /** Count of checks skipped because a precondition failed. */
  notRunChecks: number
  /** Count of checks that ran but could not decide. */
  insufficientEvidenceChecks: number
  /** Bounded, non-sensitive notes about matching/target ambiguity. */
  notes: readonly string[]
}

/** A complete diagnostics report as exported by the panel. */
export interface DiagnosticsReport {
  /** See {@link DIAGNOSTICS_SCHEMA_VERSION}. */
  schemaVersion: number
  /** Random id identifying this one diagnostic run. */
  reportId: string
  /** UTC ISO-8601 creation time. */
  createdAt: string
  /** Environment the report describes. */
  target: DiagnosticsTarget
  /** `passive` reads observed state only; `active` additionally ran fixed read-only retests. */
  mode: 'passive' | 'active'
  /** Checks in execution order. */
  checks: readonly DiagnosticsCheck[]
  /** See {@link DiagnosticsCoverage}. */
  coverage: DiagnosticsCoverage
}

/** Id alphabet for {@link DiagnosticsReport.reportId}: unambiguous lowercase hex. */
const REPORT_ID_ALPHABET = '0123456789abcdef'

/** Length of {@link DiagnosticsReport.reportId}. */
const REPORT_ID_LENGTH = 8

/**
 * Generate a fresh report id. Randomness comes from the CSPRNG so ids are not
 * guessable from timestamps alone; the value carries no host information.
 * @returns a short lowercase hex id.
 */
export function newDiagnosticsReportId(): string {
  const bytes = new Uint8Array(REPORT_ID_LENGTH)
  crypto.getRandomValues(bytes)
  let id = ''
  for (const byte of bytes) id += REPORT_ID_ALPHABET[byte % REPORT_ID_ALPHABET.length]
  return id
}

/**
 * Assemble the coverage block from the checks of one report.
 * @param checks - the checks the run produced.
 * @param notes - bounded, non-sensitive notes.
 * @returns the derived coverage summary.
 */
export function diagnosticsCoverageOf(
  checks: readonly DiagnosticsCheck[],
  notes: readonly string[] = [],
): DiagnosticsCoverage {
  return {
    executedChecks: checks.filter(check => check.status !== 'not-run').length,
    notRunChecks: checks.filter(check => check.status === 'not-run').length,
    insufficientEvidenceChecks: checks.filter(check => check.status === 'insufficient-evidence').length,
    notes: [...notes],
  }
}

/** Upper bound for evidence strings before they are refused (defence in depth for field-name echoes). */
export const DIAGNOSTICS_EVIDENCE_TEXT_LIMIT = 64

/**
 * Evidence fields that may carry a string. Every other string value is
 * dropped at sanitization time: free-form text is exactly how raw messages
 * leak, and all other whitelisted evidence is numeric or boolean by design.
 */
export const DIAGNOSTICS_EVIDENCE_STRING_FIELDS: readonly string[] = ['configField']

/**
 * Keep only whitelisted scalar evidence values. Nested objects, arrays,
 * symbols, long strings, and strings outside the designated string fields
 * are dropped rather than stringified, so a bug in a collector cannot smuggle
 * a raw payload into the report.
 * @param evidence - candidate evidence fields.
 * @returns the filtered evidence record.
 */
export function sanitizeDiagnosticsEvidence(
  evidence: Readonly<Record<string, unknown>>,
): Record<string, DiagnosticsEvidenceValue> {
  const clean: Record<string, DiagnosticsEvidenceValue> = {}
  for (const [key, value] of Object.entries(evidence)) {
    if (typeof value === 'boolean' || value === null) {
      clean[key] = value
    } else if (typeof value === 'number' && Number.isFinite(value)) {
      clean[key] = value
    } else if (typeof value === 'string' && value.length <= DIAGNOSTICS_EVIDENCE_TEXT_LIMIT) {
      if (DIAGNOSTICS_EVIDENCE_STRING_FIELDS.includes(key)) clean[key] = value
    }
  }
  return clean
}
