/** Profile settings bridge owned by the independent diagnostics row. */
import { Context } from '@deepseek-ai/cordis'
import { Remote, RemoteError, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol'
import { Config } from './config.js'
import { BUSINESS_ENTRY_ID } from './diagnostics-contract.js'
import type { OpenBknConfigurationInput, OpenBknConfigurationView } from './types.js'

interface ConfigurationEntry {
  readonly options: { readonly id: string; readonly name: string; readonly config?: unknown }
  readonly fiber?: { readonly state: number; readonly config?: unknown }
}
/** Pinned public ConfigEditor API; optional so its absence cannot kill diagnostics. */
interface ConfigurationEditor {
  entries(): ConfigurationEntry[]
  edit(entry: ConfigurationEntry, change: (current: Record<string, unknown>, inherited: Record<string, unknown>) => Record<string, unknown>): Promise<void>
}

declare module '@deepseek-ai/cordis' {
  interface Context { openbknConfiguration: OpenBknConfigurationService }
}
declare module '@deepseek-ai/dsh-typert-protocol' {
  interface RemoteErrorDetailsMap {
    'openbkn/configuration-invalid': { readonly configField: 'baseUrl' | 'cliPath' }
    'openbkn/configuration-unavailable': { readonly reason: string }
    'openbkn/configuration-busy': Record<string, never>
    'openbkn/configuration-save-failed': Record<string, never>
  }
}

/** Keep all writes in the host's editor; never write YAML or credentials here. */
export class OpenBknConfigurationService extends TypertRemoteService {
  private saving = false
  /** A short admission fence while the native editor writes/reloads. */
  get isChanging(): boolean { return this.saving }
  constructor(ctx: Context) { super(ctx, 'openbknConfiguration') }

  private editor(): ConfigurationEditor | undefined {
    const editor = this.ctx.get('configEditor') as ConfigurationEditor | undefined
    return editor !== undefined && typeof editor.entries === 'function' && typeof editor.edit === 'function' ? editor : undefined
  }

  private entry(editor = this.editor()): ConfigurationEntry | undefined {
    const entries = editor?.entries().filter(entry => entry.options.id === BUSINESS_ENTRY_ID
      && entry.options.name === '@openbkn/dsh-business-context/business') ?? []
    return entries.length === 1 ? entries[0] : undefined
  }

  private observedEntry(editor: ConfigurationEditor | undefined): ConfigurationEntry | undefined {
    const editable = this.entry(editor)
    if (editable !== undefined) return editable
    const loader = this.ctx.get('loader') as { entries(): Iterable<ConfigurationEntry> } | undefined
    const entries = loader === undefined ? [] : [...loader.entries()].filter(entry => entry.options.id === BUSINESS_ENTRY_ID
      && entry.options.name === '@openbkn/dsh-business-context/business')
    return entries.length === 1 ? entries[0] : undefined
  }

  private busy(): boolean {
    const business = this.ctx.get('openbknBusinessContext') as { hasRunningTurn?: boolean } | undefined
    return business?.hasRunningTurn === true
  }

  @Remote('getConfiguration')
  async getConfiguration(signal?: AbortSignal): Promise<OpenBknConfigurationView> {
    if (signal?.aborted) throw signal.reason
    const editor = this.editor()
    const entry = this.observedEntry(editor)
    // Loader keeps raw !!js nodes in options; active Fiber.config is the host-resolved value.
    // Reading it reuses the native parser without evaluating expressions in the plugin.
    const value = entry?.fiber?.state === 2 && entry.fiber.config !== undefined
      ? entry.fiber.config : entry?.options.config
    const config = value as Record<string, unknown> | undefined
    const baseUrl = typeof config?.baseUrl === 'string' ? config.baseUrl : ''
    const cliPath = typeof config?.cliPath === 'string' ? config.cliPath : 'openbkn'
    const unavailableReason = editor === undefined ? 'editor-unavailable'
      : this.entry(editor) === undefined ? 'entry-unavailable'
      : entry?.fiber?.state !== 2 ? 'entry-inactive'
      : this.saving || this.busy() ? 'busy' : undefined
    return { baseUrl, cliPath, configured: baseUrl !== '', editable: unavailableReason === undefined,
      ...(unavailableReason === undefined ? {} : { unavailableReason }) }
  }

  @Remote('saveConfiguration')
  async saveConfiguration(input: OpenBknConfigurationInput, signal?: AbortSignal): Promise<OpenBknConfigurationView> {
    if (signal?.aborted) throw signal.reason
    // Empty submission is a form error, unlike the initial schema default.
    if (typeof input?.baseUrl !== 'string' || input.baseUrl === '') {
      throw new RemoteError('openbkn/configuration-invalid', 'Enter an absolute HTTP(S) platform URL.', { configField: 'baseUrl' })
    }
    if (typeof input.cliPath !== 'string' || input.cliPath.trim() === '') {
      throw new RemoteError('openbkn/configuration-invalid', 'Enter the OpenBKN CLI command or path.', { configField: 'cliPath' })
    }
    const validation = await Config['~standard'].validate({ baseUrl: input.baseUrl, cliPath: input.cliPath })
    if (validation.issues !== undefined) throw new RemoteError('openbkn/configuration-invalid', 'Enter an absolute HTTP(S) platform URL.', { configField: 'baseUrl' })
    if (this.saving || this.busy()) throw new RemoteError('openbkn/configuration-busy', 'Wait for the current session to finish before changing settings.', {})
    const editor = this.editor()
    const entry = this.entry(editor)
    if (editor === undefined || entry === undefined || entry.fiber?.state !== 2) {
      throw new RemoteError('openbkn/configuration-unavailable', 'This host cannot edit the active OpenBKN profile entry.', { reason: 'entry-or-editor-unavailable' })
    }
    this.saving = true
    try {
      await editor.edit(entry, current => {
        if (signal?.aborted) throw signal.reason
        if (this.busy()) throw new RemoteError('openbkn/configuration-busy', 'Wait for the current session to finish before changing settings.', {})
        return { ...current, baseUrl: input.baseUrl, cliPath: input.cliPath }
      })
    } catch (error) {
      if (error instanceof RemoteError) throw error
      throw new RemoteError('openbkn/configuration-save-failed', 'Settings were not applied. Check for a profile override or export diagnostics.', {})
    } finally { this.saving = false }
    // The business row was reloaded, but this independent service remains alive.
    return await this.getConfiguration()
  }
}
