import type { NativeBusinessFunction, NativeChainNode, NativeClaim, NativeExplanation, NativePairGraph, NativeTimeItem } from '../native-provenance-types.ts'

export type NativeTargetKind = 'claim' | 'evidence' | 'schema' | 'execution' | 'step' | 'event' | 'function'
export interface NativeTarget { kind: NativeTargetKind; id: string }
export const targetKey = (target: NativeTarget) => JSON.stringify([target.kind, target.id])

/** A display-only index of disclosed dependencies, scoped to the selected question pair. */
export function nativeSelectionModel(explanation: NativeExplanation | undefined, pairId: string | undefined, rail: readonly NativeTimeItem[]) {
  const pair = explanation?.questionPairs?.find(item => item.id === pairId) ?? explanation?.questionPairs?.[0]
  const graph: NativePairGraph | undefined = pair && explanation?.selectedPairGraphs && Object.hasOwn(explanation.selectedPairGraphs, pair.id) ? explanation.selectedPairGraphs[pair.id] : undefined
  const claims: NativeClaim[] = graph?.claims ?? (explanation?.claims ?? []).filter(item => !pair || pair.claimIds.includes(item.id))
  const evidence = graph?.evidenceNodes ?? explanation?.evidence.nodes ?? []
  const schema = graph?.schemaNodes ?? []
  const execution = explanation?.execution.nodes ?? []
  const steps = graph?.executionSteps ?? []
  const functions = graph?.businessFunctions ?? []
  const stepsByOperation = new Map<string, typeof steps>()
  const eventsByOperation = new Map<string, NativeTimeItem[]>()
  const eventsById = new Map(rail.map(event=>[event.id,event]))
  for (const step of steps) { if (!stepsByOperation.has(step.operationId)) stepsByOperation.set(step.operationId,[]); stepsByOperation.get(step.operationId)!.push(step) }
  for (const event of rail) { if (!eventsByOperation.has(event.operation_id)) eventsByOperation.set(event.operation_id,[]); eventsByOperation.get(event.operation_id)!.push(event) }
  const targets = new Map<string, NativeTarget>()
  const ids = new Map<string, NativeTarget[]>()
  const dependencies = new Map<string, Set<string>>()
  const dependents = new Map<string, Set<string>>()
  const unresolved = new Set<string>()
  function register(kind: NativeTargetKind, values: readonly {id:string}[]) {
    for (const {id} of values) {
      const target = {kind,id}; targets.set(targetKey(target),target)
      ids.set(id,[...(ids.get(id) ?? []),target])
    }
  }
  register('claim',claims); register('evidence',evidence); register('schema',schema)
  register('execution',execution); register('step',steps); register('event',rail); register('function',functions)
  function resolve(id: string, kinds?: readonly NativeTargetKind[]): NativeTarget | undefined {
    const matches = (ids.get(id) ?? []).filter(target => !kinds || kinds.includes(target.kind))
    return matches.length === 1 ? matches[0] : undefined
  }
  // Schema-1 emits raw schemaRefs and prefixes the corresponding node IDs with "schema:".
  // Retain exact IDs used by older records, but never choose between two disclosed targets.
  function resolveSchemaRef(id: string): NativeTarget | undefined {
    const matches=schema.filter(node=>node.id===id || node.id===`schema:${id}`)
    return matches.length===1 ? {kind:'schema',id:matches[0].id} : undefined
  }
  function operationTargets(id: string): NativeTarget[] {
    const matchingSteps=stepsByOperation.get(id) ?? []
    return matchingSteps.length ? matchingSteps.map(step=>({kind:'step',id:step.id})) : (eventsByOperation.get(id) ?? []).map(event=>({kind:'event',id:event.id}))
  }
  function inputSourceTargets(input: NativeBusinessFunction['businessInputs'][number]): NativeTarget[] {
    if (!input.sourceRef) return []
    if (input.sourceKind==='function_argument') return operationTargets(input.sourceRef)
    const target=resolve(input.sourceRef,['evidence','schema'])
    return target ? [target] : []
  }
  function link(from: NativeTarget, to: NativeTarget) {
    const a = targetKey(from), b = targetKey(to)
    if (!targets.has(a) || !targets.has(b)) return
    if (!dependencies.has(a)) dependencies.set(a,new Set())
    if (!dependents.has(b)) dependents.set(b,new Set())
    dependencies.get(a)!.add(b); dependents.get(b)!.add(a)
  }
  function reference(from: NativeTarget, id: string, kinds: readonly NativeTargetKind[], output = false) {
    const to = resolve(id,kinds)
    if (!to) { unresolved.add(id); return }
    if (output) link(to,from)
    else link(from,to)
  }
  function operations(from: NativeTarget, operationIds: readonly string[]) {
    // A relation's operation metadata cannot override a step/event's exact attempt identity.
    if (from.kind==='step' || from.kind==='event') return
    for (const id of new Set(operationIds)) {
      const matchingSteps = stepsByOperation.get(id) ?? []
      const matchingEvents = eventsByOperation.get(id) ?? []
      if (!matchingSteps.length && !matchingEvents.length) unresolved.add(id)
      for (const step of matchingSteps) link(from,{kind:'step',id:step.id})
      for (const event of matchingEvents) link(from,{kind:'event',id:event.id})
    }
  }
  for (const claim of claims) for (const id of claim.nodeIds) reference({kind:'claim',id:claim.id},id,['evidence'])
  for (const node of evidence) if (node.executionNodeId) reference({kind:'evidence',id:node.id},node.executionNodeId,['execution'])
  for (const node of schema) if (node.executionNodeId) reference({kind:'schema',id:node.id},node.executionNodeId,['execution'])
  for (const fn of functions) {
    const from: NativeTarget = {kind:'function',id:fn.id}
    for (const id of fn.supportsClaimIds) reference(from,id,['claim'],true)
    for (const input of fn.businessInputs) {
      if (input.sourceRef && input.sourceKind==='function_argument') operations(from,[input.sourceRef])
      else if (input.sourceRef) reference(from,input.sourceRef,['evidence','schema'])
      for (const id of new Set(input.evidenceRefs ?? [])) reference(from,id,['evidence','schema'])
    }
    for (const output of fn.businessOutputs) for (const id of new Set([...output.evidenceRefs,...output.adoptedRowRefs])) reference(from,id,['evidence'],true)
    for (const id of fn.schemaRefs) {
      const to=resolveSchemaRef(id)
      if(to) link(from,to);else unresolved.add(id)
    }
    operations(from,fn.operationIds)
  }
  for (const step of steps) {
    const event = eventsById.get(step.timeRailItemId)
    // An operation can have several attempts. Never substitute another attempt or guess an event.
    if (event && event.operation_id === step.operationId && event.attempt === step.attempt) link({kind:'step',id:step.id},{kind:'event',id:event.id})
    else unresolved.add(step.timeRailItemId)
  }
  const edges = graph?.edges ?? []
  for (const edge of edges) {
    const from = resolve(edge.fromId), to = resolve(edge.toId)
    if (from && to) { link(to,from); operations(from,edge.operationIds); operations(to,edge.operationIds) }
    else { if (!from) unresolved.add(edge.fromId); if (!to) unresolved.add(edge.toId) }
  }
  // Do not mix top-level evidence edges into a different selected-pair graph.
  for (const [kind,chainEdges] of [['evidence',graph ? [] : explanation?.evidence.edges ?? []],['execution',explanation?.execution.edges ?? []]] as const) {
    for (const edge of chainEdges) {
      const from=resolve(edge.source,[kind]), to=resolve(edge.target,[kind])
      if (from && to) link(to,from)
      else { if (!from) unresolved.add(edge.source); if (!to) unresolved.add(edge.target) }
    }
  }
  function selection(requested?: NativeTarget) {
    const active = requested ? (targets.has(targetKey(requested)) ? requested : undefined) : claims[0] ? {kind:'claim' as const,id:claims[0].id} : undefined
    const related = new Set<string>()
    let attemptTargets: Set<string> | undefined
    if (active?.kind==='event' || active?.kind==='step') {
      attemptTargets=new Set([targetKey(active)])
      const event=active.kind==='event' ? eventsById.get(active.id) : eventsById.get(steps.find(step=>step.id===active.id)!.timeRailItemId)
      if (event) for (const step of steps) {
        if (step.timeRailItemId===event.id && step.operationId===event.operation_id && step.attempt===event.attempt && (active.kind==='event' || active.id===step.id)) {
          attemptTargets.add(targetKey({kind:'event',id:event.id}));attemptTargets.add(targetKey({kind:'step',id:step.id}))
        }
      }
    }
    function walk(starts: Iterable<string>, direction: Map<string,Set<string>>, blocked: readonly NativeTargetKind[] = []) {
      const seen = new Set<string>(), queue = [...starts]
      for (let index=0;index<queue.length;index++) {
        const key=queue[index]
        const kind=targets.get(key)!.kind
        if (seen.has(key) || blocked.includes(kind) || (attemptTargets && (kind==='step' || kind==='event') && !attemptTargets.has(key))) continue
        seen.add(key); related.add(key)
        for (const next of direction.get(key) ?? []) queue.push(next)
      }
    }
    if (active) {
      const key=targetKey(active)
      walk([key],dependencies); walk([key],dependents)
      // Include the disclosed inputs/outputs of related processing, without traversing
      // another claim or fanning a selected attempt out to its sibling attempts.
      const nodeSelection=['evidence','schema','execution'].includes(active.kind)
      const relatedFunctions=functions.filter(fn => related.has(targetKey({kind:'function',id:fn.id})) || (nodeSelection &&
        [...(dependencies.get(targetKey({kind:'function',id:fn.id})) ?? []),...(dependents.get(targetKey({kind:'function',id:fn.id})) ?? [])]
          .some(key => related.has(key) && ['evidence','schema','execution'].includes(targets.get(key)!.kind))))
      const contextStarts=new Set<string>()
      for (const fn of relatedFunctions) {
        const fnKey=targetKey({kind:'function',id:fn.id}); related.add(fnKey)
        if (nodeSelection) for (const next of dependents.get(fnKey) ?? []) if (targets.get(next)!.kind==='claim') related.add(next)
        for (const next of [...(dependencies.get(fnKey) ?? []),...(dependents.get(fnKey) ?? [])]) contextStarts.add(next)
      }
      const blocked: NativeTargetKind[]=['claim','function',...(active.kind==='event' || active.kind==='step' ? ['event','step'] as const : [])]
      walk(contextStarts,dependencies,blocked)
    }
    return {active, related, isRelated:(target:NativeTarget)=>related.has(targetKey(target)), isSelected:(target:NativeTarget)=>active!==undefined && targetKey(active)===targetKey(target)}
  }
  function node(target: NativeTarget | undefined): NativeChainNode | undefined {
    return target && ({evidence,schema,execution} as Partial<Record<NativeTargetKind,NativeChainNode[]>>)[target.kind]?.find(node=>node.id===target.id)
  }
  return {pair,graph,claims,evidence,schema,execution,steps,functions,events:rail,resolve,resolveSchemaRef,operationTargets,inputSourceTargets,selection,node,unresolved}
}
