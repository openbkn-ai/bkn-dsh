import { useOpenBknTranslation } from './locale.tsx'
import { translateChinese, renderUiMessage, type OpenBknTranslate } from './messages.ts'
import { useEffect, useMemo, useState } from 'react'
import type { InjectFace, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { OpenBknUiController, OpenBknOverlayState } from './openbkn-ui-controller.ts'
import { INITIAL_NETWORK_DIRECTORY_LIMIT, selectNetworkDirectory } from './network-directory.ts'
import type { BusinessNetworkSummary, OpenBknConfigurationInput } from '../types.ts'
import { CliSetupControl } from './CliSetupControl.tsx'
import { useDialogFocus } from './use-dialog-focus.ts'
import type { CliSetupPort } from './cli-setup-controller.ts'

export interface OpenBknOverlayInjected {
  hooks: { ui: OpenBknUiController }
  close(): void
  refresh(): Promise<void>
  cancelLogin(): void
  beginLogin(): Promise<void>
  showSettings(): Promise<void>
  saveConfiguration(input: OpenBknConfigurationInput): Promise<void>
  cliSetup: CliSetupPort
  openNetwork(networkId: string, mode: 'continue' | 'new' | 'create-workspace'): Promise<void>
  openDiagnostics(): void
}

export type OpenBknOverlayProps = PropsRuntime<'shell.overlay'> & InjectFace<OpenBknOverlayInjected>

/** Frame-wide, additive OpenBKN control plane. It is intentionally outside DSH chat scroll containers. */
export function OpenBknOverlay({ useUi, close, refresh, beginLogin, cancelLogin, showSettings, saveConfiguration, cliSetup, openNetwork, openDiagnostics }: OpenBknOverlayProps) {
  const t = useOpenBknTranslation()

  const state = useUi((value: OpenBknOverlayState) => value)
  const dialog = useDialogFocus(state.open, close)

  useEffect(() => {
    if (state.open && state.phase === 'idle') void refresh()
  }, [refresh, state.open, state.phase])

  if (!state.open) return null

  return (
    <div style={backdropStyle} role="presentation" onMouseDown={close}>
      <section
        ref={dialog}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={t('networksLabel')}
        style={dialogStyle}
        onMouseDown={event => event.stopPropagation()}
      >
        <header style={headerStyle}>
          <div>
            <div style={eyebrowStyle}>OPENBKN</div>
            <h2 style={{ margin: '4px 0 0', fontSize: 20 }}>{t('businessKnowledgeNetworks')}</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button type="button" onClick={() => void showSettings()} disabled={state.savingConfiguration || state.login === 'waiting'} style={{ ...secondaryStyle, fontSize: 13 }}>{t('settings')}</button>
            <button type="button" onClick={openDiagnostics} style={{ ...secondaryStyle, fontSize: 13 }}>{t('diagnostics')}</button>
            <button type="button" onClick={close} aria-label={t('close')} style={closeStyle}>×</button>
          </div>
        </header>
        <div style={{ padding: 20 }}>
          <OverlayBody state={state} beginLogin={beginLogin} cancelLogin={cancelLogin} saveConfiguration={saveConfiguration} cliSetup={cliSetup} refresh={refresh} openNetwork={openNetwork} />
        </div>
      </section>
    </div>
  )
}

function OverlayBody({ state, beginLogin, cancelLogin, saveConfiguration, cliSetup, refresh, openNetwork }: {
  state: OpenBknOverlayState
  cancelLogin(): void
  beginLogin(): Promise<void>
  saveConfiguration(input: OpenBknConfigurationInput): Promise<void>
  cliSetup: CliSetupPort
  refresh(): Promise<void>
  openNetwork(networkId: string, mode: 'continue' | 'new' | 'create-workspace'): Promise<void>
}) {
  const t = useOpenBknTranslation()

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

  if (state.login === 'waiting') return <div aria-live="polite" aria-busy="true">
    <p role="status" style={mutedStyle}>{t('waitingForOpenBKNCLIBrowserAuthorizationAndCredential')}</p>
    <p style={mutedStyle}>{t('completeSignInInTheBrowserCancellingOr')}</p>
    <button type="button" style={secondaryStyle} onClick={cancelLogin}>{t('cancelSignIn')}</button>
  </div>

  if (state.phase === 'loading' || state.phase === 'binding') {
    return <p style={mutedStyle}>{state.phase === 'binding' ? (state.message === undefined ? t('bindingTheCurrentConversation') : renderUiMessage(state.message, t)) : (state.message === undefined ? t('connectingToOpenBKN') : renderUiMessage(state.message, t))}</p>
  }

  if (state.phase === 'configuration') {
    return <ConfigurationForm state={state} saveConfiguration={saveConfiguration} cliSetup={cliSetup} />
  }

  if (state.phase === 'authentication-required') {
    return (
      <div>
        <p style={{ marginTop: 0, lineHeight: 1.6 }}>{t('signInWithTheLocalOpenBKNCLIThe')}</p>
        <p style={{ ...mutedStyle, marginTop: 0 }}>{t('platformURL')} {displayBaseUrl(state.auth)}</p>
        {state.login === 'timed-out' ? <p role="status" style={authenticationNoticeStyle}>{t('signInWaitTimedOutPlatformAuthorizationMay')}</p> : state.login === 'cancelled' ? <p role="status" style={authenticationNoticeStyle}>{t('signInWaitCancelledSignInAgainOr')}</p> : null}
        {state.message ? <p role="status" style={authenticationNoticeStyle}>{renderUiMessage(state.message, t)}</p> : null}
        <p style={{ margin: '0 0 12px' }}><button type="button" style={primaryStyle} onClick={() => void beginLogin()}>{t('signInAndSyncWithOpenBKNCLI')}</button></p>
        <button type="button" style={secondaryStyle} onClick={() => void refresh()}>{t('refreshStatus')}</button>
      </div>
    )
  }

  if (state.phase === 'error') {
    return (
      <div>
        <p style={{ marginTop: 0, lineHeight: 1.6 }}>{renderUiMessage(state.message, t)}</p>
        <div style={{ display: 'flex', gap: 8 }}>
          {state.login === 'failed' ? <button type="button" style={primaryStyle} onClick={() => void beginLogin()}>{t('retrySignIn')}</button> : null}
          <button type="button" style={secondaryStyle} onClick={() => void refresh()}>{t('retry')}</button>
        </div>
      </div>
    )
  }

  return (
    <div>
      {state.login === 'succeeded' ? <p role="status" style={mutedStyle}>{t('signInAndSynchronizationSucceeded')}</p> : null}
      <p style={{ marginTop: 0, ...mutedStyle }}>
        {t('chooseABusinessKnowledgeNetworkToContinueOr')}{' '}<strong>{t('standardMode')}</strong>{t('selectItInTheModeMenuBeforeSending')}</p>
      {state.networks.length === 0 ? <p style={mutedStyle}>{t('noBusinessKnowledgeNetworksAreAvailableForThis')}</p> : <>
        <label style={searchLabelStyle}>
          {t('searchBusinessKnowledgeNetworks')}<input
            aria-label={t('searchBusinessKnowledgeNetworks')}
            type="search"
            value={query}
            onChange={event => { setQuery(event.target.value); setLimit(INITIAL_NETWORK_DIRECTORY_LIMIT); setSelectedNetworkId(undefined) }}
            placeholder={t('nameIDOrDescription')}
            style={searchInputStyle}
          />
        </label>
        <p style={{ margin: '10px 0', ...mutedStyle }}>{t('networkCount', { count: directory.total })}</p>
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
      {directory.total > 0 && directory.networks.length === 0 ? <p style={mutedStyle}>{t('noMatchingBusinessKnowledgeNetworks')}</p> : null}
      {directory.hasMore ? <p style={{ margin: '12px 0 0' }}><button type="button" style={secondaryStyle} onClick={() => setLimit(current => current + INITIAL_NETWORK_DIRECTORY_LIMIT)}>{t('loadMore')}</button></p> : null}
    </div>
  )
}

function NetworkRow({ network, expanded, onToggle, openNetwork }: {
  network: BusinessNetworkSummary
  expanded: boolean
  onToggle(): void
  openNetwork(networkId: string, mode: 'continue' | 'new' | 'create-workspace'): Promise<void>
}) {
  const t = useOpenBknTranslation()

  return <article style={networkStyle}>
    <div style={networkSummaryStyle}>
      <div><strong>{network.displayName}</strong><div style={networkIdStyle}>{network.id}</div></div>
      <button type="button" style={secondaryStyle} aria-expanded={expanded} onClick={onToggle}>{expanded ? t('collapse') : t('view')}</button>
    </div>
    <span style={workspaceStyle}>{network.workspacePath ? t('workspaceLinked', { p0: network.workspacePath }) : t('noLocalWorkspaceLinked')}</span>
    {expanded ? <>
      {network.description ? <span style={descriptionStyle}>{network.description}</span> : null}
      {network.workspacePath
        ? <span style={actionsStyle}>
          <button type="button" style={secondaryStyle} onClick={() => void openNetwork(network.id, 'continue')}>{t('continueConversation')}</button>
          <button type="button" style={primaryStyle} onClick={() => void openNetwork(network.id, 'new')}>{t('newConversation')}</button>
        </span>
        : <span style={actionsStyle}><button type="button" style={primaryStyle} onClick={() => void openNetwork(network.id, 'create-workspace')}>{t('newWorkspace')}</button></span>}
    </> : null}
  </article>
}

function ConfigurationForm({ state, saveConfiguration, cliSetup }: {
  state: OpenBknOverlayState
  saveConfiguration(input: OpenBknConfigurationInput): Promise<void>
  cliSetup: CliSetupPort
}) {
  const t = useOpenBknTranslation()

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
      {state.configuration?.configured ? t('editOpenBKNSettingsForTheCurrentDSHProfile') : t('enterTheOpenBKNPlatformURLThenSignIn')}
    </p>
    <label style={searchLabelStyle}>
      {t('openBKNPlatformURL')}<input aria-label={t('openBKNPlatformURL')} type="text" inputMode="url" autoComplete="url" placeholder="https://openbkn.example.com" value={baseUrl} onChange={event => setBaseUrl(event.target.value)} disabled={!editable || saving} style={searchInputStyle} />
    </label>
    <details open={advanced} onToggle={event => setAdvanced(event.currentTarget.open)}>
      <summary style={loginLinkStyle}>{t('advancedSettings')}</summary>
      <label style={{ ...searchLabelStyle, marginTop: 10 }}>
        {t('openBKNCLIExecutablePathCliPath')}<input aria-label={t('openBKNCLIExecutablePath')} type="text" autoComplete="off" value={cliPath} onChange={event => setCliPath(event.target.value)} disabled={!editable || saving || cliSetupPending} style={searchInputStyle} />
      </label>
      <p style={{ ...mutedStyle, marginBottom: 0 }}>{t('theDefaultIsOpenbknIfDSHCannotFind')}</p>
      {advanced ? <CliSetupControl cliPath={cliPath} savedCliPath={state.configuration?.cliPath ?? 'openbkn'} disabled={!editable || saving} port={cliSetup} onResolved={setCliPath} onBusy={(busy, lockPath) => { setCliBusy(busy); setCliSetupPending(lockPath) }} /> : null}
    </details>
    {!editable && state.configuration !== undefined && state.loadingConfiguration !== true ? <p role="status" style={authenticationNoticeStyle}>{configurationUnavailableMessage(state.configuration.unavailableReason, t)}</p> : null}
    {state.loadingConfiguration ? <p style={mutedStyle}>{t('readingSettings')}</p> : null}
    {state.configurationMessage ? <p role="status" style={authenticationNoticeStyle}>{renderUiMessage(state.configurationMessage, t)}</p> : null}
    <div><button type="submit" style={primaryStyle} disabled={!editable || saving || cliBusy}>{saving ? t('saving') : t('saveAndContinue')}</button></div>
  </form>
}

function configurationUnavailableMessage(reason?: string, t: OpenBknTranslate = translateChinese): string {
  return reason === 'business-busy' || reason === 'busy'
    ? t('aBusinessTurnIsStillRunningReopenSettings')
    : t('thisConfigurationCannotBeEditedCheckForDisabled')
}

function displayBaseUrl(auth: OpenBknOverlayState['auth']): string {
  if (auth?.kind === 'platform-mismatch') return auth.expectedBaseUrl
  return auth?.baseUrl ?? '—'
}

const backdropStyle = { pointerEvents: 'auto' as const, position: 'fixed' as const, inset: 0, display: 'grid', placeItems: 'center', background: 'rgb(15 23 42 / 38%)', padding: 20 }
const dialogStyle = { width: 'min(560px, 100%)', maxHeight: 'min(720px, calc(100vh - 40px))', overflow: 'auto' as const, borderRadius: 16, background: '#fff', boxShadow: '0 24px 70px rgb(15 23 42 / 28%)', color: '#172033' }
const headerStyle = { display: 'flex', alignItems: 'start', justifyContent: 'space-between', padding: '20px 20px 16px', borderBottom: '1px solid #e6eaf0' }
const eyebrowStyle = { color: '#087d72', fontSize: 12, fontWeight: 750, letterSpacing: '0.12em' }
const closeStyle = { border: '1px solid #d9e0ea', borderRadius: 9, width: 34, height: 34, background: '#fff', color: '#374151', fontSize: 24, lineHeight: 1, cursor: 'pointer' }
const primaryStyle = { border: 0, borderRadius: 9, background: '#087d72', color: '#fff', fontWeight: 650, padding: '10px 14px', cursor: 'pointer' }
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
