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
