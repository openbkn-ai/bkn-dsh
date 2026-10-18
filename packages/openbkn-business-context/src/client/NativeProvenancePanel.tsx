import { useMemo, useState } from 'react'
import type { NativeReadFailure, NativeBusinessFunction, NativeChainNode } from '../native-provenance-types.ts'
import type { ProvenanceView } from '../types.ts'
import { useOpenBknTranslation } from './locale.tsx'
import { nativeSelectionModel, type NativeTarget, type NativeTargetKind } from './native-provenance-selection.ts'

type SelectionModel = ReturnType<typeof nativeSelectionModel>
type Selection = ReturnType<SelectionModel['selection']>
type Tab = 'events' | 'evidence'

/** Relationships are selected by disclosed identifiers only; no text, value or temporal matching. */
export function NativeProvenancePanel({ view, tab, onTabChange }: { view: ProvenanceView; tab: Tab; onTabChange?: (tab: Tab) => void }) {
  const t = useOpenBknTranslation()
  const [pairId, setPairId] = useState<string>()
  const [target, setTarget] = useState<NativeTarget>()
  const native = view.native
  const traceDisabled = view.sources.degraded.some(item => item.reason === 'trace-disabled')
  const traceUnavailable = view.sources.degraded.some(item => item.reason === 'trace-unavailable')
  const nativeOverflow = view.sources.degraded.some(item => item.pane === 'native' && item.reason === 'result-too-large')
  const result = native?.explanation
  const explanation = result?.kind === 'ready' ? result.view : undefined
  const rail = native?.detail.kind === 'ready' ? native.detail.view.timeRail : explanation?.timeRail ?? []
  const model = useMemo(() => nativeSelectionModel(explanation,pairId,rail),[explanation,pairId,rail])
  const {pair,graph:pairGraph,claims,evidence,functions} = model
  const selection = model.selection(target)
  const claim = selection.active?.kind === 'claim' ? claims.find(item=>item.id===selection.active!.id) : undefined
  const selectedNode = model.node(selection.active)
  const relatedFunctions = functions.filter(fn=>selection.isRelated({kind:'function',id:fn.id}))
  const jump = (next: NativeTarget) => {
    setTarget(next)
    onTabChange?.(['event','step','execution'].includes(next.kind) ? 'events' : 'evidence')
  }
  const question = native?.detail.kind === 'ready' ? native.detail.view.question : explanation?.question
  const answer = native?.detail.kind === 'ready' ? native.detail.view.answer : explanation?.answer
  return <div style={{ display: 'grid', gap: 16 }}>
    <p style={noticeStyle}>{t('nativeRecordedAnswer')}</p>
    {question === undefined && answer === undefined ? null : <section style={boxStyle}>
      <strong>{t('question')}</strong><p style={textStyle}>{question ?? '—'}</p>
      <strong>{t('answer')}</strong><p style={textStyle}>{answer ?? '—'}</p>
    </section>}
    {explanation === undefined ? <p role="status" style={noticeStyle}>{traceDisabled ? t('noProvenanceRecordedTraceDisabled') : traceUnavailable ? t('noProvenanceRecordedTraceUnavailable') : result?.kind === 'not-generated' ? t('nativeNotGenerated') : <NativeFailure reason={result?.kind === 'unavailable' ? result.reason : nativeOverflow ? 'result-too-large' : 'unavailable'} />}</p> : <>
      <p style={noticeStyle}>{t('nativeStates', { status: explanation.status, evidence: explanation.evidenceStatus ?? '—', generation: explanation.generationStatus ?? '—' })}</p>
      {explanation.notices?.map((notice, index) => <p key={index} role="status" style={noticeStyle}>{notice}</p>)}
      {explanation.questionPairs?.length ? <label>{t('nativeQuestionPair')} <select value={pair?.id ?? ''} onChange={event => { setPairId(event.target.value); setTarget(undefined) }}>
        {explanation.questionPairs.map(item => <option key={item.id} value={item.id}>{item.summary || item.question}</option>)}
      </select></label> : null}
    </>}
    {native?.detail.kind === 'ready' && native.detail.view.recordIntegrity !== undefined ? <p role="status" style={noticeStyle}>{t('nativeRecordIntegrity', { status: native.detail.view.recordIntegrity.status, count: native.detail.view.recordIntegrity.missing.length })}</p> : null}
    {native?.detail.kind === 'ready' && native.detail.view.recordIntegrityCheckFailed ? <p role="status" style={noticeStyle}>{t('nativeIntegrityUnavailable')}</p> : null}
    {tab === 'events' ? <>
      <h3>{t('nativeEvents')}</h3>
      {native?.detail.kind === 'unavailable' ? <p role="status" style={noticeStyle}><NativeFailure reason={native.detail.reason} /></p> : null}
      {native?.detail.kind === 'ready' && native.detail.view.recordIntegrity?.missing.length ? <details><summary>{t('nativeTechnicalDetails')}</summary>{native.detail.view.recordIntegrity.missing.map((gap,index) => <p key={index} style={textStyle}>{gap.operation_id} · {gap.attempt} · {gap.reason} · {gap.field}</p>)}</details> : null}
      {rail.length === 0 ? <p style={noticeStyle}>{t('nativeNoEvents')}</p> : <div style={gridStyle}>{rail.map(event => {
        const recordedFunctions=functions.filter(fn=>fn.operationIds.includes(event.operation_id))
        return <button type="button" key={event.id} {...selectionProps({kind:'event',id:event.id},selection,setTarget)}>
        <strong>{recordedFunctions.length===1 ? recordedFunctions[0].displayName : event.interface_name}</strong><span>{event.status} · {event.duration_ms === undefined ? '—' : `${event.duration_ms} ms`}</span>
        {recordedFunctions.length>1 ? <small>{t('nativeRelatedProcesses',{count:recordedFunctions.length})}</small> : null}
        <small>{t('nativeAttempt',{attempt:event.attempt})} · {event.started_at}</small>
      </button>})}</div>}
      <h3>{t('nativeExecutionSteps')}</h3>
      {model.steps.length ? <div style={gridStyle}>{model.steps.map(step=><button type="button" key={step.id} {...selectionProps({kind:'step',id:step.id},selection,setTarget)}>
        <strong>{step.interfaceName}</strong><span>{step.businessRole} · {step.status}</span><small>{t('nativeAttempt',{attempt:step.attempt})}</small>
      </button>)}</div> : <p style={noticeStyle}>{t('nativeNoSteps')}</p>}
      {model.execution.length ? <><h3>{t('nativeExecutionGraph')}</h3><Nodes nodes={model.execution} kind="execution" selection={selection} select={setTarget} /></> : null}
    </> : <>
      <h3>{t('nativeConclusions')}</h3>
      <p style={noticeStyle}>{t('nativeRelationBoundary')}</p>
      {explanation === undefined ? null : claims.length === 0 ? <p style={noticeStyle}>{t('nativeNoClaims')}</p> : <div style={gridStyle}>{claims.map(item => <button type="button" key={item.id} {...selectionProps({kind:'claim',id:item.id},selection,setTarget)}>
        <strong>{item.label}</strong><span style={textStyle}>{item.value}</span><small>{item.status} · {item.supportStatus ?? '—'} · {item.attributionStatus ?? '—'}</small>
      </button>)}</div>}
      {explanation?.requirements?.map(requirement => <p key={requirement.id} style={noticeStyle}>{requirement.label} · {requirement.status}</p>)}
      {claim === undefined ? null : <><p style={textStyle}>{claim.detail}</p>{claim.derivation === undefined ? null : <details><summary>{t('nativeProcessing')}</summary>
        <strong>{claim.derivation.processName}</strong><p style={textStyle}>{claim.derivation.formula}</p><p style={textStyle}>{claim.derivation.boundary}</p>
        {[...claim.derivation.inputs,...claim.derivation.components].map((item,index) => <p key={index} style={textStyle}>{item.label}: {item.value}</p>)}
        <small>{claim.derivation.method} · {claim.derivation.verification ?? '—'}</small>
      </details>}</>}
      <h3>{t('nativeEvidenceNodes')}</h3>
      <Nodes nodes={evidence} kind="evidence" selection={selection} select={setTarget} />
      {model.schema.length ? <><h3>{t('nativeSchemaSources')}</h3><Nodes nodes={model.schema} kind="schema" selection={selection} select={setTarget} /></> : null}
      <details><summary>{t('nativeRelationshipRecords')}</summary>
        {(pairGraph?.edges ?? []).map(edge => <p key={edge.edgeId} style={textStyle}>{edge.fromId} → {edge.toId} · {edge.kind} · {edge.validationStatus}</p>)}
        {(pairGraph ? [] : explanation?.evidence.edges ?? []).map(edge => <p key={edge.id} style={textStyle}>{edge.source} → {edge.target} · {edge.label}</p>)}
      </details>
    </>}
    <p style={noticeStyle}>{t('nativeSelectionBoundary')}</p>
    {model.unresolved.size ? <details><summary>{t('nativeUndisclosedRefs')}</summary>{[...model.unresolved].map(id=><p key={id} style={textStyle}>{t('nativeUnresolvedReference',{id})}</p>)}</details> : null}
    <h3>{t('nativeBusinessProcessing')}</h3>
    {relatedFunctions.length ? relatedFunctions.map(fn => <BusinessFunction key={fn.id} value={fn} model={model} selection={selection} select={setTarget} jump={jump} />) : <p style={noticeStyle}>{t('nativeNoLinkedFunction')}</p>}
    {selectedNode === undefined ? null : <><NodeDetail node={selectedNode} />{selectedNode.executionNodeId ? <Reference id={selectedNode.executionNodeId} kinds={['execution']} model={model} selection={selection} jump={jump} /> : null}</>}
    {explanation === undefined ? null : <details><summary>{t('nativeTechnicalDetails')}</summary>
      <p style={textStyle}>Interaction: {explanation.interactionId}</p><p>{result?.kind === 'ready' ? result.generatedAt : ''}</p>
    </details>}
  </div>
}
function selectionProps(target: NativeTarget, selection: Selection, select: (target: NativeTarget) => void) {
  return {
    'aria-pressed': selection.isSelected(target), 'data-related': selection.isRelated(target),
    'data-target-kind': target.kind, 'data-target-id': target.id,
    onClick: () => select(target),
    style: { ...boxStyle, cursor: 'pointer', borderColor: selection.isRelated(target) ? '#087d72' : '#dce4ec', background: selection.isSelected(target) ? '#effaf7' : '#fff' },
  }
}
function Nodes({nodes,kind,selection,select}:{nodes:readonly NativeChainNode[];kind:'evidence'|'schema'|'execution';selection:Selection;select:(target:NativeTarget)=>void}) {
  const t=useOpenBknTranslation()
  return <div style={gridStyle}>{nodes.map(node=><button type="button" key={node.id} {...selectionProps({kind,id:node.id},selection,select)}>
    <strong>{node.label}</strong><span>{node.value}</span><small>{node.kind} · {node.status ?? '—'}</small>
    {selection.isRelated({kind,id:node.id}) ? <small>{t('nativeServerLinked')}</small> : null}
  </button>)}</div>
}
interface ReferenceProps { model:SelectionModel; selection:Selection; jump:(target:NativeTarget)=>void }
function Reference({id,kinds,model,selection,jump}:{id:string;kinds:readonly NativeTargetKind[]} & ReferenceProps) {
  const t=useOpenBknTranslation(); const target=model.resolve(id,kinds)
  const node=model.node(target)
  const step=target?.kind==='step' ? model.steps.find(item=>item.id===target.id) : undefined
  const label=node?.label ?? (step ? `${step.interfaceName} · ${t('nativeAttempt',{attempt:step.attempt})}` : id)
  return target ? <button type="button" aria-label={t('nativeOpenReference',{label})} {...selectionProps(target,selection,jump)}>{label}</button>
    : <span style={noticeStyle} data-unresolved-reference={id}>{t('nativeUnresolvedReference',{id})}</span>
}
function BusinessFunction({ value,model,selection,select,jump }: { value: NativeBusinessFunction;select:(target:NativeTarget)=>void } & ReferenceProps) {
  const t = useOpenBknTranslation()
  return <section style={boxStyle}><h4 style={{ margin: 0 }}>{value.displayName}</h4><p style={textStyle}>{value.businessPurpose}</p>
    <button type="button" {...selectionProps({kind:'function',id:value.id},selection,select)}>{t('nativeSelectProcessing')}</button>
    <strong>{t('nativeInput')}</strong>{value.businessInputs.map((input,index) => <div key={index}><p style={textStyle}>{input.name}: {input.value ?? '—'} · {input.sourceKind ?? '—'}</p>
      {[...new Set([...(input.sourceRef ? [input.sourceRef] : []),...(input.evidenceRefs ?? [])])].map(id=><Reference key={id} id={id} kinds={['evidence','schema']} model={model} selection={selection} jump={jump}/>)}</div>)}
    <strong>{t('nativeProcessing')}</strong><p style={textStyle}>{value.logicSummary}</p>
    <strong>{t('nativeOutput')}</strong>{value.businessOutputs.map((output,index) => <div key={index}><p style={textStyle}>{output.summary}</p>
      {[...new Set([...output.evidenceRefs,...output.adoptedRowRefs])].map(id=><Reference key={id} id={id} kinds={['evidence']} model={model} selection={selection} jump={jump}/>)}</div>)}
    {value.schemaRefs.length ? <div><strong>{t('nativeSchemaSources')}</strong>{value.schemaRefs.map(id=><Reference key={id} id={id} kinds={['schema']} model={model} selection={selection} jump={jump}/>)}</div> : null}
    <div><strong>{t('nativeExecutionSteps')}</strong>{model.steps.filter(step=>value.operationIds.includes(step.operationId)).map(step=><Reference key={step.id} id={step.id} kinds={['step']} model={model} selection={selection} jump={jump}/>)}</div>
    <details><summary>{t('nativeTechnicalDetails')}</summary><p style={textStyle}>{value.id} · {value.validationStatus} · {value.reasonCode ?? '—'}</p>
      {value.businessInputs.map((input,index) => <p key={index} style={textStyle}>{input.sourceRef} · {input.evidenceRefs?.join(' · ')}</p>)}
      {value.operationIds.map(id => <p key={id} style={textStyle}>Operation: {id}</p>)}
      {value.businessOutputs.flatMap(output => [...output.evidenceRefs,...output.adoptedRowRefs]).map((ref,index) => <p key={index} style={textStyle}>{ref}</p>)}
    </details>
  </section>
}
function NodeDetail({ node }: { node: NativeChainNode }) {
  const t = useOpenBknTranslation()
  return <section style={boxStyle}><strong>{node.label}</strong><p style={textStyle}>{node.detail}</p>
    <details><summary>{t('nativeTechnicalDetails')}</summary><p style={textStyle}>{node.id} · {node.kind} · {node.role ?? '—'}</p><p style={textStyle}>{node.technical}</p></details>
  </section>
}
function NativeFailure({ reason }: { reason: NativeReadFailure }) {
  const t = useOpenBknTranslation()
  const keys = { 'authentication-required': 'nativeAuthRequired', 'access-denied': 'nativeAccessDenied', 'not-disclosed-or-unavailable': 'nativeNotDisclosed', 'invalid-response': 'nativeInvalid', 'result-too-large': 'nativeTooLarge', unavailable: 'nativeUnavailable' } as const
  return <>{t(keys[reason])}</>
}
const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))', gap: 10 }
const textStyle = { whiteSpace: 'pre-wrap' as const, overflowWrap: 'anywhere' as const, margin: '8px 0', fontSize: 14, lineHeight: 1.6 }
const noticeStyle = { ...textStyle, color: '#64748b' }
const boxStyle = { display: 'grid', gap: 7, padding: 14, border: '1px solid #dce4ec', borderRadius: 10, color: '#172033', background: '#fff', textAlign: 'left' as const, overflowWrap: 'anywhere' as const, minWidth: 0 }
