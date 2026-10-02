import type { AuthSnapshot, BusinessNetworkBinding, BusinessNetworkSummary } from '../types.ts'

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

export type OpenNetworkSession = (network: BusinessNetworkSummary, mode: NetworkSessionMode) => Promise<string>

export type OpenBknOverlayPhase = 'idle' | 'loading' | 'authentication-required' | 'ready' | 'binding' | 'error'

/** Render state for the additive OpenBKN overlay; credentials never enter it. */
export interface OpenBknOverlayState {
  readonly open: boolean
  readonly phase: OpenBknOverlayPhase
  readonly auth?: AuthSnapshot
  readonly networks: readonly BusinessNetworkSummary[]
  readonly message?: string
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

  constructor(
    private readonly port: OpenBknUiPort,
    private readonly openNetworkSession: OpenNetworkSession,
    private readonly refreshBoundSession?: (sessionId: string) => void,
  ) {}

  snapshot(): OpenBknOverlayState {
    return this.state
  }

  /** Slot-renderer observable contract; kept alongside `snapshot()` for tests and callers. */
  getSnapshot(): OpenBknOverlayState {
    return this.state
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  open(): void {
    this.publish({ open: true, phase: 'idle', networks: [] })
  }

  close(): void {
    this.publish({ open: false, phase: 'idle', networks: [] })
  }

  async refresh(signal?: AbortSignal): Promise<void> {
    if (!this.state.open) return

    this.publish({ ...this.state, phase: 'loading', message: undefined, networks: [] })
    try {
      const auth = await this.port.status(signal)
      if (auth.kind !== 'authenticated') {
        this.publish({ open: true, phase: 'authentication-required', auth, networks: [] })
        return
      }

      const networks = await this.port.listNetworks(signal)
      this.publish({ open: true, phase: 'ready', auth, networks })
    } catch (error: unknown) {
      if (isPlatformUnavailableError(error)) {
        this.publish({ ...this.state, phase: 'error', networks: [], message: 'OpenBKN 平台的业务知识网络目录暂不可用。已保存 Token 未被修改；请确认本机 OpenBKN 服务恢复后重试。' })
        return
      }
      if (isAuthenticationRequiredError(error)) {
        this.publish({
          open: true,
          phase: 'authentication-required',
          auth: { kind: 'authentication-required', baseUrl: error.details.baseUrl },
          networks: [],
          message: 'Context Loader MCP 已连接，但该 Token 无法读取 OpenBKN 平台的业务知识网络目录。请使用具有平台访问权限的用户访问 Token 或 AppKey。',
        })
        return
      }
      this.publish({ ...this.state, phase: 'error', networks: [], message: connectionFailureMessage(error) })
    }
  }

  /** Save and test a token without retaining it in controller state. */
  async configureToken(token: string): Promise<void> {
    if (!this.state.open) return

    this.publish({ ...this.state, phase: 'loading', message: undefined })
    try {
      const networks = await this.port.configureToken(token)
      const auth = await this.port.status()
      this.publish({ open: true, phase: 'ready', auth, networks })
    } catch (error: unknown) {
      if (isPlatformUnavailableError(error)) {
        this.publish({ ...this.state, phase: 'error', message: 'OpenBKN 平台的业务知识网络目录暂不可用。已保存 Token 未被修改；请确认本机 OpenBKN 服务恢复后重试。' })
        return
      }
      if (isAuthenticationRequiredError(error)) {
        this.publish({
          open: true,
          phase: 'authentication-required',
          auth: { kind: 'authentication-required', baseUrl: error.details.baseUrl },
          networks: [],
          message: 'Context Loader MCP 已连接，但该 Token 无法读取 OpenBKN 平台的业务知识网络目录。请使用具有平台访问权限的用户访问 Token 或 AppKey。',
        })
        return
      }
      this.publish({ ...this.state, phase: 'error', message: connectionFailureMessage(error) })
    }
  }

  /** Run the Host-only OpenBKN CLI login, then present its verified catalogue. */
  async beginLogin(signal?: AbortSignal): Promise<void> {
    if (!this.state.open) return
    this.publish({ ...this.state, phase: 'loading', message: undefined })
    try {
      const networks = await this.port.beginLogin(signal)
      const auth = await this.port.status(signal)
      this.publish({ open: true, phase: 'ready', auth, networks })
    } catch (error: unknown) {
      this.publish({ ...this.state, phase: 'error', networks: [], message: connectionFailureMessage(error) })
    }
  }

  async openNetwork(networkId: string, mode: NetworkSessionMode, signal?: AbortSignal): Promise<void> {
    const network = this.state.networks.find(candidate => candidate.id === networkId)
    if (network === undefined) {
      this.publish({ ...this.state, message: 'The selected OpenBKN business knowledge network is no longer available.' })
      return
    }

    this.publish({ ...this.state, phase: 'binding', message: mode === 'create-workspace' ? WORKSPACE_PICKER_HINT : undefined })
    try {
      const sessionId = await this.openNetworkSession(network, mode)
      await this.port.bindNetwork(sessionId, networkId, signal)
      this.refreshBoundSession?.(sessionId)
      this.close()
    } catch (error: unknown) {
      // Dismissing the chooser is a choice, not a failure: back to the list.
      if (errorCode(error) === WORKSPACE_SELECTION_CANCELLED) this.publish({ ...this.state, phase: 'ready', message: undefined })
      else this.publish({ ...this.state, phase: 'error', message: bindFailureMessage(error) })
    }
  }

  private publish(state: OpenBknOverlayState): void {
    this.state = state
    for (const listener of this.listeners) listener()
  }
}

function isAuthenticationRequiredError(error: unknown): error is {
  readonly code: 'openbkn/authentication-required'
  readonly details: { readonly baseUrl: string }
} {
  if (typeof error !== 'object' || error === null) return false
  const candidate = error as { code?: unknown; details?: unknown }
  if (candidate.code !== 'openbkn/authentication-required' || typeof candidate.details !== 'object' || candidate.details === null) return false
  return typeof (candidate.details as { baseUrl?: unknown }).baseUrl === 'string'
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
    if (candidate.code === 'openbkn/cli-unavailable') {
      return 'DSH 找不到 OpenBKN CLI（openbkn）。请先安装与平台版本一致的 CLI（`npm install -g @openbkn/bkn-sdk@<平台版本>`）并执行 `openbkn auth login`，确认启动 DSH 的环境 PATH 里能找到它，然后重启 DSH；也可以在 cordis.patch.yml 的 openbkn-business-context 条目里把 cliPath 设为它的绝对路径（Windows 上要写到 openbkn.cmd）。'
    }
    if (candidate.code === 'openbkn/connection-failed' && typeof candidate.details === 'object' && candidate.details !== null) {
      const layer = (candidate.details as { layer?: unknown }).layer
      if (layer === 'context-loader-mcp') return '无法连接 OpenBKN Context Loader MCP。请检查平台地址、网络连接和 Token 的 MCP 访问权限。'
      if (layer === 'platform-api') return 'Context Loader MCP 已连接，但无法读取业务知识网络目录。请确认 Token 具有 OpenBKN 平台访问权限。'
    }
  }
  return '无法验证 OpenBKN 连接。请检查 Token 和平台地址后重试。'
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
