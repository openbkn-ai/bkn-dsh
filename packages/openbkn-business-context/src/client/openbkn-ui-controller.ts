import type { AuthSnapshot, BusinessNetworkBinding, BusinessNetworkSummary } from '../types.ts'

/** Minimal browser-safe port over the generated OpenBKN Remote contract. */
export interface OpenBknUiPort {
  status(signal?: AbortSignal): Promise<AuthSnapshot>
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

  constructor(private readonly port: OpenBknUiPort, private readonly openNetworkSession: OpenNetworkSession) {}

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

  async openNetwork(networkId: string, mode: NetworkSessionMode, signal?: AbortSignal): Promise<void> {
    const network = this.state.networks.find(candidate => candidate.id === networkId)
    if (network === undefined) {
      this.publish({ ...this.state, message: 'The selected OpenBKN business knowledge network is no longer available.' })
      return
    }

    this.publish({ ...this.state, phase: 'binding', message: undefined })
    try {
      const sessionId = await this.openNetworkSession(network, mode)
      await this.port.bindNetwork(sessionId, networkId, signal)
      this.close()
    } catch {
      this.publish({ ...this.state, phase: 'error', message: 'This network could not be bound to the current conversation. Try again.' })
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

function connectionFailureMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null) {
    const candidate = error as { code?: unknown, details?: unknown }
    if (candidate.code === 'openbkn/connection-failed' && typeof candidate.details === 'object' && candidate.details !== null) {
      const layer = (candidate.details as { layer?: unknown }).layer
      if (layer === 'context-loader-mcp') return '无法连接 OpenBKN Context Loader MCP。请检查平台地址、网络连接和 Token 的 MCP 访问权限。'
      if (layer === 'platform-api') return 'Context Loader MCP 已连接，但无法读取业务知识网络目录。请确认 Token 具有 OpenBKN 平台访问权限。'
    }
  }
  return '无法验证 OpenBKN 连接。请检查 Token 和平台地址后重试。'
}
