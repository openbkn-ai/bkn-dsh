import assert from 'node:assert/strict'
import test from 'node:test'
import { nativeSelectionModel, targetKey } from '../src/client/native-provenance-selection.ts'
import { selectionFixture } from './fixtures/native-selection.ts'
import { sharedSchemaFixture } from './fixtures/native-boundaries.ts'

for(const status of ['candidate','invalid','future-platform-status']) test(`shared definitions never merge independent claim paths with ${status} records`,()=>{
  const {explanation,rail}=sharedSchemaFixture(status),before=JSON.stringify(explanation)
  const model=nativeSelectionModel(explanation,'p1',rail)
  for(const root of [{kind:'claim',id:'c1'},{kind:'evidence',id:'n1'},{kind:'execution',id:'x1'},{kind:'event',id:'t1'},{kind:'step',id:'step-t1'}] as const) {
    const selected=model.selection(root)
    assert.ok(selected.isRelated({kind:'function',id:'fn1'}),targetKey(root))
    assert.ok(selected.isRelated({kind:'schema',id:'schema:object:Order'}),targetKey(root))
    for(const other of [{kind:'function',id:'fn2'},{kind:'evidence',id:'n2'},{kind:'execution',id:'x2'},{kind:'claim',id:'c2'},{kind:'event',id:'t2'},{kind:'step',id:'step-t2'}] as const)assert.equal(selected.isRelated(other),false,`${targetKey(root)} → ${targetKey(other)}`)
  }
  assert.equal(model.functions[1].validationStatus,status)
  assert.equal(JSON.stringify(explanation),before)
})

test('selecting a shared definition retains both disclosed paths without making it an execution owner',()=>{
  const {explanation,rail}=sharedSchemaFixture('invalid'),model=nativeSelectionModel(explanation,'p1',rail)
  const selected=model.selection({kind:'schema',id:'schema:object:Order'})
  for(const id of ['fn1','fn2'])assert.ok(selected.isRelated({kind:'function',id}))
  for(const id of ['c1','c2'])assert.ok(selected.isRelated({kind:'claim',id}))
  assert.equal(model.functions[1].validationStatus,'invalid')
})

test('schema and operation navigation still works when only the disclosed edges provide those references',()=>{
  const {explanation,rail}=sharedSchemaFixture(),graph=explanation.selectedPairGraphs!.p1
  for(const fn of graph.businessFunctions){fn.schemaRefs=[];fn.operationIds=[];fn.supportsClaimIds=[];fn.businessOutputs=[]}
  for(const claim of graph.claims)claim.nodeIds=[]
  graph.edges=graph.edges.filter(edge=>edge.kind==='uses_schema'||edge.kind==='supports')
  const selected=nativeSelectionModel(explanation,'p1',rail).selection({kind:'claim',id:'c1'})
  assert.ok(selected.isRelated({kind:'function',id:'fn1'}));assert.ok(selected.isRelated({kind:'schema',id:'schema:object:Order'}))
  assert.ok(selected.isRelated({kind:'event',id:'t1'}));assert.ok(selected.isRelated({kind:'event',id:'t1-retry'}))
  assert.equal(selected.isRelated({kind:'function',id:'fn2'}),false);assert.equal(selected.isRelated({kind:'event',id:'t2'}),false)
})

test('unexpected uses_schema roles remain raw records without being guessed into a processing dependency',()=>{
  const {explanation,rail}=sharedSchemaFixture(),graph=explanation.selectedPairGraphs!.p1
  graph.businessFunctions[0].schemaRefs=[]
  const edge=graph.edges.find(edge=>edge.edgeId==='schema-1')!
  edge.toId='n2';edge.validationStatus='invalid';edge.reasonCode='platform_role_reason'
  const before=JSON.stringify(explanation),selected=nativeSelectionModel(explanation,'p1',rail).selection({kind:'claim',id:'c1'})
  assert.equal(selected.isRelated({kind:'evidence',id:'n2'}),false)
  assert.equal(selected.isRelated({kind:'function',id:'fn2'}),false)
  assert.equal(JSON.stringify(explanation),before)
})

test('pinned platform schema references and managed arguments use their disclosed namespaces',()=>{
  const {explanation,rail}=selectionFixture();const graph=explanation.selectedPairGraphs!.p1
  graph.schemaNodes=[{id:'schema:object:Order',label:'Order',kind:'object'}]
  graph.businessFunctions[0].schemaRefs=['object:Order']
  graph.businessFunctions[0].businessInputs=[{name:'arguments',sourceKind:'function_argument',sourceRef:'op1'}]
  const model=nativeSelectionModel(explanation,'p1',rail)
  assert.equal(model.unresolved.has('object:Order'),false)
  assert.equal(model.unresolved.has('op1'),false)
  assert.ok(model.selection().isRelated({kind:'schema',id:'schema:object:Order'}))
  assert.ok(model.selection({kind:'step',id:'s2'}).isRelated({kind:'function',id:'fn1'}))
  assert.equal(model.selection({kind:'step',id:'s2'}).isRelated({kind:'step',id:'s1'}),false)
})

test('schema aliases never choose between two records and argument refs never become same-ID evidence',()=>{
  const {explanation,rail}=selectionFixture();const graph=explanation.selectedPairGraphs!.p1;const fn=graph.businessFunctions[0]
  graph.schemaNodes=[{id:'object:Order',label:'Exact',kind:'object'},{id:'schema:object:Order',label:'Prefixed',kind:'object'}]
  graph.evidenceNodes.push({id:'op1',label:'Same ID evidence',kind:'source'})
  fn.schemaRefs=['object:Order'];fn.businessInputs=[{name:'Arguments',sourceKind:'function_argument',sourceRef:'op1'}]
  const model=nativeSelectionModel(explanation,'p1',rail)
  assert.equal(model.resolveSchemaRef('object:Order'),undefined);assert.ok(model.unresolved.has('object:Order'))
  assert.deepEqual(model.inputSourceTargets(fn.businessInputs[0]),[{kind:'step',id:'s1'},{kind:'step',id:'s2'}])
  assert.equal(model.selection().isRelated({kind:'evidence',id:'op1'}),false)
  assert.equal(model.selection().isRelated({kind:'schema',id:'object:Order'}),false)
})

test('argument refs retain every disclosed event when steps are absent and missing operations stay unresolved',()=>{
  const {explanation,rail}=selectionFixture();const graph=explanation.selectedPairGraphs!.p1;const fn=graph.businessFunctions[0]
  graph.executionSteps=[];fn.operationIds=[]
  fn.businessInputs=[{name:'Arguments',sourceKind:'function_argument',sourceRef:'op1'},{name:'Missing',sourceKind:'function_argument',sourceRef:'input'}]
  const model=nativeSelectionModel(explanation,'p1',rail)
  assert.deepEqual(model.inputSourceTargets(fn.businessInputs[0]),[{kind:'event',id:'t1'},{kind:'event',id:'t2'}])
  assert.deepEqual(model.inputSourceTargets(fn.businessInputs[1]),[]);assert.ok(model.unresolved.has('input'))
  assert.ok(model.selection().isRelated({kind:'event',id:'t2'}))
})

test('platform validation changes never rewrite records or turn navigation into a plugin verdict',()=>{
  const {explanation,rail}=selectionFixture();const original=nativeSelectionModel(explanation,'p1',rail).selection().related
  const graph=explanation.selectedPairGraphs!.p1
  graph.businessFunctions[0].validationStatus='invalid';graph.businessFunctions[0].reasonCode='platform_reason'
  graph.edges[0].validationStatus='invalid';graph.edges[0].reasonCode='platform_edge_reason'
  const before=JSON.stringify(explanation)
  const freeze=(value:unknown):void=>{if(value && typeof value==='object'){Object.freeze(value);for(const item of Object.values(value))freeze(item)}}
  freeze(explanation)
  assert.deepEqual(nativeSelectionModel(explanation,'p1',rail).selection().related,original)
  assert.equal(JSON.stringify(explanation),before)
})

test('claim paths include disclosed processing, sources and execution but never equal-valued unrelated nodes',()=>{
  const {explanation,rail}=selectionFixture();const model=nativeSelectionModel(explanation,'p1',rail)
  const selected=model.selection({kind:'claim',id:'c1'})
  for(const target of [{kind:'function',id:'fn1'},{kind:'evidence',id:'input'},{kind:'evidence',id:'output'},{kind:'schema',id:'schema1'},{kind:'execution',id:'x-out'},{kind:'step',id:'s1'}] as const) assert.ok(selected.isRelated(target),targetKey(target))
  for(const target of [{kind:'claim',id:'c2'},{kind:'evidence',id:'unrelated'},{kind:'execution',id:'x-unrelated'},{kind:'event',id:'t3'}] as const) assert.equal(selected.isRelated(target),false)
  assert.equal(explanation.selectedPairGraphs!.p1.claims[0].status,'candidate')
})

for(const target of [{kind:'event',id:'t1'},{kind:'step',id:'s1'}] as const) {
  test(`${target.kind} selection retains exact attempt identity across shared operation IDs`,()=>{
    const {explanation,rail}=selectionFixture();const model=nativeSelectionModel(explanation,'p1',rail);const selected=model.selection(target)
    for(const linked of [{kind:'step',id:'s1'},{kind:'event',id:'t1'},{kind:'evidence',id:'output'},{kind:'evidence',id:'input'},{kind:'schema',id:'schema1'}] as const) assert.ok(selected.isRelated(linked),targetKey(linked))
    assert.equal(selected.isRelated({kind:'step',id:'s2'}),false)
    assert.equal(selected.isRelated({kind:'event',id:'t2'}),false)
    assert.equal(selected.isSelected(target),true)
  })
}

test('source, output and execution selections reverse-link disclosed claims and processing',()=>{
  const {explanation,rail}=selectionFixture();const model=nativeSelectionModel(explanation,'p1',rail)
  for(const root of [{kind:'evidence',id:'input'},{kind:'evidence',id:'output'},{kind:'execution',id:'x-out'},{kind:'schema',id:'schema1'}] as const) {
    const selected=model.selection(root)
    assert.ok(selected.isRelated({kind:'claim',id:'c1'}),targetKey(root))
    assert.ok(selected.isRelated({kind:'function',id:'fn1'}),targetKey(root))
    assert.equal(selected.isRelated({kind:'claim',id:'c2'}),false)
  }
})

test('missing, ambiguous and conflicting references stay unresolved instead of fabricating a target',()=>{
  const {explanation,rail}=selectionFixture()
  explanation.selectedPairGraphs!.p1.schemaNodes.push({id:'input',label:'歧义来源',kind:'source'})
  explanation.selectedPairGraphs!.p1.executionSteps[0].attempt=99
  const model=nativeSelectionModel(explanation,'p1',rail)
  assert.equal(model.resolve('input',['evidence','schema']),undefined)
  assert.equal(model.resolve('missing-source'),undefined)
  assert.ok(model.unresolved.has('input'));assert.ok(model.unresolved.has('t1'))
  assert.equal(model.selection({kind:'step',id:'s1'}).isRelated({kind:'event',id:'t1'}),false)
  assert.equal(model.selection({kind:'evidence',id:'missing-source'}).active,undefined)
})

test('pair selection and cycles remain scoped, bounded and do not import old references',()=>{
  const {explanation,rail}=selectionFixture()
  const graph=explanation.selectedPairGraphs!.p1
  graph.edges.push({edgeId:'cycle',kind:'reference',fromId:'c1',toId:'output',operationIds:[],validationStatus:'candidate'})
  const first=nativeSelectionModel(explanation,'p1',rail)
  assert.ok(first.selection({kind:'claim',id:'c1'}).related.size<20)
  const second=nativeSelectionModel(explanation,'p2',rail)
  assert.equal(second.resolve('input'),undefined)
  assert.equal(second.resolve('s1'),undefined)
  assert.deepEqual(second.selection().active,{kind:'claim',id:'other-claim'})
})

test('a recorded output reference can link its execution to a supported claim without matching values',()=>{
  const {explanation,rail}=selectionFixture()
  explanation.selectedPairGraphs!.p1.claims[0].nodeIds=[]
  explanation.selectedPairGraphs!.p1.edges=[]
  const model=nativeSelectionModel(explanation,'p1',rail)
  const selected=model.selection({kind:'execution',id:'x-out'})
  assert.equal(selected.isRelated({kind:'claim',id:'c1'}),true)
  assert.equal(selected.isRelated({kind:'claim',id:'c2'}),false)
})

test('top-level explicit evidence edges work without a pair graph, and never leak into a selected-pair graph',()=>{
  const {explanation,rail}=selectionFixture()
  const graph=explanation.selectedPairGraphs!.p1
  explanation.evidence={nodes:graph.evidenceNodes,edges:[{id:'recorded',source:'unrelated',target:'output',label:'explicit upstream'}]}
  const pairModel=nativeSelectionModel(explanation,'p1',rail)
  assert.equal(pairModel.selection({kind:'claim',id:'c1'}).isRelated({kind:'evidence',id:'unrelated'}),false)
  explanation.questionPairs=[];explanation.selectedPairGraphs={}
  const topModel=nativeSelectionModel(explanation,undefined,rail)
  assert.equal(topModel.selection({kind:'claim',id:'c1'}).isRelated({kind:'evidence',id:'unrelated'}),true)
})

test('IDs reused across entity kinds stay distinct and untyped edges do not guess the endpoint kind',()=>{
  const {explanation,rail}=selectionFixture();const graph=explanation.selectedPairGraphs!.p1
  graph.businessFunctions[0].id='c1'
  graph.edges.push({edgeId:'ambiguous',kind:'reference',fromId:'c1',toId:'unrelated',operationIds:[],validationStatus:'candidate'})
  const model=nativeSelectionModel(explanation,'p1',rail)
  assert.equal(model.resolve('c1'),undefined)
  assert.deepEqual(model.resolve('c1',['claim']),{kind:'claim',id:'c1'})
  assert.deepEqual(model.resolve('c1',['function']),{kind:'function',id:'c1'})
  assert.ok(model.unresolved.has('c1'))
  const selected=model.selection({kind:'claim',id:'c1'})
  assert.equal(selected.isRelated({kind:'function',id:'c1'}),true)
  assert.equal(selected.isSelected({kind:'function',id:'c1'}),false)
  assert.equal(selected.isRelated({kind:'evidence',id:'unrelated'}),false)
})

test('edge operation references link steps and evidence even without a disclosed business function',()=>{
  const {explanation,rail}=selectionFixture();const graph=explanation.selectedPairGraphs!.p1
  graph.businessFunctions=[]
  const model=nativeSelectionModel(explanation,'p1',rail)
  const claim=model.selection({kind:'claim',id:'c1'})
  assert.equal(claim.isRelated({kind:'step',id:'s1'}),true)
  assert.equal(claim.isRelated({kind:'step',id:'s2'}),true)
  const step=model.selection({kind:'step',id:'s1'})
  assert.equal(step.isRelated({kind:'evidence',id:'output'}),true)
  assert.equal(step.isRelated({kind:'claim',id:'c1'}),true)
  assert.equal(step.isRelated({kind:'step',id:'s2'}),false)
  assert.equal(step.isRelated({kind:'event',id:'t2'}),false)
})

test('step/event endpoints and cyclic function relations never broaden an exact attempt selection',()=>{
  const {explanation,rail}=selectionFixture();const graph=explanation.selectedPairGraphs!.p1
  graph.edges.push(
    {edgeId:'step-metadata',kind:'reference',fromId:'s1',toId:'fn1',operationIds:['op1'],validationStatus:'candidate'},
    {edgeId:'event-metadata',kind:'reference',fromId:'t1',toId:'fn1',operationIds:['op1'],validationStatus:'candidate'},
    {edgeId:'function-cycle',kind:'reference',fromId:'fn1',toId:'s1',operationIds:['op1'],validationStatus:'candidate'},
  )
  const model=nativeSelectionModel(explanation,'p1',rail)
  for(const target of [{kind:'step',id:'s1'},{kind:'event',id:'t1'}] as const) {
    const selected=model.selection(target)
    assert.equal(selected.isRelated({kind:'step',id:'s1'}),true)
    assert.equal(selected.isRelated({kind:'event',id:'t1'}),true)
    assert.equal(selected.isRelated({kind:'step',id:'s2'}),false)
    assert.equal(selected.isRelated({kind:'event',id:'t2'}),false)
  }
})
