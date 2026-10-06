import { useEffect } from 'react'
import type { InjectFace, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { DiagnosticsPanelController, DiagnosticsPanelState } from './diagnostics-controller.ts'
import { exportDiagnosticsReport } from './diagnostics-export.ts'
import type { DiagnosticsCheck, DiagnosticsReport } from '../diagnostics-contract.ts'

export interface OpenBknDiagnosticsInjected {
  hooks: { diagnostics: DiagnosticsPanelController }
  open(): void
  close(): void
  refresh(): Promise<void>
}

export type OpenBknDiagnosticsProps = PropsRuntime<'shell.overlay'> & InjectFace<OpenBknDiagnosticsInjected>

/**
 * Standalone diagnostics surface. Registered by the diagnostics injection
 * segment, never by the business one, so it stays reachable exactly when the
 * business panel is not.
 */
export function OpenBknDiagnostics({ useDiagnostics, close, refresh }: OpenBknDiagnosticsProps) {
  const state = useDiagnostics((value: DiagnosticsPanelState) => value)

  useEffect(() => {
    if (state.open && state.phase === 'idle') void refresh()
  }, [refresh, state.open, state.phase])

  if (!state.open) return null

  return (
    <div style={backdropStyle} role="presentation" onMouseDown={close}>
      <section
        role="dialog"
        aria-modal="true"
        aria-label="OpenBKN 诊断"
        style={dialogStyle}
        onMouseDown={event => event.stopPropagation()}
      >
        <header style={headerStyle}>
          <div>
            <div style={eyebrowStyle}>OPENBKN</div>
            <h2 style={{ margin: '4px 0 0', fontSize: 20 }}>诊断</h2>
          </div>
          <button type="button" onClick={close} aria-label="Close" style={closeStyle}>×</button>
        </header>
        <div style={{ padding: 20, overflowY: 'auto' }}>
          <DiagnosticsBody state={state} refresh={refresh} />
        </div>
      </section>
    </div>
  )
}

function DiagnosticsBody({ state, refresh }: { state: DiagnosticsPanelState; refresh(): Promise<void> }) {
  if (state.phase === 'loading' || state.phase === 'idle') {
    return <p style={mutedStyle}>正在读取诊断信息…</p>
  }
  if (state.phase === 'unavailable' || state.report === undefined) {
    return (
      <div>
        <p style={{ marginTop: 0, lineHeight: 1.6 }}>{state.message ?? '诊断服务不可用。'}</p>
        <p style={mutedStyle}>诊断入口未随插件启动或连接已中断。请截图或复制此提示发给支持人员。</p>
        <button type="button" style={buttonStyle} onClick={() => void refresh()}>重试</button>
      </div>
    )
  }
  const report = state.report
  return (
    <div>
      <p style={{ marginTop: 0, color: '#4b5563', fontSize: 13 }}>
        报告编号 {report.reportId} · 生成于 {new Date(report.createdAt).toLocaleString()} · 模式 {report.mode === 'passive' ? '被动采集' : '主动复测'}
      </p>
      <TargetSummary report={report} />
      <CheckList checks={report.checks} />
      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <button
          type="button"
          style={buttonStyle}
          onClick={() => exportDiagnosticsReport(report)}
        >
          导出诊断报告
        </button>
        <button type="button" style={secondaryButtonStyle} onClick={() => void refresh()}>重新采集</button>
      </div>
    </div>
  )
}

function TargetSummary({ report }: { report: DiagnosticsReport }) {
  const target = report.target
  const row = (label: string, value: string) => (
    <div key={label} style={{ display: 'flex', gap: 8, fontSize: 13 }}>
      <span style={{ minWidth: 96, color: '#6b7280' }}>{label}</span>
      <span>{value}</span>
    </div>
  )
  return (
    <section style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: '10px 12px', marginBottom: 12 }}>
      {row('Host 形态', target.hostForm)}
      {row('平台', target.platform ?? '未知')}
      {row('DSH 版本', target.dshVersion ?? '未知')}
      {row('插件（磁盘）', target.pluginDiskVersion ?? '未知')}
      {row('插件（已加载）', target.pluginLoadedVersion ?? '未知')}
    </section>
  )
}

function CheckList({ checks }: { checks: readonly DiagnosticsCheck[] }) {
  if (checks.length === 0) {
    return <p style={mutedStyle}>本次未执行任何检查。</p>
  }
  return (
    <section style={{ border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
      {checks.map((check, index) => <CheckRow key={check.id} check={check} zebra={index % 2 === 1} />)}
    </section>
  )
}

const STATUS_LABEL: Record<string, string> = {
  pass: '通过', fail: '失败', 'not-run': '未执行', 'insufficient-evidence': '证据不足',
}

const STATUS_COLOR: Record<string, string> = {
  pass: '#047857', fail: '#b91c1c', 'not-run': '#6b7280', 'insufficient-evidence': '#92400e',
}

function CheckRow({ check, zebra }: { check: DiagnosticsCheck; zebra: boolean }) {
  const evidence = Object.entries(check.evidence)
  return (
    <div style={{ padding: '10px 12px', background: zebra ? '#f9fafb' : '#fff', borderBottom: '1px solid #e5e7eb' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 12, color: STATUS_COLOR[check.status] ?? '#374151', fontWeight: 650 }}>
          ● {STATUS_LABEL[check.status] ?? check.status}
        </span>
        <span style={{ fontSize: 13, fontWeight: 600 }}>{check.id}</span>
        <span style={{ fontSize: 12, color: '#6b7280' }}>{check.stage} / {check.code}</span>
      </div>
      {evidence.length > 0 ? (
        <div style={{ marginTop: 4, fontSize: 12, color: '#6b7280', fontFamily: 'ui-monospace, monospace' }}>
          {evidence.map(([key, value]) => `${key}=${value === null ? 'null' : String(value)}`).join('  ')}
        </div>
      ) : null}
      {check.nextAction !== null ? (
        <div style={{ marginTop: 4, fontSize: 12, color: '#374151', lineHeight: 1.5 }}>{check.nextAction}</div>
      ) : null}
    </div>
  )
}

const backdropStyle: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60,
}

const dialogStyle: React.CSSProperties = {
  width: 'min(680px, calc(100vw - 48px))', maxHeight: 'min(78vh, 720px)',
  display: 'flex', flexDirection: 'column', background: '#fff',
  borderRadius: 16, boxShadow: '0 24px 64px rgba(15,23,42,0.35)',
}

const headerStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
  padding: '16px 20px 12px', borderBottom: '1px solid #e5e7eb',
}

const eyebrowStyle: React.CSSProperties = { fontSize: 11, letterSpacing: 2, color: '#0891b2', fontWeight: 700 }

const closeStyle: React.CSSProperties = {
  border: 'none', background: 'transparent', fontSize: 20, lineHeight: 1,
  cursor: 'pointer', color: '#6b7280', padding: 4,
}

const mutedStyle: React.CSSProperties = { color: '#6b7280', lineHeight: 1.6 }

const buttonStyle: React.CSSProperties = {
  border: '1px solid #bfe6df', borderRadius: 8, background: '#effaf7', color: '#087d72',
  fontWeight: 650, padding: '8px 14px', cursor: 'pointer',
}

const secondaryButtonStyle: React.CSSProperties = {
  ...buttonStyle, background: '#fff', color: '#374151', borderColor: '#d1d5db',
}
