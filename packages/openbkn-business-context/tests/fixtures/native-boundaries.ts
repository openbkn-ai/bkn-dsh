import { projectNativeExplanation } from '../../src/native-provenance.ts'
import { selectionFixture } from './native-selection.ts'

/** Synthetic fanout within schema-1 byte/cardinality limits; contains no captured platform data. */
export function denseSelectionFixture() {
  const fixture=selectionFixture(),view=fixture.explanation,graph=view.selectedPairGraphs!.p1
  view.execution={nodes:[],edges:[]};view.evidence={nodes:[],edges:[]};view.timeRail=[]
  graph.evidenceNodes=Array.from({length:400},(_,i)=>({id:`n${i}`,label:`Source ${i}`,kind:'source'}))
  graph.schemaNodes=[];graph.executionSteps=[];graph.edges=[]
  graph.claims=[{id:'c1',label:'Platform claim',status:'candidate',nodeIds:['n399']}];view.claims=graph.claims
  const ids=graph.evidenceNodes.map(node=>node.id)
  graph.businessFunctions=Array.from({length:128},(_,i)=>({id:`fn${i}`,displayName:`Processing ${i}`,capabilityKind:'query',businessPurpose:'Recorded purpose',businessInputs:[{name:'Source references',evidenceRefs:ids}],logicSummary:'Recorded logic',businessOutputs:[{summary:'Output references',evidenceRefs:ids,adoptedRowRefs:[]}],operationIds:[],supportsClaimIds:['c1'],schemaRefs:[],validationStatus:'candidate'}))
  const result=projectNativeExplanation({schema_version:'1',interaction_id:'int-fixture',status:'ready',generated_at:'2026-10-19T00:00:00Z',view},'int-fixture')
  if(result.kind!=='ready')throw new Error('ready dense fixture required')
  fixture.view.native={detail:{kind:'ready',view:{interactionId:'int-fixture',knowledgeNetworkIds:['kn1'],timeRail:[]}},explanation:result}
  return {view:fixture.view,explanation:result.view,rail:result.view.timeRail!}
}

/** Two independent paths using the same definition, with the pinned EE edge directions. */
export function sharedSchemaFixture(validationStatus='candidate') {
  const fixture=selectionFixture(),view=fixture.explanation,graph=view.selectedPairGraphs!.p1,base=graph.businessFunctions[0]
  view.execution={nodes:[1,2].map(i=>({id:`x${i}`,label:`Execution ${i}`,kind:'result'})),edges:[]};view.evidence={nodes:[],edges:[]}
  graph.claims=[1,2].map(i=>({id:`c${i}`,label:`Claim ${i}`,status:'candidate',nodeIds:[`n${i}`]}));view.claims=graph.claims
  graph.evidenceNodes=[1,2].map(i=>({id:`n${i}`,label:`Output ${i}`,kind:'result',executionNodeId:`x${i}`}))
  graph.schemaNodes=[{id:'schema:object:Order',label:'Order definition',kind:'object',role:'context'}]
  graph.businessFunctions=[1,2].map(i=>({...structuredClone(base),id:`fn${i}`,displayName:`Function ${i}`,businessInputs:[],businessOutputs:[{summary:`Output ${i}`,evidenceRefs:[`n${i}`],adoptedRowRefs:[]}],operationIds:[`op${i}`],supportsClaimIds:[`c${i}`],schemaRefs:['object:Order'],validationStatus:i===1?'candidate':validationStatus,reasonCode:`platform_reason_${i}`}))
  view.timeRail=[1,2].map(i=>({...fixture.rail[0],id:`t${i}`,operation_id:`op${i}`,attempt:1,order:i}))
  view.timeRail.push({...view.timeRail[0],id:'t1-retry',attempt:2,order:3})
  graph.executionSteps=view.timeRail.map(event=>({id:`step-${event.id}`,operationId:event.operation_id,attempt:event.attempt,businessRole:'query',interfaceName:event.interface_name,status:event.status,timeRailItemId:event.id}))
  graph.edges=[1,2].flatMap(i=>[
    {edgeId:`schema-${i}`,kind:'uses_schema',fromId:`fn${i}`,toId:'schema:object:Order',operationIds:[`op${i}`],validationStatus:'verified'},
    {edgeId:`supports-${i}`,kind:'supports',fromId:`fn${i}`,toId:`c${i}`,operationIds:[`op${i}`],validationStatus:i===1?'candidate':validationStatus},
    {edgeId:`grounds-${i}`,kind:'grounds',fromId:'schema:object:Order',toId:`c${i}`,operationIds:[],validationStatus:'verified'},
    {edgeId:`describes-${i}`,kind:'describes',fromId:'schema:object:Order',toId:`n${i}`,operationIds:[],validationStatus:'verified'},
  ])
  return admitFixture(fixture)
}

/** Long events, requirements and references coexist; all arrays are admitted by the real projector. */
export function pagingSelectionFixture() {
  const fixture=selectionFixture(),view=fixture.explanation,graph=view.selectedPairGraphs!.p1,base=fixture.rail[0]
  view.execution={nodes:[],edges:[]};view.evidence={nodes:[],edges:[]}
  view.timeRail=Array.from({length:45},(_,i)=>({...base,id:`t${i}`,attempt:i+1,order:i}))
  graph.executionSteps=view.timeRail.map((event,i)=>({id:`s${i}`,operationId:event.operation_id,attempt:event.attempt,businessRole:'query',interfaceName:`Step ${i}`,status:event.status,timeRailItemId:event.id}))
  graph.evidenceNodes=Array.from({length:45},(_,i)=>({id:`n${i}`,label:`Source ${i}`,kind:'source'}));graph.schemaNodes=[];graph.edges=[]
  graph.claims[0].nodeIds=['n44'];graph.claims[1].nodeIds=[]
  graph.businessFunctions[0].businessInputs=[{name:'Source references',evidenceRefs:['n44','n0']}]
  graph.businessFunctions[0].businessOutputs=[];graph.businessFunctions[0].schemaRefs=[]
  view.requirements=Array.from({length:45},(_,i)=>({id:`r${i}`,label:`Requirement ${i}`,status:'partial',claimIds:[]}))
  return admitFixture(fixture)
}

function admitFixture(fixture:ReturnType<typeof selectionFixture>) {
  const explanation=projectNativeExplanation({schema_version:'1',interaction_id:'int-fixture',status:'ready',generated_at:'2026-10-19T00:00:00Z',view:fixture.explanation},'int-fixture')
  if(explanation.kind!=='ready')throw new Error('ready fixture required')
  const rail=explanation.view.timeRail!
  fixture.view.native={detail:{kind:'ready',view:{interactionId:'int-fixture',knowledgeNetworkIds:['kn1'],timeRail:rail}},explanation}
  return {view:fixture.view,explanation:explanation.view,rail}
}
