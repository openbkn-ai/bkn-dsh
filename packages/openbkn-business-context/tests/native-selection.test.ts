import assert from 'node:assert/strict'
import test from 'node:test'
import { nativeSelectionModel, targetKey } from '../src/client/native-provenance-selection.ts'
import { selectionFixture } from './fixtures/native-selection.ts'

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
