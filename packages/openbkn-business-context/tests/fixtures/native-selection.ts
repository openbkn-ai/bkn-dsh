import { readFileSync } from 'node:fs'
import { projectNativeExplanation } from '../../src/native-provenance.ts'
import type { ProvenanceView } from '../../src/types.ts'

/** Synthetic relationships from the pinned schema-1 contract, never a captured live response. */
export function selectionFixture() {
  const raw=JSON.parse(readFileSync(new URL('./native-provenance-schema1.json',import.meta.url),'utf8'))
  raw.view.execution={nodes:[
    {id:'x-in',label:'输入执行节点',kind:'source'},
    {id:'x-out',label:'输出执行节点',kind:'result'},
    {id:'x-unrelated',label:'同值执行节点',kind:'result',value:'42'},
  ],edges:[]}
  const claims=[{id:'c1',label:'候选结论',status:'candidate',nodeIds:['output','missing-evidence']},{id:'c2',label:'同值其他结论',status:'candidate',nodeIds:['unrelated']}]
  raw.view.claims=claims
  raw.view.questionPairs=[{id:'p1',question:'Q',answer:'A',summary:'第一问题',status:'partial',claimIds:['c1','c2']},{id:'p2',question:'Q2',answer:'A2',summary:'第二问题',status:'partial',claimIds:['other-claim']}]
  raw.view.timeRail=[
    {id:'t1',order:1,operation_id:'op1',attempt:1,interface_name:'查询第一次',protocol:'mcp',status:'failed',started_at:'2026-10-18T03:00:00Z'},
    {id:'t2',order:2,operation_id:'op1',attempt:2,interface_name:'查询第二次',protocol:'mcp',status:'completed',started_at:'2026-10-18T03:00:01Z'},
    {id:'t3',order:3,operation_id:'other-operation',attempt:1,interface_name:'其他事件',protocol:'mcp',status:'completed',started_at:'2026-10-18T03:00:02Z'},
  ]
  raw.view.selectedPairGraphs={p1:{claims,evidenceNodes:[
    {id:'input',label:'输入来源',kind:'source',executionNodeId:'x-in',value:'42'},
    {id:'output',label:'输出证据',kind:'result',executionNodeId:'x-out',value:'42'},
    {id:'unrelated',label:'同值无关证据',kind:'source',value:'42'},
  ],schemaNodes:[{id:'schema1',label:'业务定义来源',kind:'object'}],businessFunctions:[{
    id:'fn1',displayName:'业务查询',capabilityKind:'query',businessPurpose:'查询业务记录',
    businessInputs:[{name:'查询条件',value:'42',sourceRef:'input',evidenceRefs:['input','missing-source']}],
    logicSummary:'平台处理原文',businessOutputs:[{summary:'业务结果',evidenceRefs:['output'],adoptedRowRefs:['opaque-row']}],
    operationIds:['op1'],supportsClaimIds:['c1'],schemaRefs:['schema1'],validationStatus:'candidate',
  }],executionSteps:[
    {id:'s1',operationId:'op1',attempt:1,businessRole:'query',interfaceName:'查询步骤一',status:'failed',timeRailItemId:'t1'},
    {id:'s2',operationId:'op1',attempt:2,businessRole:'query',interfaceName:'查询步骤二',status:'completed',timeRailItemId:'t2'},
  ],edges:[{edgeId:'support',kind:'support',fromId:'output',toId:'c1',operationIds:['op1'],validationStatus:'candidate'}]},p2:{
    claims:[{id:'other-claim',label:'其他问题结论',status:'candidate',nodeIds:['other-source']}],
    evidenceNodes:[{id:'other-source',label:'其他问题来源',kind:'source'}],schemaNodes:[],businessFunctions:[],executionSteps:[],edges:[],
  }}
  const explanation=projectNativeExplanation(raw,'int-fixture')
  if(explanation.kind!=='ready') throw new Error('ready fixture required')
  const rail=explanation.view.timeRail!
  const view:ProvenanceView={interactionId:'int-fixture',native:{detail:{kind:'ready',view:{interactionId:'int-fixture',knowledgeNetworkIds:['kn1'],timeRail:rail}},explanation},timeline:[],sources:{timeline:'local-session',operations:'unavailable',business:'unavailable',evidence:'unavailable',degraded:[]},execution:{operations:[]},business:{kind:'unavailable'},evidence:{kind:'unavailable',reason:'no-receipts'}}
  return {view,explanation:explanation.view,rail}
}
