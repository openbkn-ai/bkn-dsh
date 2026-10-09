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
  readonly phase: OpenBknOverlayPhase
  readonly auth?: AuthSnapshot
  readonly networks: readonly BusinessNetworkSummary[]
  readonly message?: string
  readonly configuration?: OpenBknConfigurationView
  readonly configurationMessage?: string
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

  constructor(
    private readonly port: OpenBknUiPort,
    private readonly openNetworkSession: OpenNetworkSession,
    private readonly refreshBoundSession?: (sessionId: string) => void,
    private readonly configurationPort?: OpenBknConfigurationPort,
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
    this.publish({ ...this.state, phase: 'loading', message: undefined, networks: [] })
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
      this.publish({ ...this.state, configuration: undefined, loadingConfiguration: false, configurationMessage: '当前无法读取插件设置。请查看诊断，确认配置组件已启用后重试。' })
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
      this.publish({ open: true, phase: 'loading', networks: [], configuration, message: '设置已保存，正在检查连接…' })
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
    if (!this.state.open) return
    const operation = this.start(signal)
    this.publish({ ...this.state, phase: 'loading', message: undefined })
    try {
      const networks = await this.port.beginLogin(operation.signal)
      if (!this.current(operation)) return
      const auth = await this.port.status(operation.signal)
      if (!this.current(operation)) return
      this.publish({ open: true, phase: 'ready', auth, networks, ...withConfiguration(this.state.configuration) })
    } catch (error: unknown) {
      if (this.current(operation)) this.connectionFailed(error, this.state.configuration)
    }
  }

  async openNetwork(networkId: string, mode: NetworkSessionMode, signal?: AbortSignal): Promise<void> {
    if (!this.state.open) return
    const network = this.state.networks.find(candidate => candidate.id === networkId)
    if (network === undefined) {
      this.publish({ ...this.state, message: '所选业务知识网络已不可用，请刷新后重试。' })
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
        this.publish({ open: true, phase: 'authentication-required', auth, networks: [], ...withConfiguration(configuration), ...(saved ? { message: '设置已保存，请使用 OpenBKN CLI 登录并同步。' } : {}) })
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
    const prefix = saved ? '设置已保存。' : ''
    if (isAuthenticationRequiredError(error)) {
      this.publish({ open: true, phase: 'authentication-required', auth: { kind: 'authentication-required', baseUrl: error.details.baseUrl }, networks: [], ...withConfiguration(configuration), message: prefix + authenticationFailureMessage(error) })
      return
    }
    const message = isPlatformUnavailableError(error)
      ? 'OpenBKN 平台的业务知识网络目录暂不可用。已保存的凭据未被修改；请确认服务恢复后重试。'
      : connectionFailureMessage(error)
    this.publish({ open: true, phase: 'error', networks: [], ...withConfiguration(configuration), message: prefix + message })
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
function validateConfigurationInput(input: OpenBknConfigurationInput): string | undefined {
  try {
    const url = new URL(input.baseUrl)
    if (!/^https?:\/\/[^/]/i.test(input.baseUrl) || /[\s\\]/u.test(input.baseUrl)
      || !['http:', 'https:'].includes(url.protocol) || url.hostname === '') throw new Error('invalid')
  } catch {
    return '请输入完整的 HTTP(S) 平台地址，例如 https://openbkn.example.com。'
  }
  if (input.cliPath.trim() === '') return '请填写 OpenBKN CLI 执行路径；使用默认安装时填写 openbkn。'
  return undefined
}

function configurationFailureMessage(error: unknown): string {
  switch (errorCode(error)) {
    case 'openbkn/configuration-invalid': return '平台地址或 CLI 执行路径无效，请检查输入后重试。'
    case 'openbkn/configuration-busy': return '业务回合仍在运行，请等回合结束后保存设置。'
    case 'openbkn/configuration-unavailable': return '当前无法修改这项配置。请检查插件条目是否启用、是否存在重复条目或更高层配置覆盖。'
    default: return '设置未能保存，请重试或查看诊断。当前输入已保留。'
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

function authenticationFailureMessage(error: { readonly details: { readonly layer?: unknown; readonly httpStatus?: unknown } }): string {
  const source = error.details.layer === 'context-loader-mcp' ? 'Context Loader MCP' : 'OpenBKN 平台'
  if (error.details.httpStatus === 403) {
    return `${source} 拒绝了当前账号的访问（HTTP 403）。请联系平台管理员核实访问权限，或使用具有平台访问权限的账号；重新登录同一账号不保证恢复。`
  }
  const status = error.details.httpStatus === 401 ? '（HTTP 401）' : ''
  return `${source} 拒绝了当前凭据${status}。请使用 OpenBKN CLI 重新登录并同步。`
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

function connectionFailureMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null) {
    const candidate = error as { code?: unknown, details?: unknown }
    if (candidate.code === 'openbkn/business-unavailable') {
      return 'OpenBKN 业务组件尚未就绪或启动失败。请点击右上角“诊断”查看原因并导出报告。'
    }
    if (candidate.code === 'openbkn/cli-unavailable') {
      return 'DSH 找不到 OpenBKN CLI（openbkn）。请先安装与平台版本一致的 CLI（`npm install -g @openbkn/bkn-sdk@<平台版本>`），确认启动 DSH 的环境 PATH 里能找到它；也可以点击右上角“设置”，在高级设置的 cliPath 中填写它的绝对路径（Windows 上填写 openbkn.cmd）。保存后点击“使用 OpenBKN CLI 登录并同步”。'
    }
    if (candidate.code === 'openbkn/connection-failed' && typeof candidate.details === 'object' && candidate.details !== null) {
      const layer = (candidate.details as { layer?: unknown }).layer
      if ((candidate.details as { httpStatus?: unknown }).httpStatus === 403) {
        const source = layer === 'context-loader-mcp' ? 'Context Loader MCP' : 'OpenBKN 平台'
        return `${source} 拒绝了当前账号的访问（HTTP 403）。请联系平台管理员核实访问权限后重试。`
      }
      if (layer === 'context-loader-mcp') return '无法连接 OpenBKN Context Loader MCP。请检查平台地址、网络连接及账号的 MCP 访问权限。'
      if (layer === 'platform-api') return 'Context Loader MCP 已连接，但无法读取业务知识网络目录。请确认当前账号具有 OpenBKN 平台访问权限。'
    }
  }
  return '暂时无法验证 OpenBKN 连接，当前原因尚未确定。请点击右上角“诊断”查看检查结果；若问题持续，请导出报告交给支持人员。'
}

/** Shown while the native chooser is open; on some hosts (Windows `dsh web`) it opens behind other windows. */
const WORKSPACE_PICKER_HINT = '请在弹出的系统窗口中选择工作区目录（窗口可能被其他窗口挡住，可从任务栏或 Dock 切换过去）。选好后会自动创建工作区并绑定会话。'

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
function bindFailureMessage(error: unknown): string {
  const code = errorCode(error)
  if (code === DIRECTORY_PICKER_UNAVAILABLE) {
    return '当前连接模式（远程/浏览目录后端）不支持创建新工作区。请先为该知识网络关联一个已存在的本地工作区，或从本地桌面会话操作。'
  }
  if (code === DIRECTORY_PICKER_FAILED) {
    const detail = error instanceof Error ? error.message.trim() : ''
    return `无法打开本机目录选择器${detail === '' ? '' : `：${detail}`}。请处理后重试。`
  }
  const detail = error instanceof Error ? error.message.trim() : ''
  return detail === '' ? 'This network could not be bound to the current conversation. Try again.'
    : `This network could not be bound to the current conversation: ${detail}`
}
