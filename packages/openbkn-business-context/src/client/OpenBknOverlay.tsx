import { useEffect, useMemo, useState } from 'react'
import type { InjectFace, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { OpenBknUiController, OpenBknOverlayState } from './openbkn-ui-controller.ts'
import { INITIAL_NETWORK_DIRECTORY_LIMIT, selectNetworkDirectory } from './network-directory.ts'
import type { BusinessNetworkSummary, OpenBknConfigurationInput } from '../types.ts'
import { CliSetupControl } from './CliSetupControl.tsx'
import type { CliSetupPort } from './cli-setup-controller.ts'

export interface OpenBknOverlayInjected {
  hooks: { ui: OpenBknUiController }
  close(): void
  refresh(): Promise<void>
  beginLogin(): Promise<void>
  showSettings(): Promise<void>
  saveConfiguration(input: OpenBknConfigurationInput): Promise<void>
  cliSetup: CliSetupPort
  openNetwork(networkId: string, mode: 'continue' | 'new' | 'create-workspace'): Promise<void>
  openDiagnostics(): void
}

export type OpenBknOverlayProps = PropsRuntime<'shell.overlay'> & InjectFace<OpenBknOverlayInjected>

/** Frame-wide, additive OpenBKN control plane. It is intentionally outside DSH chat scroll containers. */
export function OpenBknOverlay({ useUi, close, refresh, beginLogin, showSettings, saveConfiguration, cliSetup, openNetwork, openDiagnostics }: OpenBknOverlayProps) {
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button type="button" onClick={() => void showSettings()} disabled={state.savingConfiguration} style={{ ...secondaryStyle, fontSize: 13 }}>设置</button>
            <button type="button" onClick={openDiagnostics} style={{ ...secondaryStyle, fontSize: 13 }}>诊断</button>
            <button type="button" onClick={close} aria-label="Close" style={closeStyle}>×</button>
          </div>
        </header>
        <div style={{ padding: 20 }}>
          <OverlayBody state={state} beginLogin={beginLogin} saveConfiguration={saveConfiguration} cliSetup={cliSetup} refresh={refresh} openNetwork={openNetwork} />
        </div>
      </section>
    </div>
  )
}

function OverlayBody({ state, beginLogin, saveConfiguration, cliSetup, refresh, openNetwork }: {
  state: OpenBknOverlayState
  beginLogin(): Promise<void>
  saveConfiguration(input: OpenBknConfigurationInput): Promise<void>
  cliSetup: CliSetupPort
  refresh(): Promise<void>
  openNetwork(networkId: string, mode: 'continue' | 'new' | 'create-workspace'): Promise<void>
}) {
  const [query, setQuery] = useState('')
  const [limit, setLimit] = useState(INITIAL_NETWORK_DIRECTORY_LIMIT)
  const [selectedNetworkId, setSelectedNetworkId] = useState<string | undefined>()
  useEffect(() => {
    setQuery('')
    setLimit(INITIAL_NETWORK_DIRECTORY_LIMIT)
    setSelectedNetworkId(undefined)
  }, [state.networks])
  const directory = useMemo(
    () => selectNetworkDirectory(state.networks, query, limit),
    [state.networks, query, limit],
  )

  if (state.phase === 'loading' || state.phase === 'binding') {
    return <p style={mutedStyle}>{state.phase === 'binding' ? state.message ?? '正在绑定当前会话…' : state.message ?? '正在连接 OpenBKN…'}</p>
  }

  if (state.phase === 'configuration') {
    return <ConfigurationForm state={state} saveConfiguration={saveConfiguration} cliSetup={cliSetup} />
  }

  if (state.phase === 'authentication-required') {
    return (
      <div>
        <p style={{ marginTop: 0, lineHeight: 1.6 }}>使用本机 OpenBKN CLI 登录。登录完成后，插件会在 Host 内同步凭据、连接 Context Loader MCP，并加载你有权限访问的业务知识网络。</p>
        <p style={{ ...mutedStyle, marginTop: 0 }}>平台地址：{displayBaseUrl(state.auth)}</p>
        {state.message ? <p role="status" style={authenticationNoticeStyle}>{state.message}</p> : null}
        <p style={{ margin: '0 0 12px' }}><button type="button" style={primaryStyle} onClick={() => void beginLogin()}>使用 OpenBKN CLI 登录并同步</button></p>
        <button type="button" style={secondaryStyle} onClick={() => void refresh()}>刷新状态</button>
      </div>
    )
  }

  if (state.phase === 'error') {
    return (
      <div>
        <p style={{ marginTop: 0, lineHeight: 1.6 }}>{state.message}</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" style={primaryStyle} onClick={() => void refresh()}>重试</button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <p style={{ marginTop: 0, ...mutedStyle }}>
        选择业务知识网络后，在其专属 DSH 工作区中继续或创建会话。
        业务会话需使用<strong>标准模式</strong>：请在发送第一条消息前，在模式菜单中选定（暂不支持 PTC 模式，已有的 PTC 会话无法切换）。
      </p>
      {state.networks.length === 0 ? <p style={mutedStyle}>当前账号没有可用的业务知识网络。</p> : <>
        <label style={searchLabelStyle}>
          搜索业务知识网络
          <input
            aria-label="搜索业务知识网络"
            type="search"
            value={query}
            onChange={event => { setQuery(event.target.value); setLimit(INITIAL_NETWORK_DIRECTORY_LIMIT); setSelectedNetworkId(undefined) }}
            placeholder="名称、ID 或说明"
            style={searchInputStyle}
          />
        </label>
        <p style={{ margin: '10px 0', ...mutedStyle }}>找到 {directory.total} 个网络；已关联本地工作区的网络优先显示。</p>
      </>}
      <div style={{ display: 'grid', gap: 10 }}>
        {directory.networks.map(network => <NetworkRow
          key={network.id}
          network={network}
          expanded={selectedNetworkId === network.id}
          onToggle={() => setSelectedNetworkId(current => current === network.id ? undefined : network.id)}
          openNetwork={openNetwork}
        />)}
      </div>
      {directory.total > 0 && directory.networks.length === 0 ? <p style={mutedStyle}>没有匹配的业务知识网络。</p> : null}
      {directory.hasMore ? <p style={{ margin: '12px 0 0' }}><button type="button" style={secondaryStyle} onClick={() => setLimit(current => current + INITIAL_NETWORK_DIRECTORY_LIMIT)}>加载更多</button></p> : null}
    </div>
  )
}

function NetworkRow({ network, expanded, onToggle, openNetwork }: {
  network: BusinessNetworkSummary
  expanded: boolean
  onToggle(): void
  openNetwork(networkId: string, mode: 'continue' | 'new' | 'create-workspace'): Promise<void>
}) {
  return <article style={networkStyle}>
    <div style={networkSummaryStyle}>
      <div><strong>{network.displayName}</strong><div style={networkIdStyle}>{network.id}</div></div>
      <button type="button" style={secondaryStyle} aria-expanded={expanded} onClick={onToggle}>{expanded ? '收起' : '查看'}</button>
    </div>
    <span style={workspaceStyle}>{network.workspacePath ? `已关联工作区 · ${network.workspacePath}` : '尚未关联本地工作区'}</span>
    {expanded ? <>
      {network.description ? <span style={descriptionStyle}>{network.description}</span> : null}
      {network.workspacePath
        ? <span style={actionsStyle}>
          <button type="button" style={secondaryStyle} onClick={() => void openNetwork(network.id, 'continue')}>继续会话</button>
          <button type="button" style={primaryStyle} onClick={() => void openNetwork(network.id, 'new')}>新建会话</button>
        </span>
        : <span style={actionsStyle}><button type="button" style={primaryStyle} onClick={() => void openNetwork(network.id, 'create-workspace')}>新建工作区</button></span>}
    </> : null}
  </article>
}

function ConfigurationForm({ state, saveConfiguration, cliSetup }: {
  state: OpenBknOverlayState
  saveConfiguration(input: OpenBknConfigurationInput): Promise<void>
  cliSetup: CliSetupPort
}) {
  const [baseUrl, setBaseUrl] = useState(state.configuration?.baseUrl ?? '')
  const [cliPath, setCliPath] = useState(state.configuration?.cliPath ?? 'openbkn')
  const [advanced, setAdvanced] = useState(false)
  const [cliBusy, setCliBusy] = useState(false)
  const [cliSetupPending, setCliSetupPending] = useState(false)
  useEffect(() => {
    if (state.configuration === undefined) return
    setBaseUrl(state.configuration.baseUrl)
    setCliPath(state.configuration.cliPath)
  }, [state.configuration])
  const editable = state.configuration?.editable === true && state.loadingConfiguration !== true
  const saving = state.savingConfiguration === true
  return <form onSubmit={event => { event.preventDefault(); if (!cliBusy) void saveConfiguration({ baseUrl, cliPath }) }} style={{ display: 'grid', gap: 14 }}>
    <p style={{ margin: 0, ...mutedStyle, lineHeight: 1.6 }}>
      {state.configuration?.configured ? '修改当前 DSH profile 的 OpenBKN 设置。已有业务会话保持原平台和网络绑定。' : '先填写 OpenBKN 平台地址，再使用本机 OpenBKN CLI 登录。尚未配置时不会连接平台。'}
    </p>
    <label style={searchLabelStyle}>
      OpenBKN 平台地址
      <input aria-label="OpenBKN 平台地址" type="text" inputMode="url" autoComplete="url" placeholder="https://openbkn.example.com" value={baseUrl} onChange={event => setBaseUrl(event.target.value)} disabled={!editable || saving} style={searchInputStyle} />
    </label>
    <details open={advanced} onToggle={event => setAdvanced(event.currentTarget.open)}>
      <summary style={loginLinkStyle}>高级设置</summary>
      <label style={{ ...searchLabelStyle, marginTop: 10 }}>
        OpenBKN CLI 执行路径（cliPath）
        <input aria-label="OpenBKN CLI 执行路径" type="text" autoComplete="off" value={cliPath} onChange={event => setCliPath(event.target.value)} disabled={!editable || saving || cliSetupPending} style={searchInputStyle} />
      </label>
      <p style={{ ...mutedStyle, marginBottom: 0 }}>默认 openbkn。若 DSH 找不到命令，可填写绝对路径；Windows 上填写 openbkn.cmd。</p>
      {advanced ? <CliSetupControl cliPath={cliPath} disabled={!editable || saving} port={cliSetup} onResolved={setCliPath} onBusy={(busy, lockPath) => { setCliBusy(busy); setCliSetupPending(lockPath) }} /> : null}
    </details>
    {!editable && state.configuration !== undefined && state.loadingConfiguration !== true ? <p role="status" style={authenticationNoticeStyle}>{configurationUnavailableMessage(state.configuration.unavailableReason)}</p> : null}
    {state.loadingConfiguration ? <p style={mutedStyle}>正在读取设置…</p> : null}
    {state.configurationMessage ? <p role="status" style={authenticationNoticeStyle}>{state.configurationMessage}</p> : null}
    <div><button type="submit" style={primaryStyle} disabled={!editable || saving || cliBusy}>{saving ? '正在保存…' : '保存并继续'}</button></div>
  </form>
}

function configurationUnavailableMessage(reason?: string): string {
  return reason === 'business-busy' || reason === 'busy'
    ? '业务回合仍在运行，请等回合结束后重新打开设置。'
    : '当前无法修改此配置，请检查插件条目是否已启用、是否有重复条目或更高层覆盖。诊断仍可查看。'
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
const networkSummaryStyle = { display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }
const networkIdStyle = { color: '#64748b', fontSize: 12, marginTop: 2, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }
const workspaceStyle = { color: '#64748b', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }
const descriptionStyle = { color: '#64748b', fontSize: 14, lineHeight: 1.55 }
const actionsStyle = { display: 'flex', gap: 8, justifyContent: 'flex-end' }
const searchLabelStyle = { display: 'grid', gap: 6, fontSize: 13, fontWeight: 650 }
const searchInputStyle = { border: '1px solid #cbd5e1', borderRadius: 8, padding: '9px 10px', font: 'inherit' }
const loginLinkStyle = { color: '#087d72', fontSize: 14, fontWeight: 650 }
const authenticationNoticeStyle = { margin: '0 0 12px', padding: '10px 12px', borderRadius: 8, background: '#fff7e8', color: '#9a6700', fontSize: 13, lineHeight: 1.55 }
