import type { DiagnosticsReport } from '../diagnostics-contract.ts'

/** Minimal browser port over the generated diagnostics Remote contract. */
export interface DiagnosticsUiPort {
  getReport(signal?: AbortSignal): Promise<DiagnosticsReport>
}

/** Render phases of the diagnostics panel. */
export type DiagnosticsPanelPhase = 'idle' | 'loading' | 'ready' | 'unavailable'

/** Render state for the diagnostics panel; only whitelisted report data enters it. */
export interface DiagnosticsPanelState {
  readonly open: boolean
  readonly phase: DiagnosticsPanelPhase
  readonly report?: DiagnosticsReport
  /** Bounded, non-sensitive note when the diagnostics service itself is unreachable. */
  readonly message?: string
}

type Listener = () => void

/**
 * Controller for the diagnostics panel. Registration never waits for the
 * business Remote: the panel is the fallback surface when the business side
 * fails, so it depends on nothing but the diagnostics namespace and the slot
 * registry. D2 adds retest/cancel; the initial slice only reads a report.
 */
export class DiagnosticsPanelController {
  private state: DiagnosticsPanelState = { open: false, phase: 'idle' }
  private readonly listeners = new Set<Listener>()
  private loadEpoch = 0

  constructor(private readonly port: DiagnosticsUiPort) {}

  snapshot(): DiagnosticsPanelState {
    return this.state
  }

  /** Slot-renderer observable contract. */
  getSnapshot(): DiagnosticsPanelState {
    return this.state
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private update(patch: Partial<DiagnosticsPanelState>): void {
    this.state = { ...this.state, ...patch }
    for (const listener of [...this.listeners]) listener()
  }

  open(): void {
    this.update({ open: true })
    void this.load()
  }

  close(): void {
    this.update({ open: false })
  }

  /** Fetch one passive report; a later open never shows a stale in-flight result. */
  async load(): Promise<void> {
    const epoch = ++this.loadEpoch
    this.update({ phase: 'loading' })
    try {
      const report = await this.port.getReport()
      if (epoch !== this.loadEpoch) return
      this.update({ phase: 'ready', report, message: undefined })
    } catch (error) {
      if (epoch !== this.loadEpoch) return
      // The diagnostics namespace itself is gone (its entry failed, or the
      // Host restarted): degrade explicitly instead of guessing a cause.
      this.update({ phase: 'unavailable', report: undefined, message: describeUnavailable(error) })
    }
  }

  /** Re-read the report on demand. */
  refresh(): Promise<void> {
    return this.load()
  }
}

/** Classify transport failures into one bounded, non-sensitive sentence. */
function describeUnavailable(error: unknown): string {
  const code = (error as { code?: unknown } | null)?.code
  if (typeof code === 'string' && code.includes('no active Connection')) {
    return '无法连接 DSH Host；请确认 DSH 正在运行后重试。'
  }
  return '诊断服务不可用（诊断入口未随插件启动或连接中断）。请截图或复制此提示发给支持人员。'
}
