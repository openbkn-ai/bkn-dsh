import type { OpenBknCliSetupView } from '../types.ts'

export interface CliSetupPort {
  checkCli(cliPath: string, signal?: AbortSignal): Promise<OpenBknCliSetupView>
  installCli(cliPath: string): Promise<OpenBknCliSetupView>
}
export interface CliSetupState {
  readonly phase: 'idle' | 'checking' | OpenBknCliSetupView['state']
  readonly result?: OpenBknCliSetupView
  readonly setupRequested?: boolean
}

/** Read-only checks are cancellable; an accepted Host installation survives panel closure. */
export class CliSetupController {
  private state: CliSetupState = { phase: 'idle' }
  private revision = 0
  private disposed = false
  private clicking = false
  private reading?: AbortController
  private timer?: ReturnType<typeof setTimeout>
  private readonly listeners = new Set<() => void>()
  constructor(private readonly port: CliSetupPort, private readonly resolved: (path: string) => void) {}
  snapshot(): CliSetupState { return this.state }
  subscribe(listener: () => void): () => void { this.listeners.add(listener); return () => { this.listeners.delete(listener) } }

  async check(cliPath: string): Promise<void> {
    if (this.disposed || this.clicking) return
    await this.inspect(cliPath)
  }
  async detectAndInstall(cliPath: string): Promise<void> {
    if (this.disposed || this.clicking) return
    this.clicking = true
    try {
      const checked = await this.inspect(cliPath)
      if (checked === undefined || !checked.result.canInstall || !this.current(checked.revision)) return
      this.publish({ phase: 'installing' })
      // Do not pass a panel AbortSignal: npm is owned and bounded by the Host.
      const result = await this.port.installCli(cliPath)
      if (this.current(checked.revision)) this.accept(result, cliPath, checked.revision)
    } catch {
      if (!this.disposed) this.publish({ phase: 'failed', result: { state: 'failed', canInstall: false, reason: 'host-unavailable' } })
    } finally {
      this.clicking = false
      if (!this.disposed) this.publish(this.state)
    }
  }
  dispose(): void {
    this.disposed = true
    this.revision++
    this.reading?.abort()
    clearTimeout(this.timer)
    this.listeners.clear()
  }
  private async inspect(cliPath: string): Promise<{ result: OpenBknCliSetupView; revision: number } | undefined> {
    this.reading?.abort()
    clearTimeout(this.timer)
    const revision = ++this.revision
    const controller = this.reading = new AbortController()
    // Polling a Host-owned install must keep its input lock until it settles.
    if (this.state.phase !== 'installing') this.publish({ phase: 'checking' })
    try {
      const result = await this.port.checkCli(cliPath, controller.signal)
      if (!this.current(revision)) return undefined
      this.accept(result, cliPath, revision)
      return { result, revision }
    } catch {
      if (this.current(revision)) this.publish({ phase: 'failed', result: { state: 'failed', canInstall: false, reason: 'host-unavailable' } })
      return undefined
    }
  }
  private accept(result: OpenBknCliSetupView, cliPath: string, revision: number): void {
    this.publish({ phase: result.state, result })
    if (result.state === 'ready' && result.resolvedPath !== undefined && result.resolvedPath !== cliPath) this.resolved(result.resolvedPath)
    if (result.state === 'installing') this.timer = setTimeout(() => {
      if (this.current(revision)) void this.check(cliPath)
    }, 1000)
  }
  private current(revision: number): boolean { return !this.disposed && this.revision === revision }
  private publish(state: CliSetupState): void {
    this.state = { ...state, setupRequested: this.clicking }
    for (const listener of this.listeners) listener()
  }
}

/** Only controlled reasons become user-facing text; raw installer output stays on Host. */
export function cliSetupMessage(state: CliSetupState): string {
  if (state.phase === 'checking') return '正在检测 CLI…'
  if (state.phase === 'installing') return '正在安装 CLI 0.1.5 并验证是否可用…可以关闭面板，安装将在当前 DSH 中继续。'
  if (state.phase === 'ready') return `CLI ${state.result?.version ?? ''} 可用。路径已填入，请点击“保存并继续”应用。`
  if (state.phase === 'missing') return '未在当前环境和常见安装位置检测到 CLI。点击下方按钮可安装 0.1.5。'
  switch (state.result?.reason) {
    case 'custom-path-missing': return '未找到此路径。请修正路径，或改回 openbkn 后检测并安装。'
    case 'execution-failed': return '已找到 CLI，但当前 DSH 无法执行。请检查 Node.js 和路径；若刚安装，可重启 DSH 后重新检测。'
    case 'existing-installation': return 'npm 目录中已有 SDK，但 CLI 不可用。请修复现有安装；插件不会覆盖或升级它。'
    case 'npm-missing': return '当前 DSH 找不到 npm，无法自动安装。请先安装 Node.js/npm；已安装时可重启 DSH 后重新检测。'
    case 'node-unavailable': return '当前 DSH 无法使用受支持的 Node.js（22 系列需 22.19 或以上，或使用 24 及更新版本）。请检查 Node.js，或重启 DSH 后重新检测。'
    case 'prefix-unavailable': return '无法确认 npm 的安装目录。请检查本机 npm 设置后重试。'
    case 'permission-denied': return 'npm 安装目录没有写入权限。请手动安装 CLI 或修正 npm 目录后重试。'
    case 'network-failed': return 'CLI 安装遇到网络错误。请检查 npm 安装源和网络后重试。'
    case 'tls-failed': return 'CLI 安装遇到证书错误。请检查 npm 安装源的证书设置后重试。'
    case 'timeout': return 'CLI 操作超时。请检查本机安装状态和网络后重新检测。'
    case 'verification-failed': return '安装命令已完成，但当前 DSH 尚无法使用 CLI。请重启 DSH 后重新检测，或手动检查安装。'
    case 'busy': return '业务回合或设置保存仍在进行，请稍后重新检测。'
    case 'host-unavailable': return '当前无法调用 CLI 设置服务。请检查插件组件和 DSH 后重试。'
    case 'installation-failed': return 'CLI 安装未成功。请检查本机 npm 安装环境后重试，或手动安装。'
    default: return ''
  }
}
