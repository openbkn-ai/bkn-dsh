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
 * process marks an Electron runtime. Plain Node is inconclusive: the official
 * Desktop also spawns a Node Host, as do npm and source builds. Without an
 * authoritative host-form signal, keep the form unknown.
 * @returns the observed host form.
 */
function hostFormOf(): DiagnosticsTarget['hostForm'] {
  const versions = (process as unknown as { versions?: Record<string, string | undefined> }).versions
  if (versions?.electron !== undefined) return 'desktop'
  return 'unknown'
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

/** A configured address is required before connection checks can execute. */
function pendingConfigurationChecks(ctx: Context): CheckDraft[] {
  const loader = loaderOf(ctx)
  const business = loader === undefined ? undefined : findOwnEntries(loader).business
  if (business?.fiber?.state !== 2) return []
  // The active native Fiber owns resolved values; raw Loader options may contain !!js nodes.
  const config = (business.fiber.config === undefined ? business.options.config : business.fiber.config) as { baseUrl?: unknown } | undefined
  if (config?.baseUrl !== undefined && config.baseUrl !== '') return []
  return ['configuration', 'cli', 'authentication', 'context-loader', 'platform-directory'].map(stage => ({
    id: stage === 'configuration' ? 'configuration' : `pending:${stage}`,
    stage: stage as DiagnosticsStage, status: 'not-run', code: DIAGNOSTICS_CODES.configurationRequired,
    evidence: { configured: false }, nextAction: 'Open OpenBKN settings, save the platform URL, then sign in with the OpenBKN CLI.',
  }))
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
 * The package-root row's health. The bootstrap keeps the client bundle
 * served; its absence or failure is the whole-package-root degradation, not
 * a business finding — it is reported as its own check and never merged
 * into the business entry.
 * @param ctx - the diagnostics service context.
 * @returns the bootstrap check draft.
 */
async function bootstrapEntryCheck(ctx: Context): Promise<CheckDraft> {
  const loader = loaderOf(ctx)
  if (loader === undefined) {
    return {
      id: 'bootstrap-entry', stage: 'installation', status: 'insufficient-evidence',
      code: DIAGNOSTICS_CODES.diagnosticsServiceDegraded,
      evidence: { loaderAvailable: false }, nextAction: null,
    }
  }
  const { bootstrap } = findOwnEntries(loader)
  if (bootstrap === undefined) {
    return {
      id: 'bootstrap-entry', stage: 'installation', status: 'fail',
      code: DIAGNOSTICS_CODES.moduleResolutionFailed,
      evidence: { entryPresent: false },
      nextAction: 'The package-root bootstrap row is missing from this profile; reinstall the plugin.',
    }
  }
  const observation = await observeEntry(bootstrap)
  const failed = observation.kind === 'module-resolution-failed' || observation.kind === 'initialization-failed'
  return {
    id: 'bootstrap-entry',
    stage: observation.kind === 'configuration-invalid' ? 'configuration' : 'installation',
    status: observation.kind === 'active' ? 'pass' : failed ? 'fail' : 'insufficient-evidence',
    code: observation.kind === 'active' ? DIAGNOSTICS_CODES.componentLoaded : codeOfObservation(observation),
    evidence: {
      entryPresent: true,
      ...(observation.kind === 'configuration-invalid' ? { configField: observation.field } : {}),
    },
    nextAction: failed ? 'The package root itself failed to load; reinstall the plugin and export a fresh report.' : null,
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
    const drafts = [await bootstrapEntryCheck(this.ctx), await businessEntryCheck(this.ctx), selfCheck(), ...pendingConfigurationChecks(this.ctx)]
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
