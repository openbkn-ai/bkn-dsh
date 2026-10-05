/**
 * Host-side diagnostics service exposed as the `openbknDiagnostics` Remote
 * namespace.
 *
 * The service owns no business state and imports no business module, so the
 * business entry failing (config validation, module resolution, startup)
 * cannot take the report channel down. Reports are assembled strictly from
 * the public loader/fiber surface ({@link diagnostics-host-adapter}) and
 * whitelisted scalars ({@link diagnostics-contract}); raw errors are
 * classified in this module and never leave the Host.
 * @module diagnostics-service
 */

import { readFileSync } from 'node:fs'
import { Context } from '@deepseek-ai/cordis'
import { Remote, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol'
import {
  DIAGNOSTICS_CODES,
  DIAGNOSTICS_SCHEMA_VERSION,
  diagnosticsCoverageOf,
  newDiagnosticsReportId,
  type DiagnosticsCheck,
  type DiagnosticsReport,
  type DiagnosticsStage,
  type DiagnosticsStatus,
  type DiagnosticsTarget,
} from './diagnostics-contract.js'
import {
  codeOfObservation,
  findOwnEntries,
  loaderOf,
  observeEntry,
} from './diagnostics-host-adapter.js'
import { passiveDiagnostics } from './diagnostics-observer.js'

declare module '@deepseek-ai/cordis' {
  interface Context {
    /** Passive OpenBKN diagnostics available even when the business entry failed. */
    openbknDiagnostics: OpenBknDiagnosticsService
  }
}

/** One candidate step in the passive sweep, produced by the collectors below. */
interface CheckDraft {
  readonly id: string
  readonly stage: DiagnosticsStage
  readonly status: DiagnosticsStatus
  readonly code: string
  readonly evidence: Readonly<Record<string, boolean | number | string | null>>
  readonly nextAction: string | null
}

/**
 * Read the package version this bundle was shipped in. Reading our own
 * manifest is a package-files observation and never proves what the Host
 * loaded; the loaded version stays its own (often unknown) field.
 * @returns the disk version, or null when the manifest is unreadable.
 */
function readDiskVersion(): string | null {
  try {
    const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as { version?: unknown }
    return typeof manifest.version === 'string' ? manifest.version : null
  } catch {
    return null
  }
}

/**
 * Classify the running host form from process facts only. An Electron
 * main-process preload marks the desktop app; a plain Node process is the npm
 * CLI form (a source build is indistinguishable from npm by this signal
 * alone and stays `npm` only when the DSH version is observable — otherwise
 * `unknown`, never a guess dressed as evidence).
 * @returns the observed host form.
 */
function hostFormOf(): DiagnosticsTarget['hostForm'] {
  const versions = (process as unknown as { versions?: Record<string, string | undefined> }).versions
  if (versions?.electron !== undefined) return 'desktop'
  return 'npm'
}

/**
 * Observe the business entry and produce its passive check.
 * @param ctx - the diagnostics service context.
 * @returns the component check draft.
 */
async function businessEntryCheck(ctx: Context): Promise<CheckDraft> {
  const loader = loaderOf(ctx)
  if (loader === undefined) {
    return {
      id: 'business-entry', stage: 'component', status: 'insufficient-evidence',
      code: DIAGNOSTICS_CODES.diagnosticsServiceDegraded,
      evidence: { loaderAvailable: false }, nextAction: null,
    }
  }
  const { business } = findOwnEntries(loader)
  if (business === undefined) {
    return {
      id: 'business-entry', stage: 'installation', status: 'insufficient-evidence',
      code: DIAGNOSTICS_CODES.moduleResolutionFailed,
      evidence: { entryPresent: false },
      nextAction: 'The OpenBKN entry is not registered in this profile; reinstall the plugin or review the profile patch.',
    }
  }
  const observation = await observeEntry(business)
  const failed = observation.kind === 'module-resolution-failed'
    || observation.kind === 'configuration-invalid'
    || observation.kind === 'initialization-failed'
  return {
    id: 'business-entry',
    stage: observation.kind === 'configuration-invalid' ? 'configuration' : 'component',
    status: observation.kind === 'active' ? 'pass' : failed ? 'fail' : 'insufficient-evidence',
    code: codeOfObservation(observation),
    evidence: {
      entryPresent: true,
      ...(observation.kind === 'configuration-invalid' ? { configField: observation.field } : {}),
    },
    nextAction: failed ? 'Export this report and send it to support; the OpenBKN panel cannot start until the listed stage is fixed.' : null,
  }
}

/** The diagnostics entry's own health check (it is running by construction). */
function selfCheck(): CheckDraft {
  return {
    id: 'diagnostics-entry', stage: 'diagnostics', status: 'pass',
    code: DIAGNOSTICS_CODES.componentLoaded,
    evidence: { schemaVersion: DIAGNOSTICS_SCHEMA_VERSION },
    nextAction: null,
  }
}

/**
 * Diagnostics service: passive report assembly over the public loader
 * surface. D1 adds the observed-operation collectors and the bounded active
 * retest; nothing here may assume the business entry is loaded.
 */
export class OpenBknDiagnosticsService extends TypertRemoteService {
  static inject = ['loader']

  constructor(ctx: Context) {
    super(ctx, 'openbknDiagnostics')
  }

  /**
   * Assemble one passive diagnostics report: entry/fiber state plus the
   * bounded observations recorded by the business boundaries (empty when the
   * business entry never loaded — the fiber checks carry that case).
   * @param signal - cancellation signal from the Remote transport; optional
   * because the client may invoke without one.
   * @returns the whitelisted report DTO.
   */
  @Remote('getReport')
  async getReport(signal?: AbortSignal): Promise<DiagnosticsReport> {
    if (signal?.aborted) throw signal.reason
    const drafts = [await businessEntryCheck(this.ctx), selfCheck()]
    const observed = passiveDiagnostics.snapshot()
    const notes = passiveDiagnostics.droppedObservationCount > 0
      ? [`observation buffer dropped ${String(passiveDiagnostics.droppedObservationCount)} novel keys after the bound`]
      : []
    const checks: readonly DiagnosticsCheck[] = [...drafts.map(draft => ({
      id: draft.id, stage: draft.stage, status: draft.status, source: 'host-runtime' as const,
      code: draft.code, evidence: draft.evidence, nextAction: draft.nextAction,
    })), ...observed]
    return {
      schemaVersion: DIAGNOSTICS_SCHEMA_VERSION,
      reportId: newDiagnosticsReportId(),
      createdAt: new Date().toISOString(),
      target: {
        hostForm: hostFormOf(),
        platform: typeof process?.platform === 'string' ? process.platform : null,
        dshVersion: null,
        pluginDiskVersion: readDiskVersion(),
        pluginLoadedVersion: null,
      },
      mode: 'passive',
      checks,
      coverage: diagnosticsCoverageOf(checks, notes),
    }
  }
}
