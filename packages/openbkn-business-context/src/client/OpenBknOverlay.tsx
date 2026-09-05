import { useEffect, useState } from 'react'
import type { InjectFace, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { OpenBknUiController, OpenBknOverlayState } from './openbkn-ui-controller.ts'

export interface OpenBknOverlayInjected {
  hooks: { ui: OpenBknUiController }
  close(): void
  refresh(): Promise<void>
  configureToken(token: string): Promise<void>
  openNetwork(networkId: string, mode: 'continue' | 'new' | 'create-workspace'): Promise<void>
}

export type OpenBknOverlayProps = PropsRuntime<'shell.overlay'> & InjectFace<OpenBknOverlayInjected>

/** Frame-wide, additive OpenBKN control plane. It is intentionally outside DSH chat scroll containers. */
export function OpenBknOverlay({ useUi, close, refresh, configureToken, openNetwork }: OpenBknOverlayProps) {
  const state = useUi((value: OpenBknOverlayState) => value)

  useEffect(() => {
    if (state.open && state.phase === 'idle') void refresh()
  }, [refresh, state.open, state.phase])

  if (!state.open) return null

  return (
    <div style={backdropStyle} role="presentation" onMouseDown={close}>
      <section
        role="dialog"
        aria-modal="true"
        aria-label="OpenBKN business knowledge networks"
        style={dialogStyle}
        onMouseDown={event => event.stopPropagation()}
      >
        <header style={headerStyle}>
          <div>
            <div style={eyebrowStyle}>OPENBKN</div>
            <h2 style={{ margin: '4px 0 0', fontSize: 20 }}>业务知识网络</h2>
          </div>
          <button type="button" onClick={close} aria-label="Close" style={closeStyle}>×</button>
        </header>
        <div style={{ padding: 20 }}>
          <OverlayBody state={state} configureToken={configureToken} refresh={refresh} openNetwork={openNetwork} />
        </div>
      </section>
    </div>
  )
}

function OverlayBody({ state, configureToken, refresh, openNetwork }: {
  state: OpenBknOverlayState
  configureToken(token: string): Promise<void>
  refresh(): Promise<void>
  openNetwork(networkId: string, mode: 'continue' | 'new' | 'create-workspace'): Promise<void>
}) {
  if (state.phase === 'loading' || state.phase === 'binding') {
    return <p style={mutedStyle}>{state.phase === 'binding' ? '正在绑定当前会话…' : '正在连接 OpenBKN…'}</p>
  }

  if (state.phase === 'authentication-required') {
    return (
      <div>
        <p style={{ marginTop: 0, lineHeight: 1.6 }}>输入 OpenBKN 访问 Token。Token 只保存在本机 DSH 凭据存储中，用于自动连接 Context Loader MCP；保存后会立即测试连接并加载可访问网络。</p>
        <p style={{ ...mutedStyle, marginTop: 0 }}>平台地址：{displayBaseUrl(state.auth)}</p>
        <TokenForm configureToken={configureToken} />
        <button type="button" style={secondaryStyle} onClick={() => void refresh()}>刷新状态</button>
      </div>
    )
  }

  if (state.phase === 'error') {
    return <div><p style={{ marginTop: 0, lineHeight: 1.6 }}>{state.message}</p><button type="button" style={primaryStyle} onClick={() => void refresh()}>重试</button></div>
  }

  return (
    <div>
      <p style={{ marginTop: 0, ...mutedStyle }}>
        选择业务知识网络后，在其专属 DSH 工作区中继续或创建会话。
      </p>
      {state.networks.length === 0 ? <p style={mutedStyle}>当前账号没有可用的业务知识网络。</p> : null}
      <div style={{ display: 'grid', gap: 10 }}>
        {state.networks.map(network => (
          <article key={network.id} style={networkStyle}>
            <strong>{network.displayName}</strong>
            {network.description ? <span style={mutedStyle}>{network.description}</span> : null}
            {network.workspacePath
              ? <><span style={workspaceStyle}>已关联工作区 · {network.workspacePath}</span><span style={actionsStyle}>
                <button type="button" style={secondaryStyle} onClick={() => void openNetwork(network.id, 'continue')}>继续会话</button>
                <button type="button" style={primaryStyle} onClick={() => void openNetwork(network.id, 'new')}>新建会话</button>
              </span></>
              : <><span style={workspaceStyle}>尚未关联本地工作区</span><span style={actionsStyle}>
                <button type="button" style={primaryStyle} onClick={() => void openNetwork(network.id, 'create-workspace')}>新建工作区</button>
              </span></>}
          </article>
        ))}
      </div>
    </div>
  )
}

function TokenForm({ configureToken }: { configureToken(token: string): Promise<void> }) {
  const [token, setToken] = useState('')
  return <form onSubmit={event => { event.preventDefault(); void configureToken(token).finally(() => setToken('')) }} style={{ display: 'grid', gap: 10, marginBottom: 10 }}>
    <label style={{ display: 'grid', gap: 6, fontSize: 13, fontWeight: 650 }}>
      OpenBKN Token
      <input aria-label="OpenBKN Token" type="password" autoComplete="off" value={token} onChange={event => setToken(event.target.value)} style={tokenStyle} />
    </label>
    <span><button type="submit" style={primaryStyle} disabled={token.trim().length === 0}>保存并测试连接</button></span>
  </form>
}

function displayBaseUrl(auth: OpenBknOverlayState['auth']): string {
  if (auth?.kind === 'platform-mismatch') return auth.expectedBaseUrl
  return auth?.baseUrl ?? '—'
}

const backdropStyle = { pointerEvents: 'auto' as const, position: 'fixed' as const, inset: 0, display: 'grid', placeItems: 'center', background: 'rgb(15 23 42 / 38%)', padding: 20 }
const dialogStyle = { width: 'min(560px, 100%)', maxHeight: 'min(720px, calc(100vh - 40px))', overflow: 'auto' as const, borderRadius: 16, background: '#fff', boxShadow: '0 24px 70px rgb(15 23 42 / 28%)', color: '#172033' }
const headerStyle = { display: 'flex', alignItems: 'start', justifyContent: 'space-between', padding: '20px 20px 16px', borderBottom: '1px solid #e6eaf0' }
const eyebrowStyle = { color: '#078b7f', fontSize: 12, fontWeight: 750, letterSpacing: '0.12em' }
const closeStyle = { border: '1px solid #d9e0ea', borderRadius: 9, width: 34, height: 34, background: '#fff', fontSize: 24, lineHeight: 1, cursor: 'pointer' }
const primaryStyle = { border: 0, borderRadius: 9, background: '#078b7f', color: '#fff', fontWeight: 650, padding: '10px 14px', cursor: 'pointer' }
const secondaryStyle = { ...primaryStyle, background: '#eef5f5', color: '#087d72' }
const mutedStyle = { color: '#64748b', fontSize: 14 }
const networkStyle = { textAlign: 'left' as const, display: 'grid', gap: 8, padding: 14, border: '1px solid #d9e4e8', borderRadius: 12, background: '#fff', color: '#172033' }
const workspaceStyle = { color: '#64748b', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }
const actionsStyle = { display: 'flex', gap: 8, justifyContent: 'flex-end' }
const tokenStyle = { border: '1px solid #cbd5e1', borderRadius: 8, padding: '9px 10px', font: 'inherit' }
