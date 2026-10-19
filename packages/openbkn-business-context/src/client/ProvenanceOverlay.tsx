import { NativeProvenancePanel } from './NativeProvenancePanel.tsx'
import { useOpenBknTranslation } from './locale.tsx'
import { translateChinese, type OpenBknTranslate } from './messages.ts'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { HostObservable, InjectFace, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import { buildBusinessGraphModel, businessGraphGeometry } from '../business-graph-model.ts'
import { foldTimeline, type TimelineFoldGroup } from '../timeline-fold.ts'
import type { ProvenanceBusinessView, ProvenanceDegradation, ProvenanceHandle, ProvenanceTimelineNode, ProvenanceView } from '../types.ts'
import type {} from '@deepseek-ai/dsh-client-ui-layout/client'

type Tab = 'events' | 'evidence'

export interface ProvenanceOverlayState {
  readonly requestId?: number
  readonly sessionId?: string
  readonly messageId?: string
  readonly handle?: ProvenanceHandle
}

interface FocusTarget { focus(): void }

/** Global overlay state remains outside the transcript and its native scroll container. */
export class ProvenanceOverlayController implements HostObservable<ProvenanceOverlayState> {
  private state: ProvenanceOverlayState = {}
  private readonly listeners = new Set<() => void>()
  private restoreFocus: FocusTarget | undefined
  private requestId = 0

  getSnapshot = (): ProvenanceOverlayState => this.state
  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }
  open(sessionId: string, messageId: string, handle: ProvenanceHandle, restoreFocus?: FocusTarget): void {
    this.restoreFocus = restoreFocus
    this.publish({ sessionId, messageId, handle, requestId: ++this.requestId })
  }
  close(): void {
    const target = this.restoreFocus
    this.restoreFocus = undefined
    this.publish({})
    target?.focus()
  }
  private publish(state: ProvenanceOverlayState): void {
    this.state = state
    for (const listener of this.listeners) listener()
  }
}

export interface ProvenanceOverlayInjected {
  hooks: { provenanceOverlay: ProvenanceOverlayController }
  load(sessionId: string, messageId: string, signal?: AbortSignal): Promise<ProvenanceView | undefined>
  close(): void
}

export type ProvenanceOverlayProps = PropsRuntime<'shell.overlay'> & InjectFace<ProvenanceOverlayInjected>

/** Provenance detail lives in an additive shell overlay, never inline in DSH chat. */
export function ProvenanceOverlay({ useProvenanceOverlay, load, close }: ProvenanceOverlayProps) {
  const t = useOpenBknTranslation()

  const state = useProvenanceOverlay((value: ProvenanceOverlayState) => value)
  const requestKey = JSON.stringify([state.sessionId,state.messageId,state.requestId])
  const [selectedTab, setTab] = useState<Tab>('events')
  const [result, setResult] = useState<{key:string;phase:'loading'|'ready'|'failed';view?:ProvenanceView}>()
  // Ownership is checked during render: an effect cannot hide old content before its first commit.
  const current = result?.key === requestKey ? result : undefined
  const view = current?.view
  const tab = current === undefined ? 'events' : selectedTab
  const loading = current === undefined || current.phase === 'loading'
  const dialog = useRef<HTMLElement>(null)
  useEffect(() => {
    if (state.handle === undefined || state.sessionId === undefined || state.messageId === undefined) return
    let active = true
    const request = new AbortController()
    setTab('events'); setResult({key:requestKey,phase:'loading'})
    void load(state.sessionId, state.messageId, request.signal).then(next => {
      if (active) setResult({key:requestKey,phase:'ready',view:next})
    }).catch(() => {
      // Platform facts degrade inside the view; reaching here means the turn
      // record itself could not be read, which stays a whole-panel failure.
      if (active) setResult({key:requestKey,phase:'failed'})
    })
    return () => { active = false; request.abort() }
  }, [load, state.handle, state.messageId, state.sessionId, requestKey])
  useEffect(() => {
    if (state.handle === undefined) return
    dialog.current?.focus()
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') close() }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [close, state.handle, requestKey])
  if (state.handle === undefined) return null

  return <div role="presentation" onMouseDown={close} style={backdropStyle}>
    <section ref={dialog} tabIndex={-1} role="dialog" aria-modal="true" aria-label={t('provenanceLabel')} onMouseDown={event => event.stopPropagation()} style={dialogStyle}>
      <header style={headerStyle}><div><div style={eyebrowStyle}>{t('provenanceEyebrow')}</div><h2 style={{ margin: '4px 0 0', fontSize: 28 }}>{t('businessProvenance')}</h2></div><button type="button" aria-label={t('close')} onClick={close} style={closeStyle}>×</button></header>
      <nav aria-label={t('provenanceViews')} style={tabBarStyle}><TabButton active={tab === 'events'} onClick={() => setTab('events')}>{t('nativeEvents')}</TabButton><TabButton active={tab === 'evidence'} onClick={() => setTab('evidence')}>{t('evidenceChain')}</TabButton></nav>
      <main style={{ padding: 24 }}>{loading ? <Loading /> : current?.phase === 'failed' || view === undefined ? <LoadFailed /> : <>
        <NativeProvenancePanel key={requestKey} view={view} tab={tab} onTabChange={setTab} />
        <details style={{ marginTop: 24 }}><summary>{t('nativeHistoricalRecords')}</summary>
          <Execution handle={state.handle} view={view} /><BusinessGraph view={view} /><EvidenceChain view={view} />
        </details>
      </>}</main>
    </section>
  </div>
}

function Execution({ handle, view }: { handle: ProvenanceHandle; view: ProvenanceView }) {
  const t = useOpenBknTranslation()

  const operationsDegradation = view.sources.degraded.find(entry => entry.pane === 'operations')
  return <div style={{ display: 'grid', gap: 20 }}>
    <section style={summaryStyle}><Metric label="Interaction ID" value={handle.interactionId ?? t('notRecorded')} mono /><Metric label={t('executionStatus')} value={view.execution.status === '未记录' ? t('notRecorded') : view.execution.status ?? handle.status} /><Metric label={t('timelineNodes')} value={String(view.timeline.length)} /></section>
    <section style={{ display: 'grid', gap: 10 }}>
      <PaneHeading badge={<SourceBadge label={t('localSession')} mark={handle.partial ? 'partial' : undefined} />} title={t('executionTimeline')} note={t('reconstructedFromLocalSessionEventsIndependentlyOfPlatform')} />
      {view.timeline.length === 0 ? <Empty text={t('thereAreNotEnoughSessionEventsToReconstruct')} /> : <Timeline nodes={view.timeline} />}
    </section>
    <section style={{ display: 'grid', gap: 10 }}>
      <PaneHeading badge={<SourceBadge label={operationsDegradation === undefined ? t('platform') : operationsDegradation.reason === 'result-too-large' ? t('platformNotDisplayed') : t('platformUnavailable')} mark={operationsDegradation?.reason} />} title={t('platformExecutionFacts')} note={operationsDegradation === undefined ? t('operationStatusDurationAndRequestTraceReceiptReferences') : undefined} />
      {operationsDegradation !== undefined ? <DegradedPane degradation={operationsDegradation} /> : view.execution.operations.length === 0 ? <Empty text={t('noDisplayableOperationFactsWereRecordedForThis')} /> : <div style={timelineStyle}>{view.execution.operations.map((operation, index) => <article key={operation.id} style={operationStyle}><div style={timelineIndexStyle}>{String(index + 1).padStart(2, '0')}</div><div style={{ display: 'grid', gap: 7 }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}><strong>{operation.label}</strong><Status value={operation.status} /></div><span style={mutedStyle}>{[operation.protocol, operation.startedAt, operation.finishedAt].filter(Boolean).join(' · ')}</span><div style={referenceRowStyle}>{operation.requestId === undefined ? null : <Reference label="Request" value={operation.requestId} />}{operation.traceId === undefined ? null : <Reference label="Trace" value={operation.traceId} />}{operation.receiptId === undefined ? null : <Reference label="Receipt" value={operation.receiptId} />}</div></div></article>)}</div>}
    </section>
  </div>
}

function Timeline({ nodes }: { nodes: readonly ProvenanceTimelineNode[] }) {
  return <div style={timelineStyle}>{foldTimeline(nodes).map((group, index) => <TimelineRow key={group.nodes[0]?.seq ?? index} group={group} />)}</div>
}

function TimelineRow({ group }: { group: TimelineFoldGroup }) {
  const t = useOpenBknTranslation()

  const node = group.nodes[0]!
  const folded = group.nodes.length > 1
  if (node.kind === 'question' || node.kind === 'answer') {
    return <article style={{ ...timelineNodeStyle, borderStyle: 'dashed' }}>
      <span style={kindChipStyle(node.kind)}>{node.kind === 'question' ? t('question') : t('answer')}</span>
      <span style={mutedStyle}>{node.summary ?? (node.kind === 'question' ? t('questionInThisTurn') : t('answerInThisTurn'))}</span>
      <span style={durationStyle}>{formatClock(node.at)}</span>
    </article>
  }
  return <article style={timelineNodeStyle}>
    <span style={kindChipStyle(node.kind)}>{kindLabel(node.kind, t)}</span>
    <div style={{ display: 'grid', gap: 4, minWidth: 0 }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap' as const }}>
        <strong style={{ overflowWrap: 'anywhere' as const }}>{node.tool}{folded ? ` ×${group.nodes.length}` : ''}</strong>
        {node.outcome === 'error' ? <span style={{ color: '#b42318', fontSize: 13, fontWeight: 700 }}>error</span> : null}
        {node.platform === undefined ? null : <span style={referenceRowStyle}>{node.platform.operationId === undefined ? null : <Reference label="Op" value={node.platform.operationId} />}{node.platform.receiptId === undefined ? null : <Reference label="Receipt" value={node.platform.receiptId} />}{node.platform.status === undefined ? null : <Reference label="Status" value={node.platform.status} />}</span>}
      </div>
      {node.summary === undefined ? null : <span style={mutedStyle}>{node.summary}</span>}
    </div>
    <span style={durationStyle}>{node.durationMs === undefined ? t('notReturned') : formatDuration(node.durationMs)}</span>
  </article>
}

function BusinessGraph({ view }: { view: ProvenanceView }) {
  const t = useOpenBknTranslation()

  const degradation = view.sources.degraded.find(entry => entry.pane === 'business')
  if (degradation !== undefined) return <DegradedPane degradation={degradation} />
  if (view.business.kind === 'unavailable') return <Empty text={t('thisDeploymentHasNotProvidedAnAuthorizedEnterprise')} />
  return <ReadyBusinessGraph business={view.business} />
}

function ReadyBusinessGraph({ business }: { business: Extract<ProvenanceBusinessView, { kind: 'ready' }> }) {
  const t = useOpenBknTranslation()

  const model = buildBusinessGraphModel(business.operations, business.contextRelations)
  const [selectedKey, setSelectedKey] = useState(model.nodes[0]?.key)
  const selected = model.nodes.find(node => node.key === selectedKey) ?? model.nodes[0]
  const { nodeWidth, nodeHeight } = businessGraphGeometry
  return <div style={graphShellStyle}>
    <section style={graphCanvasStyle}>
      <div style={legendStyle}><span><i style={{ ...legendDotStyle, background: '#2563eb' }} />{t('businessObjects')}</span><span><i style={{ ...legendDotStyle, background: '#f59e0b' }} />{t('logicMetrics')}</span><span><i style={{ ...legendDotStyle, background: '#087d72' }} />{t('formalReferencesInThisTurn')}</span></div>
      {model.nodes.length === 0 ? <div style={graphEmptyStyle}>{t('noDisplayableFormalBKNElementsInThisTurn')}</div> : <div style={graphViewportStyle}><div style={{ position: 'relative', width: model.width, height: model.height }}>
        <svg aria-label={t('formalRelationsLabel')} width={model.width} height={model.height} style={edgeLayerStyle}>
          <defs><marker id="openbkn-business-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#94a3b8" /></marker></defs>
          {model.edges.map(edge => {
            const x1 = edge.source.x + nodeWidth
            const y1 = edge.source.y + nodeHeight / 2
            const x2 = edge.target.x
            const y2 = edge.target.y + nodeHeight / 2
            return <g key={edge.id}><line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#openbkn-business-arrow)" /><text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 8} textAnchor="middle" style={edgeLabelStyle}>{edge.name}</text></g>
          })}
        </svg>
        {model.nodes.map(node => <button key={node.key} type="button" onClick={() => setSelectedKey(node.key)} aria-pressed={selected?.key === node.key} style={{ ...graphNodeStyle, left: node.x, top: node.y, width: nodeWidth, minHeight: nodeHeight, borderColor: selected?.key === node.key ? '#087d72' : nodeBorderColor(node.element.kind), boxShadow: selected?.key === node.key ? '0 0 0 3px rgb(8 125 114 / 12%)' : '0 5px 14px rgb(15 23 42 / 7%)' }}><span style={{ ...nodeTypeStyle, ...nodeTypeColor(node.element.kind) }}>{node.element.kind}</span><strong>{node.element.name}</strong><small style={nodeSourceStyle}>{node.operation.toolName}</small></button>)}
      </div></div>}
    </section>
    <aside style={graphAsideStyle}><div style={eyebrowStyle}>{t('businessReference')}</div><strong style={{ fontSize: 20 }}>{selected?.element.name ?? t('businessElementsNotYetResolved')}</strong><p style={mutedStyle}>{selected === undefined ? t('noDisplayableFormalBKNMappingsInThisTurn') : `${selected.element.kind} · ${selected.operation.status}`}</p><hr style={asideDividerStyle} />{selected === undefined ? null : <><span style={asideLabelStyle}>{t('sourceKnowledgeNetwork')}</span><strong>{selected.element.knowledgeNetworkId ?? t('notLocated')}</strong><span style={asideLabelStyle}>{t('sourceOperation')}</span><code style={asideCodeStyle}>{selected.operation.id}</code><span style={asideLabelStyle}>{t('resolutionTool')}</span><span>{selected.operation.toolName}</span></>}<hr style={asideDividerStyle} /><span style={asideLabelStyle}>{t('formalProjectionInThisTurn')}</span><strong>{t('graphCounts', { nodes: model.nodes.length, edges: model.edges.length })}</strong>{model.unresolvedRelations.length > 0 ? <><span style={mutedStyle}>{t('graphUndisclosed', { count: model.unresolvedRelations.length })}</span><details style={detailStyle}><summary>{t('graphRelationCount', { count: model.unresolvedRelations.length })}</summary>{model.unresolvedRelations.map(relation => <span key={relation.id} style={relationRecordStyle}><strong>{relation.name}</strong><code style={asideCodeStyle}>{relation.sourceObjectId} → {relation.targetObjectId}</code></span>)}</details></> : null}{business.derivedFacts.length > 0 ? <details style={detailStyle}><summary>{t('graphFactCount', { count: business.derivedFacts.length })}</summary>{business.derivedFacts.map(fact => <code key={`${fact.operationId}:${fact.elementId}:${fact.rule}`} style={asideCodeStyle}>{fact.rule} · {fact.sourceOperationId} → {fact.operationId}</code>)}</details> : null}{business.conversationContext.length > 0 ? <span style={mutedStyle}>{t('graphContextCount', { count: business.conversationContext.length })}</span> : null}</aside>
  </div>
}

function EvidenceChain({ view }: { view: ProvenanceView }) {
  const t = useOpenBknTranslation()

  const degradation = view.sources.degraded.find(entry => entry.pane === 'evidence')
  if (degradation !== undefined) return <DegradedPane degradation={degradation} />
  if (view.evidence.kind === 'unavailable') {
    return <Empty text={t('noBusinessOperationInThisTurnRequiredA')} />
  }
  return <div style={{ display: 'grid', gap: 14 }}>
    <PaneHeading badge={<SourceBadge label={view.sources.evidence === 'mcp-result' ? t('mCPResult') : t('platform')} />} title={t('businessReceipts')} note={t('receiptsAreDurableRecordsOfPersistedBusinessOperations')} />
    <div style={timelineStyle}>{view.evidence.receipts.map((receipt, index) => <article key={`${receipt.receiptId}:${index}`} style={operationStyle}>
      <div style={timelineIndexStyle}>{String(index + 1).padStart(2, '0')}</div>
      <div style={{ display: 'grid', gap: 7 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}><strong style={{ overflowWrap: 'anywhere' as const }}>{receipt.receiptId}</strong><Status value={receipt.status} /></div>
        <span style={mutedStyle}>{[receipt.toolLabel, receipt.operationId === undefined ? undefined : `operation ${receipt.operationId}`, receipt.source === 'platform' ? t('sourcePlatform') : t('sourceMCPResult')].filter(Boolean).join(' · ')}</span>
        {receipt.verifyHint === undefined ? null : <code style={asideCodeStyle}>{receipt.verifyHint}</code>}
      </div>
    </article>)}</div>
  </div>
}

function nodeBorderColor(kind: string): string { return kind === 'logic' || kind === 'metric' ? '#f4b860' : kind === 'object' ? '#70a0ff' : '#8ac7c0' }
function nodeTypeColor(kind: string) { return kind === 'logic' || kind === 'metric' ? { background: '#fff4e5', color: '#b45309' } : kind === 'object' ? { background: '#eaf1ff', color: '#2563eb' } : { background: '#e7f7f4', color: '#087d72' } }

function DegradedPane({ degradation }: { degradation: ProvenanceDegradation }) {
  const t = useOpenBknTranslation()
  const copy = degradationCopy(degradation, t)
  return <div style={emptyStyle}><strong>{copy.title}</strong><span>{copy.detail}</span>{copy.action === undefined ? null : <span style={{ color: '#087d72', fontWeight: 650 }}>{copy.action}</span>}</div>
}

function degradationCopy(degradation: ProvenanceDegradation, t: OpenBknTranslate = translateChinese): { title: string; detail: string; action?: string } {
  switch (degradation.reason) {
    case 'trace-disabled': return {
      title: t('noProvenanceRecordedTraceDisabled'),
      detail: t('thePlatformExplicitlyDisabledTraceCollectionThisTurn'),
    }
    case 'trace-unavailable': return {
      title: t('noProvenanceRecordedTraceUnavailable'),
      detail: t('thePlatformExplicitlyReportedTraceUnavailableThisTurn'),
    }
    case 'license-required':
      return {
        title: t('thisPaneRequiresAnEnterpriseLicense'),
        detail: t('licenseDetail', { p0: degradation.edition ?? t('communityEdition') }),
        action: t('nextUpgradeAndActivateAnOpenBKNEnterpriseLicense'),
      }
    case 'domain-not-authorized':
      return {
        title: t('businessDomainNotAuthorized'),
        detail: t('domainDetail', { p0: degradation.requiredAction === undefined ? '' : t('platformHint', { p0: degradation.requiredAction }) }),
        action: t('nextCheckThePluginBusinessDomainSettingBdPublic'),
      }
    case 'authentication-required':
      return {
        title: t('signInRequired'),
        detail: t('thePlatformTokenIsMissingOrExpiredThis'),
        action: t('nextSignInToOpenBKNAgainAndRetry'),
      }
    case 'record-not-disclosed':
      return {
        title: t('platformRecordNotFound'),
        detail: t('thisInteractionDoesNotExistOnTheCurrent'),
      }
    case 'result-too-large':
      return {
        title: t('platformRecordTooLargeToDisplay'),
        detail: t('theRecordReturnedByThePlatformExceedsThe'),
        action: t('nextUseOpenbknTraceInteractionsOperationsInteractionID'),
      }
    default:
      return {
        title: t('platformDataTemporarilyUnavailable'),
        detail: t('theOpenBKNPlatformIsTemporarilyUnreachableTryAgain'),
        action: t('nextRetryLaterOrCheckThePlatformConnection'),
      }
  }
}

function PaneHeading({ badge, title, note }: { badge: ReactNode; title: string; note?: string }) {
  return <header style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' as const }}>
    <strong style={{ fontSize: 16 }}>{title}</strong>
    <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>{note === undefined ? null : <span style={mutedStyle}>{note}</span>}{badge}</span>
  </header>
}

function SourceBadge({ label, mark }: { label: string; mark?: string }) {
  const t = useOpenBknTranslation()

  return <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
    <span style={sourceBadgeStyle}>{label}</span>
    {mark === undefined ? null : <span style={{ ...sourceBadgeStyle, background: '#fff4e5', color: '#b45309' }}>{mark === 'partial' ? t('partialIdentifiers') : degradationMark(mark, t)}</span>}
  </span>
}

function degradationMark(reason: string, t: OpenBknTranslate = translateChinese): string {
  switch (reason) {
    case 'trace-disabled': return t('traceDisabled')
    case 'trace-unavailable': return t('traceNotRecorded')
    case 'license-required': return t('enterpriseRequired')
    case 'domain-not-authorized': return t('domainUnauthorized')
    case 'authentication-required': return t('signInRequiredText145')
    case 'record-not-disclosed': return t('recordNotDisclosed')
    case 'result-too-large': return t('recordTooLarge')
    default: return t('platformUnavailableText148')
  }
}

function kindLabel(kind: ProvenanceTimelineNode['kind'], t: OpenBknTranslate = translateChinese): string {
  switch (kind) {
    case 'lifecycle': return t('lifecycle')
    case 'managed': return t('managedAccess')
    default: return kind
  }
}

function kindChipStyle(kind: ProvenanceTimelineNode['kind']) {
  const base = { width: 'fit-content', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }
  if (kind === 'question' || kind === 'answer') return { ...base, background: '#f1f5f9', color: '#475569' }
  if (kind === 'lifecycle') return { ...base, background: '#e7f7f4', color: '#087d72' }
  return { ...base, background: '#eaf1ff', color: '#2563eb' }
}

function formatDuration(durationMs: number): string {
  if (durationMs < 1000) return `${durationMs} ms`
  return `${(durationMs / 1000).toFixed(1)} s`
}

function formatClock(at: number): string {
  const date = new Date(at)
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function Metric({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) { return <div style={{ display: 'grid', gap: 5, padding: 16, background: '#fff' }}><span style={mutedStyle}>{label}</span><strong style={mono ? { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', overflowWrap: 'anywhere' } : undefined}>{value}</strong></div> }
function Reference({ label, value }: { label: string; value: string }) { return <span style={referenceStyle}><small>{label}</small><code>{value}</code></span> }
function Status({ value }: { value?: string }) { const t = useOpenBknTranslation(); return <span style={{ color: value === 'failed' ? '#b42318' : '#087d72', fontSize: 13, fontWeight: 700 }}>{value ?? t('recorded')}</span> }
function Empty({ text }: { text: string }) {
  const t = useOpenBknTranslation()
 return <div style={emptyStyle}><strong>{t('noManagedDataToDisplay')}</strong><span>{text}</span></div> }
function Loading() {
  const t = useOpenBknTranslation()
 return <div style={emptyStyle}><strong>{t('readingBusinessProvenanceForThisTurn')}</strong><span>{t('theTimelineIsReconstructedFromLocalEventsPlatform')}</span></div> }
function LoadFailed() {
  const t = useOpenBknTranslation()
 return <div style={emptyStyle}><strong>{t('businessProvenanceCouldNotBeRead')}</strong><span>{t('checkTheOpenBKNPlatformConnectionAndYourAccount')}</span></div> }
function TabButton({ active, onClick, children }: { active: boolean; onClick(): void; children: string }) { return <button type="button" onClick={onClick} style={{ border: 0, borderBottom: active ? '3px solid #087d72' : '3px solid transparent', background: 'transparent', color: active ? '#087d72' : '#64748b', padding: '14px 18px', fontWeight: active ? 750 : 550, cursor: 'pointer', fontSize: 15 }}>{children}</button> }

const backdropStyle = { pointerEvents: 'auto' as const, position: 'fixed' as const, inset: 0, display: 'grid', placeItems: 'center', background: 'rgb(15 23 42 / 38%)', padding: 20 }
const dialogStyle = { width: 'min(1280px, 100%)', minHeight: 560, maxHeight: 'min(840px, calc(100vh - 40px))', overflow: 'auto' as const, borderRadius: 16, background: '#fff', boxShadow: '0 24px 70px rgb(15 23 42 / 28%)', color: '#172033' }
const headerStyle = { display: 'flex', alignItems: 'start', justifyContent: 'space-between', padding: '26px 28px 18px', borderBottom: '1px solid #e6eaf0' }
const eyebrowStyle = { color: '#087d72', fontSize: 12, fontWeight: 750, letterSpacing: '0.12em' }
const closeStyle = { border: '1px solid #d9e0ea', borderRadius: 9, width: 42, height: 42, background: '#fff', fontSize: 30, lineHeight: 1, cursor: 'pointer' }
const tabBarStyle = { display: 'flex', gap: 12, padding: '0 20px', borderBottom: '1px solid #e6eaf0' }
const mutedStyle = { color: '#64748b', fontSize: 14, margin: 0, lineHeight: 1.55 }
const summaryStyle = { display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) repeat(2, minmax(0, 1fr))', gap: 1, overflow: 'hidden', border: '1px solid #e1e8ee', borderRadius: 12, background: '#e1e8ee' }
const timelineStyle = { display: 'grid', gap: 12 }
const operationStyle = { display: 'grid', gridTemplateColumns: '42px minmax(0, 1fr)', gap: 14, padding: 16, border: '1px solid #e1e8ee', borderRadius: 12 }
const timelineIndexStyle = { color: '#087d72', fontWeight: 750, paddingTop: 2 }
const timelineNodeStyle = { display: 'grid', gridTemplateColumns: 'fit-content(120px) minmax(0, 1fr) fit-content(90px)', gap: 12, alignItems: 'start', padding: '12px 16px', border: '1px solid #e1e8ee', borderRadius: 12 }
const durationStyle = { color: '#64748b', fontSize: 13, textAlign: 'right' as const, whiteSpace: 'nowrap' as const }
const sourceBadgeStyle = { padding: '3px 8px', borderRadius: 6, background: '#e7f7f4', color: '#087d72', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' as const }
const referenceRowStyle = { display: 'flex', flexWrap: 'wrap' as const, gap: 8 }
const referenceStyle = { display: 'inline-flex', alignItems: 'baseline', gap: 5, padding: '4px 7px', borderRadius: 6, background: '#f1f5f9', color: '#475569', maxWidth: '100%', overflowWrap: 'anywhere' as const }
const emptyStyle = { display: 'grid', gap: 12, minHeight: 250, placeContent: 'center', padding: 28, border: '1px dashed #cbd5e1', borderRadius: 12, color: '#64748b', textAlign: 'center' as const, lineHeight: 1.65 }
const graphShellStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(260px, 100%), 1fr))', minHeight: 410, border: '1px solid #e1e8ee', borderRadius: 14, overflow: 'hidden' }
const graphCanvasStyle = { position: 'relative' as const, padding: 24, backgroundImage: 'radial-gradient(#dce5ee 1px, transparent 1px)', backgroundSize: '20px 20px' }
const graphAsideStyle = { display: 'grid', alignContent: 'start', gap: 14, padding: 24, borderLeft: '1px solid #e1e8ee', background: '#fff' }
const legendStyle = { display: 'flex', flexWrap: 'wrap' as const, gap: 14, width: 'fit-content', padding: '8px 10px', borderRadius: 7, background: '#fff', border: '1px solid #e1e8ee', color: '#64748b', fontSize: 12 }
const legendDotStyle = { display: 'inline-block', width: 8, height: 8, marginRight: 5, borderRadius: 2 }
const graphViewportStyle = { overflow: 'auto' as const, marginTop: 12, maxHeight: 430 }
const graphEmptyStyle = { display: 'grid', minHeight: 330, placeContent: 'center', color: '#64748b' }
const edgeLayerStyle = { position: 'absolute' as const, inset: 0, overflow: 'visible' as const }
const edgeLabelStyle = { fill: '#64748b', fontSize: 12, fontWeight: 650, paintOrder: 'stroke' as const, stroke: '#f8fafc', strokeWidth: 5, strokeLinejoin: 'round' as const }
const graphNodeStyle = { position: 'absolute' as const, display: 'grid', gap: 6, alignContent: 'center', padding: 13, border: '2px solid', borderRadius: 12, background: '#fff', color: '#172033', textAlign: 'left' as const, cursor: 'pointer' }
const nodeTypeStyle = { width: 'fit-content', padding: '3px 6px', borderRadius: 5, background: '#e7f7f4', color: '#087d72', fontSize: 11, fontWeight: 700 }
const nodeSourceStyle = { color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }
const asideDividerStyle = { border: 0, borderTop: '1px solid #e6eaf0', width: '100%', margin: '4px 0' }
const asideLabelStyle = { color: '#64748b', fontSize: 12 }
const asideCodeStyle = { color: '#087d72', overflowWrap: 'anywhere' as const, fontSize: 12 }
const detailStyle = { display: 'grid', gap: 8, color: '#475569', fontSize: 13 }
const relationRecordStyle = { display: 'grid', gap: 3, padding: '7px 0', borderBottom: '1px solid #eef2f6' }
