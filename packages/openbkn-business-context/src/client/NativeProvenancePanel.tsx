import { useMemo, useState } from 'react'
import type { NativeReadFailure, NativeBusinessFunction, NativeChainNode } from '../native-provenance-types.ts'
import type { ProvenanceView } from '../types.ts'
import { useOpenBknTranslation } from './locale.tsx'
import { nativeSelectionModel, targetKey, type NativeTarget, type NativeTargetKind } from './native-provenance-selection.ts'
import { NativeRecordList } from './NativeRecordList.tsx'

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
  const contextKey=pair?.id ?? ''
  const focusKey=selection.active && targetKey(selection.active)
  const listProps={contextKey,focusKey}
  const invalidRecords=functions.filter(fn=>fn.validationStatus==='invalid').length+(pairGraph?.edges.filter(edge=>edge.validationStatus==='invalid').length ?? 0)
  const focusIndex=(kind:NativeTargetKind,items:readonly {id:string}[])=>items.findIndex(item=>selection.isSelected({kind,id:item.id}))
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
      <NativeRecordList {...listProps} label={t('nativeStates',{status:explanation.status,evidence:explanation.evidenceStatus ?? '—',generation:explanation.generationStatus ?? '—'})} items={explanation.notices ?? []} renderItem={(notice,index)=><p key={index} role="status" style={noticeStyle}>{notice}</p>} />
      {explanation.questionPairs?.length ? <label>{t('nativeQuestionPair')} <select value={pair?.id ?? ''} onChange={event => { setPairId(event.target.value); setTarget(undefined) }}>
        {explanation.questionPairs.map(item => <option key={item.id} value={item.id}>{item.summary || item.question}</option>)}
      </select></label> : null}
    </>}
    {invalidRecords ? <p role="status" style={noticeStyle}>{t('nativeInvalidRecords',{count:invalidRecords})}</p> : null}
    {native?.detail.kind === 'ready' && native.detail.view.recordIntegrity !== undefined ? <p role="status" style={noticeStyle}>{t('nativeRecordIntegrity', { status: native.detail.view.recordIntegrity.status, count: native.detail.view.recordIntegrity.missing.length })}</p> : null}
    {native?.detail.kind === 'ready' && native.detail.view.recordIntegrityCheckFailed ? <p role="status" style={noticeStyle}>{t('nativeIntegrityUnavailable')}</p> : null}
    {tab === 'events' ? <>
      <h3>{t('nativeEvents')}</h3>
      {native?.detail.kind === 'unavailable' ? <p role="status" style={noticeStyle}><NativeFailure reason={native.detail.reason} /></p> : null}
      {native?.detail.kind === 'ready' && native.detail.view.recordIntegrity?.missing.length ? <details><summary>{t('nativeTechnicalDetails')}</summary><NativeRecordList {...listProps} label={t('nativeTechnicalDetails')} items={native.detail.view.recordIntegrity.missing} renderItem={(gap,index)=><p key={index} style={textStyle}>{gap.operation_id} · {gap.attempt} · {gap.reason} · {gap.field}</p>} /></details> : null}
      {rail.length === 0 ? <p style={noticeStyle}>{t('nativeNoEvents')}</p> : <NativeRecordList {...listProps} label={t('nativeEvents')} items={rail} grid focusIndex={selection.active?.kind==='step' ? rail.findIndex(event=>selection.isRelated({kind:'event',id:event.id})) : focusIndex('event',rail)} renderItem={event => {
        const recordedFunctions=functions.filter(fn=>fn.operationIds.includes(event.operation_id))
        return <button type="button" key={event.id} {...selectionProps({kind:'event',id:event.id},selection,setTarget)}>
        <strong>{recordedFunctions.length===1 ? recordedFunctions[0].displayName : event.interface_name}</strong><span>{event.status} · {event.duration_ms === undefined ? '—' : `${event.duration_ms} ms`}</span>
        {recordedFunctions.length>1 ? <small>{t('nativeRelatedProcesses',{count:recordedFunctions.length})}</small> : null}
        <small>{t('nativeAttempt',{attempt:event.attempt})} · {event.started_at}</small>
      </button>}} />}
      <h3>{t('nativeExecutionSteps')}</h3>
      {model.steps.length ? <NativeRecordList {...listProps} label={t('nativeExecutionSteps')} items={model.steps} grid focusIndex={selection.active?.kind==='event' ? model.steps.findIndex(step=>selection.isRelated({kind:'step',id:step.id})) : focusIndex('step',model.steps)} renderItem={step=><button type="button" key={step.id} {...selectionProps({kind:'step',id:step.id},selection,setTarget)}>
        <strong>{step.interfaceName}</strong><span>{step.businessRole} · {step.status}</span><small>{t('nativeAttempt',{attempt:step.attempt})}</small>
      </button>} /> : <p style={noticeStyle}>{t('nativeNoSteps')}</p>}
      {model.execution.length ? <><h3>{t('nativeExecutionGraph')}</h3><Nodes {...listProps} label={t('nativeExecutionGraph')} nodes={model.execution} kind="execution" selection={selection} select={setTarget} /></> : null}
    </> : <>
      <h3>{t('nativeConclusions')}</h3>
      <p style={noticeStyle}>{t('nativeRelationBoundary')}</p>
      {explanation === undefined ? null : claims.length === 0 ? <p style={noticeStyle}>{t('nativeNoClaims')}</p> : <NativeRecordList {...listProps} label={t('nativeConclusions')} items={claims} grid focusIndex={focusIndex('claim',claims)} renderItem={item => <button type="button" key={item.id} {...selectionProps({kind:'claim',id:item.id},selection,setTarget)}>
        <strong>{item.label}</strong><span style={textStyle}>{item.value}</span><small>{item.status} · {item.supportStatus ?? '—'} · {item.attributionStatus ?? '—'}</small>
      </button>} />}
      <NativeRecordList {...listProps} label={t('nativeRelationBoundary')} items={explanation?.requirements ?? []} renderItem={requirement=><p key={requirement.id} style={noticeStyle}>{requirement.label} · {requirement.status}</p>} />
      {claim === undefined ? null : <><p style={textStyle}>{claim.detail}</p>{claim.derivation === undefined ? null : <details><summary>{t('nativeProcessing')}</summary>
        <strong>{claim.derivation.processName}</strong><p style={textStyle}>{claim.derivation.formula}</p><p style={textStyle}>{claim.derivation.boundary}</p>
        <NativeRecordList {...listProps} label={t('nativeProcessing')} items={[...claim.derivation.inputs,...claim.derivation.components]} renderItem={(item,index)=><p key={index} style={textStyle}>{item.label}: {item.value}</p>} />
        <small>{claim.derivation.method} · {claim.derivation.verification ?? '—'}</small>
      </details>}</>}
      <h3>{t('nativeEvidenceNodes')}</h3>
      <Nodes {...listProps} label={t('nativeEvidenceNodes')} nodes={evidence} kind="evidence" selection={selection} select={setTarget} />
      {model.schema.length ? <><h3>{t('nativeSchemaSources')}</h3><Nodes {...listProps} label={t('nativeSchemaSources')} nodes={model.schema} kind="schema" selection={selection} select={setTarget} /></> : null}
      <section><h4>{t('nativeRelationshipRecords')}</h4>
        <NativeRecordList {...listProps} label={t('nativeRelationshipRecords')} items={pairGraph?.edges ?? []} renderItem={edge=><article key={edge.edgeId} style={boxStyle}>
          <p style={textStyle}>{edge.fromId} → {edge.toId} · {edge.kind}</p><PlatformValidation status={edge.validationStatus} reason={edge.reasonCode} />
          <Reference id={edge.fromId} model={model} selection={selection} jump={jump} /><Reference id={edge.toId} model={model} selection={selection} jump={jump} />
          <small>{edge.edgeId}</small>
          <details><summary>{t('nativeTechnicalDetails')}</summary><NativeRecordList {...listProps} label={t('nativeExecutionSteps')} items={edge.operationIds} renderItem={(id,index)=><p key={index} style={textStyle}>Operation: {id}</p>} /></details>
        </article>} />
        <NativeRecordList {...listProps} label={t('nativeRelationshipRecords')} items={pairGraph ? [] : explanation?.evidence.edges ?? []} renderItem={edge=><p key={edge.id} style={textStyle}>{edge.source} → {edge.target} · {edge.label}</p>} />
      </section>
    </>}
    <p style={noticeStyle}>{t('nativeSelectionBoundary')}</p>
    {model.unresolved.size ? <details><summary>{t('nativeUndisclosedRefs')}</summary><NativeRecordList {...listProps} label={t('nativeUndisclosedRefs')} items={[...model.unresolved]} renderItem={id=><p key={id} style={textStyle}>{t('nativeUnresolvedReference',{id})}</p>} /></details> : null}
    <h3>{t('nativeBusinessProcessing')}</h3>
    <p style={noticeStyle}>{t('nativeAllProcessing')}</p>
    {relatedFunctions.length ? null : <p style={noticeStyle}>{t('nativeNoLinkedFunction')}</p>}
    <NativeRecordList {...listProps} label={t('nativeAllProcessing')} pageSize={3} items={functions} focusIndex={selection.active?.kind==='function' ? focusIndex('function',functions) : functions.findIndex(fn=>selection.isRelated({kind:'function',id:fn.id}))} renderItem={fn=><BusinessFunction key={fn.id} value={fn} contextKey={contextKey} focusKey={focusKey} model={model} selection={selection} select={setTarget} jump={jump} />} />
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
function Nodes({nodes,kind,selection,select,label,contextKey,focusKey}:{nodes:NativeChainNode[];kind:'evidence'|'schema'|'execution';selection:Selection;select:(target:NativeTarget)=>void;label:string;contextKey:string;focusKey?:string}) {
  const t=useOpenBknTranslation()
  return nodes.length ? <NativeRecordList label={label} contextKey={contextKey} focusKey={focusKey} items={nodes} grid focusIndex={nodes.findIndex(node=>selection.isSelected({kind,id:node.id}))} renderItem={node=><button type="button" key={node.id} {...selectionProps({kind,id:node.id},selection,select)}><strong>{node.label}</strong><span style={textStyle}>{node.value}</span><small>{node.status ?? node.role ?? '—'}</small></button>} /> : <p style={noticeStyle}>{t('nativeNoClaims')}</p>
}
type ReferenceProps={model:SelectionModel;selection:Selection;jump:(target:NativeTarget)=>void}
function Reference({id,kinds,schemaRef=false,target:explicitTarget,model,selection,jump}:{id:string;kinds?:readonly NativeTargetKind[];schemaRef?:boolean;target?:NativeTarget|null} & ReferenceProps) {
  const t=useOpenBknTranslation();const target=explicitTarget!==undefined ? explicitTarget ?? undefined : schemaRef ? model.resolveSchemaRef(id) : model.resolve(id,kinds)
  const node=model.node(target)
  const step=target?.kind==='step' ? model.steps.find(item=>item.id===target.id) : undefined
  const event=target?.kind==='event' ? model.events.find(item=>item.id===target.id) : undefined
  const attempt=step ?? (event && {interfaceName:event.interface_name,attempt:event.attempt})
  const label=node?.label ?? (attempt ? `${attempt.interfaceName} · ${t('nativeAttempt',{attempt:attempt.attempt})}` : id)
  return target ? <button type="button" aria-label={t('nativeOpenReference',{label})} data-reference-id={id} {...selectionProps(target,selection,jump)}>{label}{label!==id ? <small>{id}</small> : null}</button>
    : <span style={noticeStyle} data-unresolved-reference={id}>{t('nativeUnresolvedReference',{id})}</span>
}
function PlatformValidation({status,reason}:{status:string;reason?:string}) {
  const t=useOpenBknTranslation()
  return <p data-platform-validation={status} style={{...textStyle,fontWeight:650,color:status==='invalid'?'#b45309':'#475569'}}>{t('nativePlatformValidation',{status,reason:reason ?? '—'})}</p>
}
function BusinessFunction({value,contextKey,focusKey,model,selection,select,jump}:{value:NativeBusinessFunction;contextKey:string;focusKey?:string;select:(target:NativeTarget)=>void} & ReferenceProps) {
  const t=useOpenBknTranslation();const refs={model,selection,jump};const listProps={contextKey,focusKey}
  const steps=model.steps.filter(step=>value.operationIds.includes(step.operationId))
  return <section style={boxStyle}><h4 style={{margin:0}}>{value.displayName}</h4>
    <PlatformValidation status={value.validationStatus} reason={value.reasonCode} />
    <p style={textStyle}>{value.businessPurpose}</p>
    <button type="button" {...selectionProps({kind:'function',id:value.id},selection,select)}>{t('nativeSelectProcessing')}</button>
    <strong>{t('nativeInput')}</strong>
    <NativeRecordList {...listProps} label={t('nativeInput')} pageSize={5} items={value.businessInputs} renderItem={(input,index)=><div key={index}>
      <p style={textStyle}>{input.name}: {input.value ?? '—'} · {input.sourceKind ?? '—'}</p>
      {input.sourceRef && input.sourceKind==='function_argument' ? <NativeRecordList {...listProps} label={input.name} items={model.inputSourceTargets(input).length ? model.inputSourceTargets(input) : [null]} renderItem={(target,index)=><Reference key={index} {...refs} id={input.sourceRef!} target={target} />} /> : input.sourceRef ? <Reference {...refs} id={input.sourceRef} kinds={['evidence','schema']} /> : null}
      <NativeRecordList {...listProps} label={input.name} pageSize={10} items={input.evidenceRefs ?? []} renderItem={(id,index)=><Reference key={index} {...refs} id={id} kinds={['evidence','schema']} />} />
    </div>} />
    <strong>{t('nativeProcessing')}</strong><p style={textStyle}>{value.logicSummary}</p>
    <strong>{t('nativeOutput')}</strong>
    <NativeRecordList {...listProps} label={t('nativeOutput')} pageSize={5} items={value.businessOutputs} renderItem={(output,index)=><div key={index}>
      <p style={textStyle}>{output.summary}</p>
      <NativeRecordList {...listProps} label={output.summary} pageSize={10} items={[...output.evidenceRefs,...output.adoptedRowRefs]} renderItem={(id,index)=><Reference key={index} {...refs} id={id} kinds={['evidence']} />} />
    </div>} />
    {value.schemaRefs.length ? <div><strong>{t('nativeSchemaSources')}</strong><NativeRecordList {...listProps} label={t('nativeSchemaSources')} pageSize={10} items={value.schemaRefs} renderItem={(id,index)=><Reference key={index} {...refs} id={id} schemaRef />} /></div> : null}
    <div><strong>{t('nativeExecutionSteps')}</strong><NativeRecordList {...listProps} label={t('nativeExecutionSteps')} items={steps} focusIndex={steps.findIndex(step=>selection.isSelected({kind:'step',id:step.id}))} renderItem={step=><Reference key={step.id} {...refs} id={step.id} kinds={['step']} />} /></div>
    <details><summary>{t('nativeTechnicalDetails')}</summary><p style={textStyle}>{value.id}</p>
      <NativeRecordList {...listProps} label={t('nativeTechnicalDetails')} items={value.operationIds} renderItem={(id,index)=><p key={index} style={textStyle}>Operation: {id}</p>} />
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
const textStyle = { whiteSpace: 'pre-wrap' as const, overflowWrap: 'anywhere' as const, margin: '8px 0', fontSize: 14, lineHeight: 1.6 }
const noticeStyle = { ...textStyle, color: '#64748b' }
const boxStyle = { display: 'grid', gap: 7, padding: 14, border: '1px solid #dce4ec', borderRadius: 10, color: '#172033', background: '#fff', textAlign: 'left' as const, overflowWrap: 'anywhere' as const, minWidth: 0 }
