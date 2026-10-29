import { uiMessage, joinUiMessages, type UiMessage } from './messages.ts'
import type { AuthSnapshot, BusinessNetworkBinding, BusinessNetworkSummary, OpenBknConfigurationInput, OpenBknConfigurationView } from '../types.ts'

/** Minimal browser-safe port over the generated OpenBKN Remote contract. */
export interface OpenBknUiPort {
  status(signal?: AbortSignal): Promise<AuthSnapshot>
  beginLogin(signal?: AbortSignal): Promise<readonly BusinessNetworkSummary[]>
  configureToken(token: string, signal?: AbortSignal): Promise<readonly BusinessNetworkSummary[]>
  listNetworks(signal?: AbortSignal): Promise<readonly BusinessNetworkSummary[]>
  bindNetworkWorkspace(networkId: string, workspacePath: string, signal?: AbortSignal): Promise<BusinessNetworkSummary>
  bindNetwork(sessionId: string, networkId: string, signal?: AbortSignal): Promise<BusinessNetworkBinding>
}

export type NetworkSessionMode = 'continue' | 'new' | 'create-workspace'

export type OpenNetworkSession = (network: BusinessNetworkSummary, mode: NetworkSessionMode, signal?: AbortSignal) => Promise<string>

/** Independent from the business row, so first-use configuration can reload it safely. */
export interface OpenBknConfigurationPort {
  getConfiguration(signal?: AbortSignal): Promise<OpenBknConfigurationView>
  saveConfiguration(input: OpenBknConfigurationInput, signal?: AbortSignal): Promise<OpenBknConfigurationView>
}

export type OpenBknOverlayPhase = 'idle' | 'loading' | 'authentication-required' | 'ready' | 'binding' | 'configuration' | 'error'

/** Render state for the additive OpenBKN overlay; credentials never enter it. */
export interface OpenBknOverlayState {
  readonly open: boolean
  readonly login?: 'waiting' | 'succeeded' | 'failed' | 'timed-out' | 'cancelled'
  readonly phase: OpenBknOverlayPhase
  readonly auth?: AuthSnapshot
  readonly networks: readonly BusinessNetworkSummary[]
  readonly message?: UiMessage
  readonly configuration?: OpenBknConfigurationView
  readonly configurationMessage?: UiMessage
  readonly savingConfiguration?: boolean
  readonly loadingConfiguration?: boolean
}

type Listener = () => void

/**
 * Keeps Remote calls and their transient UI state outside React components.
 * The controller intentionally knows only a selected session ID and safe
 * catalogue summaries; Host code remains authoritative for authentication,
 * visibility and durable binding.
 */
export class OpenBknUiController {
  private state: OpenBknOverlayState = { open: false, phase: 'idle', networks: [] }
  private readonly listeners = new Set<Listener>()
  private revision = 0
  private operation?: AbortController
  private loginTimer?: ReturnType<typeof setTimeout>

  constructor(
    private readonly port: OpenBknUiPort,
    private readonly openNetworkSession: OpenNetworkSession,
    private readonly refreshBoundSession?: (sessionId: string) => void,
    private readonly configurationPort?: OpenBknConfigurationPort,
    private readonly loginTimeoutMs = 120_000,
  ) {}

  snapshot(): OpenBknOverlayState { return this.state }
  getSnapshot(): OpenBknOverlayState { return this.state }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  open(): void {
    this.invalidate()
    this.publish({ open: true, phase: 'idle', networks: [] })
  }

  close(): void {
    this.invalidate()
    this.publish({ open: false, phase: 'idle', networks: [] })
  }

  /** A business-row reload must not invalidate its independent configuration save. */
  businessChanged(): void {
    if (!this.state.open || this.state.phase === 'configuration') return
    this.invalidate()
    this.publish({ open: true, phase: 'idle', networks: [] })
  }

  async refresh(signal?: AbortSignal): Promise<void> {
    if (!this.state.open) return
    const operation = this.start(signal)
    this.publish({ ...this.state, phase: 'loading', login: undefined, message: undefined, networks: [] })
    let configuration = this.state.configuration
    if (this.configurationPort !== undefined) {
      try {
        configuration = await this.configurationPort.getConfiguration(operation.signal)
        if (!this.current(operation)) return
        if (isPendingConfiguration(configuration)) {
          this.publish({ open: true, phase: 'configuration', networks: [], configuration })
          return
        }
      } catch {
        // Diagnostics/configuration entry faults must not disable a healthy business row.
        if (!this.current(operation)) return
        configuration = undefined
      }
    }
    await this.loadBusiness(operation, configuration)
  }

  async showSettings(): Promise<void> {
    if (!this.state.open) return
    const operation = this.start()
    this.publish({ open: true, phase: 'configuration', networks: [], configuration: this.state.configuration, loadingConfiguration: true })
    try {
      if (this.configurationPort === undefined) throw new Error('Configuration service unavailable')
      const configuration = await this.configurationPort.getConfiguration(operation.signal)
      if (!this.current(operation)) return
      this.publish({ open: true, phase: 'configuration', networks: [], configuration })
    } catch {
      if (!this.current(operation)) return
      this.publish({ ...this.state, configuration: undefined, loadingConfiguration: false, configurationMessage: uiMessage('pluginSettingsCouldNotBeReadCheckDiagnostics') })
    }
  }

  async saveConfiguration(input: OpenBknConfigurationInput): Promise<void> {
    if (!this.state.open || this.state.phase !== 'configuration' || this.state.savingConfiguration) return
    const invalid = validateConfigurationInput(input)
    if (invalid !== undefined) {
      this.publish({ ...this.state, configurationMessage: invalid })
      return
    }
    if (this.state.configuration?.editable !== true || this.configurationPort === undefined) return
    const operation = this.start()
    this.publish({ ...this.state, savingConfiguration: true, configurationMessage: undefined })
    try {
      const configuration = await this.configurationPort.saveConfiguration(input, operation.signal)
      if (!this.current(operation)) return
      if (isPendingConfiguration(configuration)) {
        this.publish({ open: true, phase: 'configuration', networks: [], configuration })
        return
      }
      this.publish({ open: true, phase: 'loading', networks: [], configuration, message: uiMessage('settingsSavedCheckingConnection') })
      await this.loadBusiness(operation, configuration, true)
    } catch (error: unknown) {
      if (!this.current(operation)) return
      this.publish({ ...this.state, phase: 'configuration', savingConfiguration: false, configurationMessage: configurationFailureMessage(error) })
    }
  }

  /** Existing internal API; deliberately absent from the ordinary user interface. */
  async configureToken(token: string): Promise<void> {
    if (!this.state.open) return
    const operation = this.start()
    this.publish({ ...this.state, phase: 'loading', message: undefined })
    try {
      const networks = await this.port.configureToken(token, operation.signal)
      if (!this.current(operation)) return
      const auth = await this.port.status(operation.signal)
      if (!this.current(operation)) return
      this.publish({ open: true, phase: 'ready', auth, networks, ...withConfiguration(this.state.configuration) })
    } catch (error: unknown) {
      if (this.current(operation)) this.connectionFailed(error, this.state.configuration)
    }
  }

  async beginLogin(signal?: AbortSignal): Promise<void> {
    if (!this.state.open || this.state.login === 'waiting') return
    const operation = this.start(signal)
    this.publish({ ...this.state, phase: 'loading', login: 'waiting', message: undefined })
    this.loginTimer = setTimeout(() => {
      if (this.current(operation)) this.finishLoginWait('timed-out')
    }, this.loginTimeoutMs)
    const onAbort = () => {
      if (this.state.open && this.revision === operation.revision) this.finishLoginWait('cancelled')
    }
    operation.signal.addEventListener('abort', onAbort, { once: true })
    if (operation.signal.aborted) onAbort()
    try {
      operation.signal.throwIfAborted()
      const networks = await this.port.beginLogin(operation.signal)
      if (!this.current(operation)) return
      const auth = await this.port.status(operation.signal)
      if (!this.current(operation)) return
      if (auth.kind !== 'authenticated') {
        this.publish({ open: true, phase: 'authentication-required', login: 'failed', auth, networks: [], ...withConfiguration(this.state.configuration) })
        return
      }
      this.publish({ open: true, phase: 'ready', login: 'succeeded', auth, networks, ...withConfiguration(this.state.configuration) })
    } catch (error: unknown) {
      if (this.current(operation)) {
        this.connectionFailed(error, this.state.configuration)
        this.publish({ ...this.state, login: 'failed' })
      }
    } finally {
      operation.signal.removeEventListener('abort', onAbort)
      if (this.revision === operation.revision) { clearTimeout(this.loginTimer); this.loginTimer = undefined }
    }
  }

  cancelLogin(): void {
    if (this.state.login === 'waiting') this.finishLoginWait('cancelled')
  }

  private finishLoginWait(login: 'cancelled' | 'timed-out'): void {
    this.invalidate()
    this.publish({ ...this.state, phase: 'authentication-required', login, message: undefined })
  }

  async openNetwork(networkId: string, mode: NetworkSessionMode, signal?: AbortSignal): Promise<void> {
    if (!this.state.open) return
    const network = this.state.networks.find(candidate => candidate.id === networkId)
    if (network === undefined) {
      this.publish({ ...this.state, message: uiMessage('theSelectedBusinessKnowledgeNetworkIsNoLonger') })
      return
    }
    const operation = this.start(signal)
    this.publish({ ...this.state, phase: 'binding', message: mode === 'create-workspace' ? WORKSPACE_PICKER_HINT : undefined })
    try {
      const sessionId = await this.openNetworkSession(network, mode, operation.signal)
      if (!this.current(operation)) return
      await this.port.bindNetwork(sessionId, networkId, operation.signal)
      if (!this.current(operation)) return
      this.refreshBoundSession?.(sessionId)
      this.close()
    } catch (error: unknown) {
      if (!this.current(operation)) return
      if (errorCode(error) === WORKSPACE_SELECTION_CANCELLED) this.publish({ ...this.state, phase: 'ready', message: undefined })
      else this.publish({ ...this.state, phase: 'error', message: bindFailureMessage(error) })
    }
  }

  private async loadBusiness(operation: UiOperation, configuration?: OpenBknConfigurationView, saved = false): Promise<void> {
    try {
      const auth = await this.port.status(operation.signal)
      if (!this.current(operation)) return
      if (auth.kind !== 'authenticated') {
        this.publish({ open: true, phase: 'authentication-required', auth, networks: [], ...withConfiguration(configuration), ...(saved ? { message: uiMessage('settingsSavedSignInAndSyncWithOpenBKN') } : {}) })
        return
      }
      const networks = await this.port.listNetworks(operation.signal)
      if (!this.current(operation)) return
      this.publish({ open: true, phase: 'ready', auth, networks, ...withConfiguration(configuration) })
    } catch (error: unknown) {
      if (this.current(operation)) this.connectionFailed(error, configuration, saved)
    }
  }

  private connectionFailed(error: unknown, configuration?: OpenBknConfigurationView, saved = false): void {
    const prefix = saved ? uiMessage('settingsSaved') : ''
    if (isAuthenticationRequiredError(error)) {
      this.publish({ open: true, phase: 'authentication-required', auth: { kind: 'authentication-required', baseUrl: error.details.baseUrl }, networks: [], ...withConfiguration(configuration), message: joinUiMessages(prefix, authenticationFailureMessage(error)) })
      return
    }
    const message = isPlatformUnavailableError(error)
      ? uiMessage('theOpenBKNBusinessKnowledgeNetworkDirectoryIsTemporarily')
      : connectionFailureMessage(error)
    this.publish({ open: true, phase: 'error', networks: [], ...withConfiguration(configuration), message: joinUiMessages(prefix, message) })
  }

  private start(signal?: AbortSignal): UiOperation {
    this.invalidate()
    const controller = new AbortController()
    this.operation = controller
    return { revision: this.revision, signal: signal === undefined ? controller.signal : AbortSignal.any([controller.signal, signal]) }
  }

  private current(operation: UiOperation): boolean {
    return this.state.open && this.revision === operation.revision && !operation.signal.aborted
  }

  private invalidate(): void {
    this.revision += 1
    clearTimeout(this.loginTimer)
    this.loginTimer = undefined
    this.operation?.abort()
    this.operation = undefined
  }

  private publish(state: OpenBknOverlayState): void {
    this.state = state
    for (const listener of this.listeners) listener()
  }
}

interface UiOperation { readonly revision: number; readonly signal: AbortSignal }

function withConfiguration(configuration?: OpenBknConfigurationView): { configuration?: OpenBknConfigurationView } {
  return configuration === undefined ? {} : { configuration }
}

/** Missing editor/entry is unknown configuration, not a confirmed first-use state. */
function isPendingConfiguration(configuration: OpenBknConfigurationView): boolean {
  return !configuration.configured && (configuration.editable || configuration.unavailableReason === 'busy')
}

/** Host validation remains authoritative; this prevents pointless invalid submissions. */
function validateConfigurationInput(input: OpenBknConfigurationInput): UiMessage | undefined {
  try {
    const url = new URL(input.baseUrl)
    if (!/^https?:\/\/[^/]/i.test(input.baseUrl) || /[\s\\]/u.test(input.baseUrl)
      || !['http:', 'https:'].includes(url.protocol) || url.hostname === '') throw new Error('invalid')
  } catch {
    return uiMessage('enterACompleteHTTPSPlatformURLFor')
  }
  if (input.cliPath.trim() === '') return uiMessage('enterTheOpenBKNCLIExecutablePathUseOpenbkn')
  return undefined
}

function configurationFailureMessage(error: unknown): UiMessage {
  switch (errorCode(error)) {
    case 'openbkn/configuration-invalid': return uiMessage('thePlatformURLOrCLIExecutablePathIs')
    case 'openbkn/configuration-busy': return uiMessage('aBusinessTurnIsStillRunningSaveSettings')
    case 'openbkn/configuration-unavailable': return uiMessage('thisConfigurationCannotBeChangedCheckForDisabled')
    default: return uiMessage('settingsCouldNotBeSavedRetryOrCheck')
  }
}

function isAuthenticationRequiredError(error: unknown): error is {
  readonly code: 'openbkn/authentication-required'
  readonly details: { readonly baseUrl: string; readonly layer?: unknown; readonly httpStatus?: unknown }
} {
  if (typeof error !== 'object' || error === null) return false
  const candidate = error as { code?: unknown; details?: unknown }
  if (candidate.code !== 'openbkn/authentication-required' || typeof candidate.details !== 'object' || candidate.details === null) return false
  return typeof (candidate.details as { baseUrl?: unknown }).baseUrl === 'string'
}

function authenticationFailureMessage(error: { readonly details: { readonly layer?: unknown; readonly httpStatus?: unknown } }): UiMessage {
  const source = error.details.layer === 'context-loader-mcp' ? 'Context Loader MCP' : uiMessage('openBKNPlatform')
  if (error.details.httpStatus === 403) {
    return uiMessage('accessDeniedAccount', { p0: source })
  }
  const status = error.details.httpStatus === 401 ? ' (HTTP 401)' : ''
  return uiMessage('credentialRejected', { p0: source, p1: status })
}

function isPlatformUnavailableError(error: unknown): error is {
  readonly code: 'openbkn/platform-unavailable'
  readonly details: { readonly baseUrl: string }
} {
  if (typeof error !== 'object' || error === null) return false
  const candidate = error as { code?: unknown; details?: unknown }
  if (candidate.code !== 'openbkn/platform-unavailable' || typeof candidate.details !== 'object' || candidate.details === null) return false
  return typeof (candidate.details as { baseUrl?: unknown }).baseUrl === 'string'
}

function connectionFailureMessage(error: unknown): UiMessage {
  if (typeof error === 'object' && error !== null) {
    const candidate = error as { code?: unknown, details?: unknown }
    if (candidate.code === 'openbkn/transport-failed') {
      const reason = (candidate.details as { reason?: string } | undefined)?.reason
      if (reason === 'CERTIFICATE_UNTRUSTED') return uiMessage('certificateUntrusted', { p0: reason })
      if (reason?.startsWith('CERTIFICATE_') || reason === 'TRUST_SCOPE_MISMATCH') return uiMessage('certificateInvalid', { p0: reason })
      if (reason === 'TRUST_TRANSPORT_UNAVAILABLE') return uiMessage('trustTransportMissing', { p0: reason })
      if (reason === 'TRUST_CLI_UNAVAILABLE') return uiMessage('trustCliMissing', { p0: reason })
      if (reason === 'NETWORK_TIMEOUT') return uiMessage('connectionTimeout', { p0: reason })
      if (reason === 'NETWORK_UNREACHABLE') return uiMessage('connectionNetworkFailed', { p0: reason })
      if (reason === 'PLATFORM_REJECTED') return uiMessage('connectionRejected', { p0: reason })
      return uiMessage('cliOperationFailed', { p0: reason })
    }
    if (candidate.code === 'openbkn/business-unavailable') {
      return uiMessage('theOpenBKNBusinessComponentIsNotReadyOr')
    }
    if (candidate.code === 'openbkn/cli-unavailable') {
      return uiMessage('thisDSHHostCannotUseOpenBKNCLIOpen')
    }
    if (candidate.code === 'openbkn/connection-failed' && typeof candidate.details === 'object' && candidate.details !== null) {
      const layer = (candidate.details as { layer?: unknown }).layer
      if ((candidate.details as { httpStatus?: unknown }).httpStatus === 403) {
        const source = layer === 'context-loader-mcp' ? 'Context Loader MCP' : uiMessage('openBKNPlatform')
        return uiMessage('accessDenied', { p0: source })
      }
      if (layer === 'context-loader-mcp') return uiMessage('couldNotConnectToOpenBKNContextLoaderMCP')
      if (layer === 'platform-api') return uiMessage('contextLoaderMCPIsConnectedButTheBusiness')
    }
  }
  return uiMessage('theOpenBKNConnectionCouldNotBeVerifiedThe')
}

/** Shown while the native chooser is open; on some hosts (Windows `dsh web`) it opens behind other windows. */
const WORKSPACE_PICKER_HINT = uiMessage('selectAWorkspaceDirectoryInTheSystemWindow')

const DIRECTORY_PICKER_UNAVAILABLE = 'openbkn/directory-picker-unavailable'
const DIRECTORY_PICKER_FAILED = 'openbkn/directory-picker-failed'
const WORKSPACE_SELECTION_CANCELLED = 'openbkn/workspace-selection-cancelled'

/**
 * Classify a failed `uiWorkspace.pickDirectory()`. DSH rewraps the Host's
 * `directory-picker/unavailable` refusal into a plain message, so the browse
 * backend (remote/SSH hosts) is recognised by that message; any other failure
 * is the native chooser itself failing and keeps its own text.
 */
export function directoryPickerFailure(error: unknown): Error {
  const detail = error instanceof Error ? error.message : String(error)
  return /serves "browse"/.test(detail)
    ? codedError(DIRECTORY_PICKER_UNAVAILABLE, 'directory picker unavailable in this connection mode', error)
    : codedError(DIRECTORY_PICKER_FAILED, detail, error)
}

/** The operator dismissed the workspace directory chooser. */
export function workspaceSelectionCancelled(): Error {
  return codedError(WORKSPACE_SELECTION_CANCELLED, 'Workspace selection was cancelled.')
}

function codedError(code: string, message: string, cause?: unknown): Error {
  const failure = new Error(message, cause === undefined ? undefined : { cause })
  ;(failure as Error & { code?: string }).code = code
  return failure
}

function errorCode(error: unknown): unknown {
  return typeof error === 'object' && error !== null ? (error as { code?: unknown }).code : undefined
}

/** Build the overlay's bind-failure text; the cause is never swallowed silently. */
function bindFailureMessage(error: unknown): UiMessage {
  const code = errorCode(error)
  if (code === DIRECTORY_PICKER_UNAVAILABLE) {
    return uiMessage('thisConnectionModeRemoteBrowseBackendCannotCreate')
  }
  if (code === DIRECTORY_PICKER_FAILED) return uiMessage('pickerFailed')
  return uiMessage('bindFailed')
}
