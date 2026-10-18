import { useState } from 'react'
import type { NativeExplanation, NativeReadFailure, NativeBusinessFunction, NativeChainNode } from '../native-provenance-types.ts'
import type { ProvenanceView } from '../types.ts'
import { useOpenBknTranslation } from './locale.tsx'

/** Relationships are selected by disclosed identifiers only; no text, value or temporal matching. */
export function NativeProvenancePanel({ view, tab }: { view: ProvenanceView; tab: 'events' | 'evidence' }) {
  const t = useOpenBknTranslation()
  const [pairId, setPairId] = useState<string>()
  const [claimId, setClaimId] = useState<string>()
  const [nodeId, setNodeId] = useState<string>()
  const [operationId, setOperationId] = useState<string>()
  const native = view.native
  const traceDisabled = view.sources.degraded.some(item => item.reason === 'trace-disabled')
  const traceUnavailable = view.sources.degraded.some(item => item.reason === 'trace-unavailable')
  const result = native?.explanation
  const explanation = result?.kind === 'ready' ? result.view : undefined
  const pair = explanation?.questionPairs?.find(item => item.id === pairId) ?? explanation?.questionPairs?.[0]
  const pairGraph = pair !== undefined && explanation?.selectedPairGraphs !== undefined && Object.hasOwn(explanation.selectedPairGraphs, pair.id) ? explanation.selectedPairGraphs[pair.id] : undefined
  const claims = pairGraph?.claims ?? (explanation?.claims ?? []).filter(claim => pair === undefined || pair.claimIds.includes(claim.id))
  const claim = claims.find(item => item.id === claimId) ?? claims[0]
  const evidence = pairGraph?.evidenceNodes ?? explanation?.evidence.nodes ?? []
  const selectedNode = evidence.find(item => item.id === nodeId)
  const rail = native?.detail.kind === 'ready' ? native.detail.view.timeRail : explanation?.timeRail ?? []
  const functions = pairGraph?.businessFunctions ?? []
  const relatedFunctions = functions.filter(fn => tab === 'events' && operationId !== undefined ? fn.operationIds.includes(operationId) : claim !== undefined && fn.supportsClaimIds.includes(claim.id))
  const question = native?.detail.kind === 'ready' ? native.detail.view.question : explanation?.question
  const answer = native?.detail.kind === 'ready' ? native.detail.view.answer : explanation?.answer
  return <div style={{ display: 'grid', gap: 16 }}>
    <p style={noticeStyle}>{t('nativeRecordedAnswer')}</p>
    {question === undefined && answer === undefined ? null : <section style={boxStyle}>
      <strong>{t('question')}</strong><p style={textStyle}>{question ?? '—'}</p>
      <strong>{t('answer')}</strong><p style={textStyle}>{answer ?? '—'}</p>
    </section>}
    {explanation === undefined ? <p role="status" style={noticeStyle}>{traceDisabled ? t('noProvenanceRecordedTraceDisabled') : traceUnavailable ? t('noProvenanceRecordedTraceUnavailable') : result?.kind === 'not-generated' ? t('nativeNotGenerated') : <NativeFailure reason={result?.kind === 'unavailable' ? result.reason : 'unavailable'} />}</p> : <>
      <p style={noticeStyle}>{t('nativeStates', { status: explanation.status, evidence: explanation.evidenceStatus ?? '—', generation: explanation.generationStatus ?? '—' })}</p>
      {explanation.notices?.map((notice, index) => <p key={index} role="status" style={noticeStyle}>{notice}</p>)}
      {explanation.questionPairs?.length ? <label>{t('nativeQuestionPair')} <select value={pair?.id ?? ''} onChange={event => { setPairId(event.target.value); setClaimId(undefined); setNodeId(undefined); setOperationId(undefined) }}>
        {explanation.questionPairs.map(item => <option key={item.id} value={item.id}>{item.summary || item.question}</option>)}
      </select></label> : null}
    </>}
    {native?.detail.kind === 'ready' && native.detail.view.recordIntegrity !== undefined ? <p role="status" style={noticeStyle}>{t('nativeRecordIntegrity', { status: native.detail.view.recordIntegrity.status, count: native.detail.view.recordIntegrity.missing.length })}</p> : null}
    {native?.detail.kind === 'ready' && native.detail.view.recordIntegrityCheckFailed ? <p role="status" style={noticeStyle}>{t('nativeIntegrityUnavailable')}</p> : null}
    {tab === 'events' ? <>
      <h3>{t('nativeEvents')}</h3>
      {native?.detail.kind === 'unavailable' ? <p role="status" style={noticeStyle}><NativeFailure reason={native.detail.reason} /></p> : null}
      {native?.detail.kind === 'ready' && native.detail.view.recordIntegrity?.missing.length ? <details><summary>{t('nativeTechnicalDetails')}</summary>{native.detail.view.recordIntegrity.missing.map((gap,index) => <p key={index} style={textStyle}>{gap.operation_id} · {gap.attempt} · {gap.reason} · {gap.field}</p>)}</details> : null}
      {rail.length === 0 ? <p style={noticeStyle}>{t('nativeNoEvents')}</p> : <div style={gridStyle}>{rail.map(event => <button type="button" key={event.id} aria-pressed={operationId === event.operation_id} onClick={() => setOperationId(event.operation_id)} style={{ ...boxStyle, cursor: 'pointer', borderColor: operationId === event.operation_id ? '#087d72' : '#dce4ec' }}>
        <strong>{functions.find(fn => fn.operationIds.includes(event.operation_id))?.displayName ?? event.interface_name}</strong><span>{event.status} · {event.duration_ms === undefined ? '—' : `${event.duration_ms} ms`}</span>
        <small>{event.started_at}</small>
      </button>)}</div>}
    </> : <>
      <h3>{t('nativeConclusions')}</h3>
      <p style={noticeStyle}>{t('nativeRelationBoundary')}</p>
      {explanation === undefined ? null : claims.length === 0 ? <p style={noticeStyle}>{t('nativeNoClaims')}</p> : <div style={gridStyle}>{claims.map(item => <button type="button" key={item.id} aria-pressed={claim?.id === item.id} onClick={() => { setClaimId(item.id); setNodeId(undefined) }} style={{ ...boxStyle, cursor: 'pointer', borderColor: claim?.id === item.id ? '#087d72' : '#dce4ec' }}>
        <strong>{item.label}</strong><span style={textStyle}>{item.value}</span><small>{item.status} · {item.supportStatus ?? '—'} · {item.attributionStatus ?? '—'}</small>
      </button>)}</div>}
      {explanation?.requirements?.map(requirement => <p key={requirement.id} style={noticeStyle}>{requirement.label} · {requirement.status}</p>)}
      {claim === undefined ? null : <><p style={textStyle}>{claim.detail}</p>{claim.derivation === undefined ? null : <details><summary>{t('nativeProcessing')}</summary>
        <strong>{claim.derivation.processName}</strong><p style={textStyle}>{claim.derivation.formula}</p><p style={textStyle}>{claim.derivation.boundary}</p>
        {[...claim.derivation.inputs,...claim.derivation.components].map((item,index) => <p key={index} style={textStyle}>{item.label}: {item.value}</p>)}
        <small>{claim.derivation.method} · {claim.derivation.verification ?? '—'}</small>
      </details>}</>}
      <h3>{t('nativeEvidenceNodes')}</h3>
      <div style={gridStyle}>{evidence.map(node => <button type="button" key={node.id} aria-pressed={node.id === nodeId} onClick={() => setNodeId(node.id)} style={{ ...boxStyle, cursor: 'pointer', borderColor: claim?.nodeIds.includes(node.id) ? '#087d72' : '#dce4ec', background: node.id === nodeId ? '#effaf7' : '#fff' }}>
        <strong>{node.label}</strong><span>{node.value}</span><small>{node.kind} · {node.status ?? '—'}</small>
        {claim?.nodeIds.includes(node.id) ? <small>{t('nativeServerLinked')}</small> : null}
      </button>)}</div>
      {selectedNode === undefined ? null : <NodeDetail node={selectedNode} />}
      {claim?.nodeIds.some(id => !evidence.some(node => node.id === id)) ? <p role="status" style={noticeStyle}>{t('nativeUndisclosedRefs')}</p> : null}
      <details><summary>{t('nativeRelationshipRecords')}</summary>
        {(pairGraph?.edges ?? []).map(edge => <p key={edge.edgeId} style={textStyle}>{edge.fromId} → {edge.toId} · {edge.kind} · {edge.validationStatus}</p>)}
        {(explanation?.evidence.edges ?? []).map(edge => <p key={edge.id} style={textStyle}>{edge.source} → {edge.target} · {edge.label}</p>)}
      </details>
    </>}
    <h3>{t('nativeBusinessProcessing')}</h3>
    {relatedFunctions.length ? relatedFunctions.map(fn => <BusinessFunction key={fn.id} value={fn} />) : <p style={noticeStyle}>{t('nativeNoLinkedFunction')}</p>}
    {explanation === undefined ? null : <details><summary>{t('nativeTechnicalDetails')}</summary>
      <p style={textStyle}>Interaction: {explanation.interactionId}</p><p>{result?.kind === 'ready' ? result.generatedAt : ''}</p>
      <details><summary>{t('nativeExecutionGraph')}</summary>{explanation.execution.nodes.map(node => <NodeDetail key={node.id} node={node} />)}</details>
    </details>}
  </div>
}
function BusinessFunction({ value }: { value: NativeBusinessFunction }) {
  const t = useOpenBknTranslation()
  return <section style={boxStyle}><h4 style={{ margin: 0 }}>{value.displayName}</h4><p style={textStyle}>{value.businessPurpose}</p>
    <strong>{t('nativeInput')}</strong>{value.businessInputs.map((input,index) => <p key={index} style={textStyle}>{input.name}: {input.value ?? '—'} · {input.sourceKind ?? '—'}</p>)}
    <strong>{t('nativeProcessing')}</strong><p style={textStyle}>{value.logicSummary}</p>
    <strong>{t('nativeOutput')}</strong>{value.businessOutputs.map((output,index) => <p key={index} style={textStyle}>{output.summary}</p>)}
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
const boxStyle = { display: 'grid', gap: 7, padding: 14, border: '1px solid #dce4ec', borderRadius: 10, color: '#172033', background: '#fff', textAlign: 'left' as const, minWidth: 0 }
