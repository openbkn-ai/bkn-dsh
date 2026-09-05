import { useEffect, useRef, useState } from 'react'
import type { HostObservable, InjectFace, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import { buildBusinessGraphModel, businessGraphGeometry } from '../business-graph-model.ts'
import type { ProvenanceBusinessView, ProvenanceHandle, ProvenanceView } from '../types.ts'
import type {} from '@deepseek-ai/dsh-client-ui-layout/client'

type Tab = 'execution' | 'graph' | 'evidence'

export interface ProvenanceOverlayState {
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

  getSnapshot = (): ProvenanceOverlayState => this.state
  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }
  open(sessionId: string, messageId: string, handle: ProvenanceHandle, restoreFocus?: FocusTarget): void {
    this.restoreFocus = restoreFocus
    this.publish({ sessionId, messageId, handle })
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
  load(sessionId: string, messageId: string): Promise<ProvenanceView | undefined>
  close(): void
}

export type ProvenanceOverlayProps = PropsRuntime<'shell.overlay'> & InjectFace<ProvenanceOverlayInjected>

/** Provenance detail lives in an additive shell overlay, never inline in DSH chat. */
export function ProvenanceOverlay({ useProvenanceOverlay, load, close }: ProvenanceOverlayProps) {
  const state = useProvenanceOverlay((value: ProvenanceOverlayState) => value)
  const [tab, setTab] = useState<Tab>('execution')
  const [view, setView] = useState<ProvenanceView | undefined>()
  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState(false)
  const dialog = useRef<HTMLElement>(null)
  useEffect(() => {
    if (state.handle === undefined || state.sessionId === undefined || state.messageId === undefined) return
    let active = true
    setTab('execution'); setView(undefined); setFailed(false); setLoading(true)
    void load(state.sessionId, state.messageId).then(next => {
      if (active) setView(next)
    }).catch(() => {
      if (active) setFailed(true)
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => { active = false }
  }, [load, state.handle, state.messageId, state.sessionId])
  useEffect(() => {
    if (state.handle === undefined) return
    dialog.current?.focus()
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') close() }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [close, state.handle])
  if (state.handle === undefined) return null

  return <div role="presentation" onMouseDown={close} style={backdropStyle}>
    <section ref={dialog} tabIndex={-1} role="dialog" aria-modal="true" aria-label="OpenBKN business provenance" onMouseDown={event => event.stopPropagation()} style={dialogStyle}>
      <header style={headerStyle}><div><div style={eyebrowStyle}>TRACE-BACKED PROVENANCE</div><h2 style={{ margin: '4px 0 0', fontSize: 28 }}>业务溯源</h2></div><button type="button" aria-label="Close" onClick={close} style={closeStyle}>×</button></header>
      <nav aria-label="Provenance views" style={tabBarStyle}><TabButton active={tab === 'execution'} onClick={() => setTab('execution')}>执行溯源</TabButton><TabButton active={tab === 'graph'} onClick={() => setTab('graph')}>业务上下文图</TabButton><TabButton active={tab === 'evidence'} onClick={() => setTab('evidence')}>证据链</TabButton></nav>
      <main style={{ padding: 28 }}>{loading ? <Loading /> : failed || view === undefined ? <LoadFailed /> : tab === 'execution' ? <Execution handle={state.handle} view={view} /> : tab === 'graph' ? <BusinessGraph view={view} /> : <EvidenceChain view={view} />}</main>
    </section>
  </div>
}

function Execution({ handle, view }: { handle: ProvenanceHandle; view: ProvenanceView }) {
  return <div style={{ display: 'grid', gap: 16 }}><p style={mutedStyle}>仅展示本轮由 OpenBKN 受管交互实际记录的操作事实。</p><section style={summaryStyle}><Metric label="Interaction ID" value={handle.interactionId} mono /><Metric label="执行状态" value={view.execution.status ?? handle.status} /><Metric label="已记录操作" value={String(view.execution.operations.length)} /></section>{view.execution.operations.length === 0 ? <Empty text="当前交互未记录可展示的操作事实。" /> : <div style={timelineStyle}>{view.execution.operations.map((operation, index) => <article key={operation.id} style={operationStyle}><div style={timelineIndexStyle}>{String(index + 1).padStart(2, '0')}</div><div style={{ display: 'grid', gap: 7 }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}><strong>{operation.label}</strong><Status value={operation.status} /></div><span style={mutedStyle}>{[operation.protocol, operation.startedAt, operation.finishedAt].filter(Boolean).join(' · ')}</span><div style={referenceRowStyle}>{operation.requestId === undefined ? null : <Reference label="Request" value={operation.requestId} />}{operation.traceId === undefined ? null : <Reference label="Trace" value={operation.traceId} />}{operation.receiptId === undefined ? null : <Reference label="Receipt" value={operation.receiptId} />}</div></div></article>)}</div>}</div>
}

function BusinessGraph({ view }: { view: ProvenanceView }) {
  if (view.business.kind === 'unavailable') return <Empty text="当前部署未提供已授权的 Enterprise 业务投影。插件不会从 Community 调用事实、模型文本或 MCP 原始输出推断图谱。" />
  return <ReadyBusinessGraph business={view.business} />
}

function ReadyBusinessGraph({ business }: { business: Extract<ProvenanceBusinessView, { kind: 'ready' }> }) {
  const model = buildBusinessGraphModel(business.operations, business.contextRelations)
  const [selectedKey, setSelectedKey] = useState(model.nodes[0]?.key)
  const selected = model.nodes.find(node => node.key === selectedKey) ?? model.nodes[0]
  const { nodeWidth, nodeHeight } = businessGraphGeometry
  return <div style={graphShellStyle}>
    <section style={graphCanvasStyle}>
      <div style={legendStyle}><span><i style={{ ...legendDotStyle, background: '#2563eb' }} />业务对象</span><span><i style={{ ...legendDotStyle, background: '#f59e0b' }} />逻辑 / 指标</span><span><i style={{ ...legendDotStyle, background: '#087d72' }} />本轮正式引用</span></div>
      {model.nodes.length === 0 ? <div style={graphEmptyStyle}>本轮没有可展示的正式 BKN 元素。</div> : <div style={graphViewportStyle}><div style={{ position: 'relative', width: model.width, height: model.height }}>
        <svg aria-label="OpenBKN formal business relations" width={model.width} height={model.height} style={edgeLayerStyle}>
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
    <aside style={graphAsideStyle}><div style={eyebrowStyle}>BUSINESS REF</div><strong style={{ fontSize: 20 }}>{selected?.element.name ?? '尚未解析业务元素'}</strong><p style={mutedStyle}>{selected === undefined ? '本轮没有可展示的正式 BKN 映射。' : `${selected.element.kind} · ${selected.operation.status}`}</p><hr style={asideDividerStyle} />{selected === undefined ? null : <><span style={asideLabelStyle}>来源知识网络</span><strong>{selected.operation.knowledgeNetworkId ?? '未定位'}</strong><span style={asideLabelStyle}>来源 Operation</span><code style={asideCodeStyle}>{selected.operation.id}</code><span style={asideLabelStyle}>解析工具</span><span>{selected.operation.toolName}</span></>}<hr style={asideDividerStyle} /><span style={asideLabelStyle}>本轮正式投影</span><strong>{model.nodes.length} 个元素 · {model.edges.length} 条可视关系</strong>{model.unresolvedRelations.length > 0 ? <><span style={mutedStyle}>另有 {model.unresolvedRelations.length} 条正式关系因端点未在本轮投影中披露，仅保留记录，不补画。</span><details style={detailStyle}><summary>平台关系记录（{model.unresolvedRelations.length}）</summary>{model.unresolvedRelations.map(relation => <span key={relation.id} style={relationRecordStyle}><strong>{relation.name}</strong><code style={asideCodeStyle}>{relation.sourceObjectId} → {relation.targetObjectId}</code></span>)}</details></> : null}{business.derivedFacts.length > 0 ? <details style={detailStyle}><summary>跨 Operation 依据（{business.derivedFacts.length}）</summary>{business.derivedFacts.map(fact => <code key={`${fact.operationId}:${fact.elementId}:${fact.rule}`} style={asideCodeStyle}>{fact.rule} · {fact.sourceOperationId} → {fact.operationId}</code>)}</details> : null}{business.conversationContext.length > 0 ? <span style={mutedStyle}>复用 {business.conversationContext.length} 条前序会话上下文</span> : null}</aside>
  </div>
}

function nodeBorderColor(kind: string): string { return kind === 'logic' || kind === 'metric' ? '#f4b860' : kind === 'object' ? '#70a0ff' : '#8ac7c0' }
function nodeTypeColor(kind: string) { return kind === 'logic' || kind === 'metric' ? { background: '#fff4e5', color: '#b45309' } : kind === 'object' ? { background: '#eaf1ff', color: '#2563eb' } : { background: '#e7f7f4', color: '#087d72' } }

function EvidenceChain({ view }: { view: ProvenanceView }) {
  return <Empty text="当前 Interaction 的正式 Enterprise 投影尚未定义证据链 DTO。插件不会从原始调用或模型回答拼装 claims、证据引用或结论。" />
}

function Metric({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) { return <div style={{ display: 'grid', gap: 5, padding: 16, background: '#fff' }}><span style={mutedStyle}>{label}</span><strong style={mono ? { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', overflowWrap: 'anywhere' } : undefined}>{value}</strong></div> }
function Reference({ label, value }: { label: string; value: string }) { return <span style={referenceStyle}><small>{label}</small><code>{value}</code></span> }
function Status({ value }: { value?: string }) { return <span style={{ color: value === 'failed' ? '#b42318' : '#087d72', fontSize: 13, fontWeight: 700 }}>{value ?? 'recorded'}</span> }
function Empty({ text }: { text: string }) { return <div style={emptyStyle}><strong>暂无可展示的受管数据</strong><span>{text}</span></div> }
function Loading() { return <div style={emptyStyle}><strong>正在读取本轮业务溯源…</strong><span>仅查询该 Interaction 已授权的 OpenBKN 记录。</span></div> }
function LoadFailed() { return <div style={emptyStyle}><strong>业务溯源暂时无法读取</strong><span>请检查 OpenBKN 平台连接和当前用户权限后重试。不会使用模型文本替代平台记录。</span></div> }
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
const referenceRowStyle = { display: 'flex', flexWrap: 'wrap' as const, gap: 8 }
const referenceStyle = { display: 'inline-flex', alignItems: 'baseline', gap: 5, padding: '4px 7px', borderRadius: 6, background: '#f1f5f9', color: '#475569', maxWidth: '100%', overflowWrap: 'anywhere' as const }
const emptyStyle = { display: 'grid', gap: 12, minHeight: 250, placeContent: 'center', padding: 28, border: '1px dashed #cbd5e1', borderRadius: 12, color: '#64748b', textAlign: 'center' as const, lineHeight: 1.65 }
const graphShellStyle = { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 260px', minHeight: 410, border: '1px solid #e1e8ee', borderRadius: 14, overflow: 'hidden' }
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
