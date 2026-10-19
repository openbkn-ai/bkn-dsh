import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement, Profiler, useState, useSyncExternalStore } from 'react'
import { act, create } from 'react-test-renderer'
import type { LocaleRuntime } from '@deepseek-ai/dsh-client-locale/client'
import { localized } from '../src/client/locale.tsx'
import { translateMessage } from '../src/client/messages.ts'
import { NativeProvenancePanel } from '../src/client/NativeProvenancePanel.tsx'
import { NativeRecordList } from '../src/client/NativeRecordList.tsx'
import type { NativeTargetKind } from '../src/client/native-provenance-selection.ts'
import { selectionFixture } from './fixtures/native-selection.ts'
import { denseSelectionFixture, pagingSelectionFixture, sharedInputFixture, sharedSchemaFixture } from './fixtures/native-boundaries.ts'

function localeHarness() {
  let snapshot={active:'zh',revision:0,locales:[]}; const listeners=new Set<()=>void>()
  const locale={subscribe:(listener:()=>void)=>{listeners.add(listener);return()=>listeners.delete(listener)},getSnapshot:()=>snapshot,bind:()=>((key:Parameters<typeof translateMessage>[1],params?:Record<string,unknown>)=>translateMessage(snapshot.active,key,params))} as unknown as LocaleRuntime
  return {locale,set(active:string){act(()=>{snapshot={...snapshot,active,revision:snapshot.revision+1};for(const listener of listeners) listener()})}}
}
function button(renderer:ReturnType<typeof create>,kind:NativeTargetKind,id:string,reference=false) {
  const target=renderer.root.findAllByType('button').find(item=>item.props['data-target-kind']===kind && item.props['data-target-id']===id && Boolean(item.props['aria-label'])===reference)
  assert.ok(target,`missing ${reference?'reference':'node'} ${kind}:${id}`)
  return target
}
function renderFixture(fixture=selectionFixture()) {
  const harness=localeHarness();let currentTab:'events'|'evidence'='events';let changeTab!:(tab:'events'|'evidence')=>void
  function Surface(){const [tab,setTab]=useState<'events'|'evidence'>('events');currentTab=tab;changeTab=setTab;return createElement(NativeProvenancePanel,{view:fixture.view,tab,onTabChange:setTab})}
  const Component=localized(Surface,harness.locale);let renderer!:ReturnType<typeof create>
  act(()=>{renderer=create(createElement(Component))})
  return {renderer,language:harness.set,show:(tab:'events'|'evidence')=>act(()=>changeTab(tab)),tab:()=>currentTab,click:(kind:NativeTargetKind,id:string,reference=false)=>act(()=>button(renderer,kind,id,reference).props.onClick()),text:()=>JSON.stringify(renderer.toJSON()),close:()=>act(()=>renderer.unmount())}
}

function recordList(renderer:ReturnType<typeof create>,label:string) {
  return renderer.root.findAllByType('section').find(item=>item.props['data-native-list']===label)!
}
function nextPage(renderer:ReturnType<typeof create>,label:string) {
  const next=recordList(renderer,label).findAllByType('button').find(item=>item.props['aria-label']===`下一页：${label}`)
  assert.ok(next);assert.equal(next.props.disabled,false);act(()=>next.props.onClick())
}

test('record pages construct only visible children, reveal a new focus and reset on a context round trip',()=>{
  const harness=localeHarness();const Component=localized(NativeRecordList<number>,harness.locale);let renderer!:ReturnType<typeof create>
  const rendered:number[]=[];const props={items:Array.from({length:45},(_,i)=>i),label:'Records',listId:'records',contextKey:'A',focusKey:'initial',renderItem:(item:number)=>{rendered.push(item);return createElement('p',{key:item},String(item))}}
  try {
    act(()=>{renderer=create(createElement(Component,props))})
    assert.deepEqual(rendered,props.items.slice(0,20));rendered.length=0
    nextPage(renderer,'Records');assert.deepEqual(rendered,props.items.slice(20,40))
    act(()=>renderer.update(createElement(Component,{...props,focusKey:'last',focusIndex:44})))
    assert.match(JSON.stringify(renderer.toJSON()),/显示 41–45，共 45 条/)
    harness.set('en');assert.match(JSON.stringify(renderer.toJSON()),/Showing 41–45 of 45/)
    act(()=>renderer.update(createElement(Component,{...props,contextKey:'B'})))
    act(()=>renderer.update(createElement(Component,props)))
    assert.match(JSON.stringify(renderer.toJSON()),/Showing 1–20 of 45/)
  } finally {act(()=>renderer.unmount())}
})

test('record pages remember each new focus after manual paging and an A-B-A round trip',()=>{
  const harness=localeHarness(),Component=localized(NativeRecordList<number>,harness.locale);let renderer!:ReturnType<typeof create>
  const props={items:Array.from({length:60},(_,i)=>i),label:'Records',listId:'records',contextKey:'A',focusKey:'A21',focusIndex:21,renderItem:(item:number)=>createElement('p',{key:item},String(item))}
  try {
    act(()=>{renderer=create(createElement(Component,props))})
    nextPage(renderer,'Records')
    act(()=>renderer.update(createElement(Component,{...props,focusKey:'B1',focusIndex:1})))
    assert.match(JSON.stringify(renderer.toJSON()),/显示 1–20，共 60 条/)
    act(()=>renderer.update(createElement(Component,props)))
    assert.match(JSON.stringify(renderer.toJSON()),/显示 21–40，共 60 条/)
  } finally {act(()=>renderer.unmount())}
})

test('different list roles never share page state even at the same position and question pair',()=>{
  const harness=localeHarness(),Component=localized(NativeRecordList<number>,harness.locale);let renderer!:ReturnType<typeof create>
  const props={items:Array.from({length:60},(_,i)=>i),label:'Records',listId:'events',contextKey:'A',focusKey:'last',focusIndex:44,renderItem:(item:number)=>createElement('p',{key:item},String(item))}
  try {
    act(()=>{renderer=create(createElement(Component,props))})
    assert.match(JSON.stringify(renderer.toJSON()),/显示 41–60，共 60 条/)
    act(()=>renderer.update(createElement(Component,{...props,listId:'requirements',focusIndex:-1})))
    assert.match(JSON.stringify(renderer.toJSON()),/显示 1–20，共 60 条/)
    nextPage(renderer,'Records')
    harness.set('en');assert.match(JSON.stringify(renderer.toJSON()),/Showing 21–40 of 60/)
    act(()=>renderer.update(createElement(Component,props)))
    assert.match(JSON.stringify(renderer.toJSON()),/Showing 41–60 of 60/)
  } finally {act(()=>renderer.unmount())}
})

test('repeated reference jumps reveal the same target after manual paging and preserve A-B-A navigation',()=>{
  const fixture=pagingSelectionFixture(),before=JSON.stringify(fixture.view),ui=renderFixture(fixture)
  const visible=(id:string)=>ui.renderer.root.findAllByType('button').some(item=>item.props['data-target-kind']==='evidence' && item.props['data-target-id']===id && !item.props['aria-label'])
  try {
    ui.show('evidence');ui.click('evidence','n44',true)
    assert.equal(button(ui.renderer,'evidence','n44').props['aria-pressed'],true)
    act(()=>recordList(ui.renderer,'业务证据与来源').findAllByType('button').find(item=>item.props['aria-label']==='上一页：业务证据与来源')!.props.onClick())
    assert.equal(visible('n44'),false)
    ui.language('en');assert.equal(visible('n44'),false)
    ui.click('evidence','n44',true)
    assert.equal(button(ui.renderer,'evidence','n44').props['aria-pressed'],true)
    ui.click('evidence','n0',true);assert.equal(button(ui.renderer,'evidence','n0').props['aria-pressed'],true)
    ui.click('evidence','n44',true);assert.equal(button(ui.renderer,'evidence','n44').props['aria-pressed'],true)
    ui.language('zh');assert.equal(button(ui.renderer,'evidence','n44').props['aria-pressed'],true)
    assert.equal(JSON.stringify(fixture.view),before)
  } finally {ui.close()}
})

test('paging requirements between tabs cannot hide the exact selected retry event',()=>{
  const ui=renderFixture(pagingSelectionFixture())
  try {
    const fnSection=()=>button(ui.renderer,'function','fn1').parent!
    for(let i=0;i<2;i++)act(()=>fnSection().findAllByType('button').find(item=>item.props['aria-label']==='下一页：业务执行步骤')!.props.onClick())
    ui.click('step','s44',true)
    assert.equal(button(ui.renderer,'event','t44').props['data-related'],true)
    ui.show('evidence')
    const requirements=()=>ui.renderer.root.findAllByType('section').find(item=>String(item.props['data-native-list']??'').startsWith('关联仅依据平台明确披露的标识'))!
    act(()=>requirements().findAllByType('button').find(item=>String(item.props['aria-label']??'').startsWith('下一页'))!.props.onClick())
    ui.language('en');assert.match(JSON.stringify(ui.renderer.toJSON()),/Showing 21–40 of 45/)
    ui.show('events')
    assert.equal(button(ui.renderer,'event','t44').props['data-related'],true)
    assert.equal(button(ui.renderer,'step','s44').props['aria-pressed'],true)
    assert.equal(button(ui.renderer,'event','t40').props['data-related'],false)
    ui.language('zh')
    act(()=>ui.renderer.root.findByType('select').props.onChange({target:{value:'p2'}}))
    act(()=>ui.renderer.root.findByType('select').props.onChange({target:{value:'p1'}}))
    assert.ok(button(ui.renderer,'step','s0'))
    assert.equal(ui.renderer.root.findAllByType('button').some(item=>item.props['aria-pressed']),false)
  } finally {ui.close()}
})

test('shared definitions remain navigable without highlighting another processing path or reclassifying invalid',()=>{
  const fixture=sharedSchemaFixture('invalid'),before=JSON.stringify(fixture.view),ui=renderFixture(fixture)
  try {
    assert.equal(button(ui.renderer,'function','fn1').props['data-related'],true)
    assert.equal(button(ui.renderer,'function','fn2').props['data-related'],false)
    assert.match(ui.text(),/invalid/);assert.match(ui.text(),/platform_reason_2/)
    ui.click('schema','schema:object:Order',true)
    assert.equal(button(ui.renderer,'function','fn2').props['data-related'],true)
    assert.equal(button(ui.renderer,'claim','c2').props['data-related'],true)
    ui.click('claim','c1')
    assert.equal(button(ui.renderer,'function','fn2').props['data-related'],false)
    ui.click('step','step-t1-retry',true)
    assert.equal(button(ui.renderer,'event','t1-retry').props['data-related'],true)
    assert.equal(button(ui.renderer,'event','t1').props['data-related'],false)
    assert.equal(button(ui.renderer,'event','t2').props['data-related'],false)
    ui.show('evidence');ui.click('evidence','n1');ui.click('execution','x1',true)
    assert.equal(button(ui.renderer,'function','fn2').props['data-related'],false)
    ui.language('en');assert.equal(button(ui.renderer,'function','fn2').props['data-related'],false)
    assert.equal(JSON.stringify(fixture.view),before)
  } finally {ui.close()}
})

for(const reference of ['sourceRef','evidenceRefs'] as const) for(const status of ['candidate','invalid','future-platform-status']) {
  test(`shared ${reference} navigation preserves query scope, both input users and ${status} records across views`,()=>{
    const fixture=sharedInputFixture(status,reference),before=JSON.stringify(fixture.view),ui=renderFixture(fixture)
    const expectPaths=(path:1|2|'both')=>{
      for(const i of [1,2]) {
        const expected=path==='both'||path===i
        for(const [kind,id] of [['function',`fn${i}`],['claim',`c${i}`],['evidence',`n${i}`]] as const) {
          assert.equal(button(ui.renderer,kind,id).props['data-related'],expected,`${kind}:${id}`)
        }
      }
      assert.equal(button(ui.renderer,'evidence','shared-input').props['data-related'],true)
      assert.match(ui.text(),new RegExp(status));assert.match(ui.text(),/platform_reason_2/)
    }
    try {
      ui.show('evidence');ui.click('evidence','n1');expectPaths(1)
      assert.equal(button(ui.renderer,'evidence','n1').props['aria-pressed'],true)
      ui.show('events')
      assert.equal(button(ui.renderer,'event','t1').props['data-related'],true)
      assert.equal(button(ui.renderer,'event','t1-retry').props['data-related'],true)
      assert.equal(button(ui.renderer,'event','t2').props['data-related'],false)
      ui.click('event','t1')
      assert.equal(button(ui.renderer,'event','t1-retry').props['data-related'],false)
      ui.show('evidence');expectPaths(1)
      ui.click('evidence','shared-input',true);expectPaths('both')
      assert.equal(button(ui.renderer,'evidence','shared-input').props['aria-pressed'],true)
      ui.show('events')
      for(const id of ['t1','t1-retry','t2'])assert.equal(button(ui.renderer,'event',id).props['data-related'],true)
      ui.show('evidence');ui.click('evidence','n1');ui.language('en');expectPaths(1)
      ui.click('execution','x1',true);assert.equal(ui.tab(),'events')
      assert.equal(button(ui.renderer,'event','t2').props['data-related'],false)
      ui.click('step','step-t1-retry')
      assert.equal(button(ui.renderer,'event','t1-retry').props['data-related'],true)
      assert.equal(button(ui.renderer,'event','t1').props['data-related'],false)
      assert.equal(button(ui.renderer,'event','t2').props['data-related'],false)
      ui.show('evidence');expectPaths(1)
      ui.click('claim','c2');expectPaths(2)
      ui.language('zh');expectPaths(2)
      ui.show('events')
      assert.equal(button(ui.renderer,'event','t2').props['data-related'],true)
      assert.equal(button(ui.renderer,'event','t1').props['data-related'],false)
      ui.show('evidence');ui.click('evidence','shared-input');expectPaths('both')
      assert.equal(JSON.stringify(fixture.view),before)
    } finally {ui.close()}
  })
}

test('platform-disclosed dependencies between queries remain navigable with raw invalid records',()=>{
  const fixture=sharedInputFixture('invalid'),graph=fixture.explanation.selectedPairGraphs!.p1
  graph.businessFunctions[1].businessInputs.push({name:'First result',sourceKind:'result',sourceRef:'n1'})
  const before=JSON.stringify(fixture.view),ui=renderFixture(fixture)
  try {
    ui.show('evidence');ui.click('evidence','n1')
    for(const id of ['fn1','fn2'])assert.equal(button(ui.renderer,'function',id).props['data-related'],true)
    assert.equal(button(ui.renderer,'claim','c2').props['data-related'],true)
    assert.match(ui.text(),/invalid/);assert.match(ui.text(),/platform_reason_2/)
    ui.click('execution','x1',true)
    assert.equal(button(ui.renderer,'event','t2').props['data-related'],true)
    ui.language('en');ui.show('evidence')
    assert.equal(button(ui.renderer,'function','fn2').props['data-related'],true)
    assert.equal(JSON.stringify(fixture.view),before)
  } finally {ui.close()}
})

for(const missing of ['both','question','answer'] as const) test(`missing ${missing} original fields never get filled from the explanation`,()=>{
  const fixture=selectionFixture();assert.equal(fixture.view.native!.detail.kind,'ready')
  if(fixture.view.native!.detail.kind!=='ready')return
  fixture.view.native!.detail.view.question=missing==='both'||missing==='question'?undefined:'ORIGINAL-Q'
  fixture.view.native!.detail.view.answer=missing==='both'||missing==='answer'?undefined:'ORIGINAL-A'
  fixture.explanation.question='EXPLANATION-Q';fixture.explanation.answer='EXPLANATION-A'
  const before=JSON.stringify(fixture.view),ui=renderFixture(fixture)
  try {
    const original=ui.renderer.root.findAllByType('section').find(item=>item.props['data-native-answer-source']==='detail')
    assert.ok(original)
    const originalText=original.findAllByType('p').map(item=>item.children.join('')).join(' ')
    assert.doesNotMatch(originalText,/EXPLANATION-Q|EXPLANATION-A/)
    assert.match(originalText,/平台未披露此项原文/)
    const recorded=ui.renderer.root.findAllByType('details').find(item=>item.props['data-native-answer-source']==='explanation')
    assert.ok(recorded);assert.match(recorded.findAllByType('p').map(item=>item.children.join('')).join(' '),/EXPLANATION-Q.*EXPLANATION-A/)
    assert.equal(recorded.props.open,undefined)
    ui.language('en');assert.equal(JSON.stringify(fixture.view),before)
  } finally {ui.close()}
})

test('original and explanation question/answer texts keep their distinct sources and exact content',()=>{
  const fixture=selectionFixture();if(fixture.view.native!.detail.kind!=='ready')throw new Error('ready detail required')
  fixture.view.native!.detail.view.question='  原始问题\n<literal>  '
  fixture.view.native!.detail.view.answer='原始回答："platform"\n  unchanged  '
  fixture.explanation.question='解释中的问题';fixture.explanation.answer='解释中的回答'
  const before=JSON.stringify(fixture.view),ui=renderFixture(fixture)
  try {
    const original=ui.renderer.root.findAllByType('section').find(item=>item.props['data-native-answer-source']==='detail')!
    const fields=original.findAllByType('p').filter(item=>item.props['data-native-text-field'])
    assert.deepEqual(fields.map(item=>item.children.join('')),[fixture.view.native!.detail.view.question,fixture.view.native!.detail.view.answer])
    const explanation=ui.renderer.root.findAllByType('details').find(item=>item.props['data-native-answer-source']==='explanation')!
    assert.deepEqual(explanation.findAllByType('p').filter(item=>item.props['data-native-text-field']).map(item=>item.children.join('')),['解释中的问题','解释中的回答'])
    ui.language('en');assert.equal(JSON.stringify(fixture.view),before)
  } finally {ui.close()}
})

test('explicit empty original strings stay empty instead of being classified as missing',()=>{
  const fixture=selectionFixture();if(fixture.view.native!.detail.kind!=='ready')throw new Error('ready detail required')
  fixture.view.native!.detail.view.question='';fixture.view.native!.detail.view.answer=''
  fixture.explanation.question='EXPLANATION-Q';fixture.explanation.answer='EXPLANATION-A'
  const ui=renderFixture(fixture)
  try {
    const original=ui.renderer.root.findAllByType('section').find(item=>item.props['data-native-answer-source']==='detail')!
    assert.deepEqual(original.findAllByType('p').filter(item=>item.props['data-native-text-field']).map(item=>item.children.join('')),['',''])
    assert.doesNotMatch(original.findAllByType('p').map(item=>item.children.join('')).join(' '),/未披露|EXPLANATION/)
  } finally {ui.close()}
})

test('missing explanation text is not filled from an available original record',()=>{
  const fixture=selectionFixture();if(fixture.view.native!.detail.kind!=='ready')throw new Error('ready detail required')
  fixture.view.native!.detail.view.question='ORIGINAL-Q';fixture.view.native!.detail.view.answer='ORIGINAL-A'
  fixture.explanation.question=undefined;fixture.explanation.answer=undefined
  const ui=renderFixture(fixture)
  try {
    const explanation=ui.renderer.root.findAllByType('details').find(item=>item.props['data-native-answer-source']==='explanation')!
    const fields=explanation.findAllByType('p').filter(item=>item.props['data-native-text-field']).map(item=>item.children.join(''))
    assert.deepEqual(fields,['平台解释记录未披露此项文本。','平台解释记录未披露此项文本。'])
    assert.doesNotMatch(fields.join(' '),/ORIGINAL-Q|ORIGINAL-A/)
  } finally {ui.close()}
})

for(const reason of ['access-denied','not-disclosed-or-unavailable'] as const) test(`a ${reason} original source never gets replaced by explanation texts`,()=>{
  const fixture=selectionFixture();fixture.view.native!.detail={kind:'unavailable',reason}
  fixture.explanation.question='EXPLANATION-Q';fixture.explanation.answer='EXPLANATION-A'
  const before=JSON.stringify(fixture.view),ui=renderFixture(fixture)
  try {
    const original=ui.renderer.root.findAllByType('section').find(item=>item.props['data-native-answer-source']==='detail')!
    assert.equal(original.findAllByType('p').filter(item=>item.props['data-native-text-field']).length,0)
    assert.doesNotMatch(original.findAllByType('p').map(item=>item.children.join('')).join(' '),/EXPLANATION-Q|EXPLANATION-A/)
    const explanation=ui.renderer.root.findAllByType('details').find(item=>item.props['data-native-answer-source']==='explanation')!
    assert.deepEqual(explanation.findAllByType('p').filter(item=>item.props['data-native-text-field']).map(item=>item.children.join('')),['EXPLANATION-Q','EXPLANATION-A'])
    assert.equal(JSON.stringify(fixture.view),before)
  } finally {ui.close()}
})

for(const state of ['not-generated','unavailable'] as const) test(`a ${state} explanation never hides or changes an available original source`,()=>{
  const fixture=selectionFixture();if(fixture.view.native!.detail.kind!=='ready')throw new Error('ready detail required')
  fixture.view.native!.detail.view.question='ORIGINAL-Q';fixture.view.native!.detail.view.answer='ORIGINAL-A'
  fixture.view.native!.explanation=state==='not-generated'?{kind:state}:{kind:state,reason:'unavailable'}
  const ui=renderFixture(fixture)
  try {
    const original=ui.renderer.root.findAllByType('section').find(item=>item.props['data-native-answer-source']==='detail')!
    assert.deepEqual(original.findAllByType('p').filter(item=>item.props['data-native-text-field']).map(item=>item.children.join('')),['ORIGINAL-Q','ORIGINAL-A'])
    assert.equal(ui.renderer.root.findAllByType('details').filter(item=>item.props['data-native-answer-source']==='explanation').length,0)
  } finally {ui.close()}
})

test('a reference to an off-page retry reveals both its exact step and event pages',()=>{
  const fixture=selectionFixture();const graph=fixture.explanation.selectedPairGraphs!.p1
  const template=fixture.rail[0]
  fixture.rail.splice(0,fixture.rail.length,...Array.from({length:45},(_,i)=>({...template,id:`t${i}`,attempt:i+1,order:i})))
  graph.executionSteps=fixture.rail.map((event,i)=>({id:`s${i}`,operationId:event.operation_id,attempt:event.attempt,businessRole:'query',interfaceName:`Step ${i}`,status:event.status,timeRailItemId:event.id}))
  const ui=renderFixture(fixture)
  try {
    const fnSection=button(ui.renderer,'function','fn1').parent!
    for(let i=0;i<2;i++) {
      const next=fnSection.findAllByType('button').find(item=>item.props['aria-label']==='下一页：业务执行步骤')!
      assert.ok(next);act(()=>next.props.onClick())
    }
    ui.click('step','s44',true)
    assert.equal(button(ui.renderer,'step','s44').props['aria-pressed'],true)
    assert.equal(button(ui.renderer,'event','t44').props['data-related'],true)
    assert.equal(button(ui.renderer,'event','t40').props['data-related'],false)
    ui.show('evidence');ui.show('events')
    assert.equal(button(ui.renderer,'event','t44').props['data-related'],true)
    assert.equal(button(ui.renderer,'step','s44').props['aria-pressed'],true)
  } finally {ui.close()}
})

test('real-shaped schema and operation sources navigate without conflating an operation with a node',()=>{
  const fixture=selectionFixture();const graph=fixture.explanation.selectedPairGraphs!.p1
  graph.schemaNodes=[{id:'schema:object:Order',label:'Order definition',kind:'object'}]
  graph.businessFunctions[0].schemaRefs=['object:Order']
  graph.businessFunctions[0].businessInputs=[{name:'Arguments',sourceKind:'function_argument',sourceRef:'op1'},{name:'Absent operation',sourceKind:'function_argument',sourceRef:'input'}]
  const ui=renderFixture(fixture)
  try {
    ui.click('schema','schema:object:Order',true)
    assert.equal(button(ui.renderer,'schema','schema:object:Order').props['aria-pressed'],true)
    ui.click('step','s2',true);assert.equal(ui.tab(),'events')
    assert.equal(button(ui.renderer,'event','t2').props['data-related'],true)
    assert.equal(button(ui.renderer,'event','t1').props['data-related'],false)
    assert.ok(ui.renderer.root.findAllByType('span').some(item=>item.props['data-unresolved-reference']==='input'))
    assert.equal(ui.renderer.root.findAllByType('button').some(item=>item.props['data-reference-id']==='input'),false)
  } finally {ui.close()}
})

for(const status of ['invalid','candidate','verified','future-platform-status']) test(`retained unlinked processing displays the platform's ${status} status and raw reason`,()=>{
  const fixture=selectionFixture();const graph=fixture.explanation.selectedPairGraphs!.p1;const fn=graph.businessFunctions[0]
  fn.validationStatus=status;fn.reasonCode='platform_raw_reason';fn.supportsClaimIds=[];fn.operationIds=[];fn.businessInputs=[];fn.businessOutputs=[];fn.schemaRefs=[]
  const before=JSON.stringify(fixture.view);const ui=renderFixture(fixture)
  try {
    const record=ui.renderer.root.findAllByType('p').find(item=>item.props['data-platform-validation']===status)
    assert.ok(record);assert.match(record.children.join(''),/platform_raw_reason/)
    for(let parent=record.parent;parent;parent=parent.parent)assert.notEqual(parent.type,'details')
    ui.click('function','fn1');assert.equal(button(ui.renderer,'function','fn1').props['aria-pressed'],true)
    ui.language('en');assert.match(ui.text(),/platform_raw_reason/)
    assert.equal(JSON.stringify(fixture.view),before)
  } finally {ui.close()}
})

test('invalid relationship without a business function retains raw status, reason and endpoint navigation',()=>{
  const fixture=selectionFixture();const graph=fixture.explanation.selectedPairGraphs!.p1
  graph.businessFunctions=[];graph.edges[0].validationStatus='invalid';graph.edges[0].reasonCode='platform_edge_reason'
  const before=JSON.stringify(fixture.view);const ui=renderFixture(fixture)
  try {
    ui.show('evidence')
    const status=ui.renderer.root.findAllByType('p').find(item=>item.props['data-platform-validation']==='invalid')
    assert.ok(status);assert.match(status.children.join(''),/platform_edge_reason/)
    for(let parent=status.parent;parent;parent=parent.parent)assert.notEqual(parent.type,'details')
    ui.click('evidence','output',true);assert.equal(button(ui.renderer,'evidence','output').props['aria-pressed'],true)
    assert.equal(JSON.stringify(fixture.view),before)
  } finally {ui.close()}
})

test('valid dense fanout renders bounded pages while retaining all source and processing records',()=>{
  const fixture=denseSelectionFixture();const before=JSON.stringify(fixture.view)
  assert.ok(Buffer.byteLength(JSON.stringify(fixture.view.native))<1_000_000)
  const ui=renderFixture(fixture)
  try {
    ui.show('evidence')
    assert.ok(ui.renderer.root.findAllByType('button').length<200)
    assert.match(ui.text(),/共 400 条/);assert.match(ui.text(),/共 128 条/)
    nextPage(ui.renderer,'业务证据与来源');ui.click('evidence','n21')
    assert.equal(button(ui.renderer,'evidence','n21').props['aria-pressed'],true)
    ui.language('en');assert.equal(button(ui.renderer,'evidence','n21').props['aria-pressed'],true)
    ui.language('zh')
    const sourceList=()=>recordList(ui.renderer,'Source references')
    for(let i=0;i<39;i++) {
      const next=sourceList().findAllByType('button').find(item=>item.props['aria-label']==='下一页：Source references')!
      act(()=>next.props.onClick())
    }
    ui.click('evidence','n399',true)
    assert.equal(button(ui.renderer,'evidence','n399').props['aria-pressed'],true)
    assert.match(ui.text(),/显示 381–400，共 400 条/)
    const ids=new Set<string>()
    for(let page=0;page<43;page++) {
      for(const item of recordList(ui.renderer,'平台业务处理记录（含未关联项）').findAllByType('button'))if(item.props['data-target-kind']==='function')ids.add(item.props['data-target-id'])
      if(page<42)nextPage(ui.renderer,'平台业务处理记录（含未关联项）')
    }
    assert.equal(ids.size,128)
    ui.click('function','fn127');assert.equal(button(ui.renderer,'function','fn127').props['aria-pressed'],true)
    assert.ok(ui.renderer.root.findAllByType('button').length<200)
    assert.equal(JSON.stringify(fixture.view),before)
    act(()=>ui.renderer.root.findByType('select').props.onChange({target:{value:'p2'}}))
    act(()=>ui.renderer.root.findByType('select').props.onChange({target:{value:'p1'}}))
    assert.ok(button(ui.renderer,'evidence','n0'));assert.ok(button(ui.renderer,'function','fn0'))
  } finally {ui.close()}
})

test('platform invalid status and reason stay visible on retained business records',()=>{
  const fixture=selectionFixture();const fn=fixture.explanation.selectedPairGraphs!.p1.businessFunctions[0]
  fn.validationStatus='invalid';fn.reasonCode='platform_reason'
  const before=JSON.stringify(fixture.view);const ui=renderFixture(fixture)
  try {
    const records=ui.renderer.root.findAll(item=>item.props['data-platform-validation']==='invalid')
    assert.ok(records.some(item=>!item.findAllByType('details').length && JSON.stringify(item.children).includes('platform_reason')))
    ui.click('function','fn1');assert.equal(button(ui.renderer,'function','fn1').props['aria-pressed'],true)
    assert.equal(JSON.stringify(fixture.view),before)
  } finally {ui.close()}
})

for(const change of ['direct','close-reopen','same-message'] as const) test(`loaded answer ownership is synchronous on ${change}`,async()=>{
  const {ProvenanceOverlay,ProvenanceOverlayController}=await import('../src/client/ProvenanceOverlay.tsx')
  const controller=new ProvenanceOverlayController();const fixture=selectionFixture();const harness=localeHarness()
  const previousWindow=Object.getOwnPropertyDescriptor(globalThis,'window')
  Object.defineProperty(globalThis,'window',{configurable:true,value:{addEventListener:()=>{},removeEventListener:()=>{}}})
  const handle={schemaVersion:2 as const,interactionId:'int-fixture',status:'completed' as const,requestIds:[],traceIds:[],receiptIds:[],partial:false}
  fixture.view.native!.detail.kind==='ready' && (fixture.view.native!.detail.view.answer='OLD-ANSWER-SENTINEL')
  const Component=localized(ProvenanceOverlay,harness.locale);let renderer!:ReturnType<typeof create>;let reads=0;let watching=false
  const commits:boolean[]=[];const load=async()=>{if(++reads===1)return fixture.view;return new Promise<never>(()=>{})}
  try {
    controller.open('s1','m1',handle)
    await act(async()=>{renderer=create(createElement(Profiler,{id:'overlay',onRender:()=>{if(watching)commits.push(JSON.stringify(renderer.toJSON()).includes('OLD-ANSWER-SENTINEL'))}},createElement(Component,{useProvenanceOverlay:(select:(state:ReturnType<typeof controller.getSnapshot>)=>unknown)=>select(useSyncExternalStore(controller.subscribe,controller.getSnapshot)),load,close:()=>controller.close()} as never)))})
    assert.match(JSON.stringify(renderer.toJSON()),/OLD-ANSWER-SENTINEL/)
    if(change!=='direct') act(()=>controller.close())
    watching=true
    await act(async()=>controller.open('s1',change==='same-message'?'m1':'m2',handle))
    assert.ok(commits.length>0);assert.deepEqual(commits,commits.map(()=>false))
  } finally {
    act(()=>renderer.unmount())
    if(previousWindow)Object.defineProperty(globalThis,'window',previousWindow);else Reflect.deleteProperty(globalThis,'window')
  }
})

test('selecting a step highlights its exact event and related evidence across tabs without confirming candidates',()=>{
  const ui=renderFixture()
  try {
    ui.click('step','s1')
    assert.equal(button(ui.renderer,'step','s1').props['aria-pressed'],true)
    assert.equal(button(ui.renderer,'event','t1').props['data-related'],true)
    assert.equal(button(ui.renderer,'event','t2').props['data-related'],false)
    assert.equal(button(ui.renderer,'step','s2').props['data-related'],false)
    ui.show('evidence')
    for(const [kind,id] of [['evidence','input'],['evidence','output'],['schema','schema1'],['claim','c1']] as const) assert.equal(button(ui.renderer,kind,id).props['data-related'],true)
    assert.equal(button(ui.renderer,'claim','c1').props['aria-pressed'],false)
    assert.equal(button(ui.renderer,'evidence','unrelated').props['data-related'],false)
    assert.match(ui.text(),/candidate/)
    ui.show('events');assert.equal(button(ui.renderer,'step','s1').props['aria-pressed'],true)
  } finally {ui.close()}
})

test('selecting a retry event never highlights another attempt of the same operation',()=>{
  const ui=renderFixture()
  try {
    ui.click('event','t2')
    assert.equal(button(ui.renderer,'event','t2').props['aria-pressed'],true)
    assert.equal(button(ui.renderer,'step','s2').props['data-related'],true)
    assert.equal(button(ui.renderer,'step','s1').props['data-related'],false)
    assert.equal(button(ui.renderer,'event','t1').props['data-related'],false)
    ui.show('evidence');assert.equal(button(ui.renderer,'claim','c1').props['data-related'],true)
    ui.show('events');assert.equal(button(ui.renderer,'event','t2').props['aria-pressed'],true)
  } finally {ui.close()}
})

test('source and schema selection reverse-link processing, while references navigate to the exact step or execution node',()=>{
  const ui=renderFixture()
  try {
    ui.show('evidence');ui.click('evidence','input')
    assert.equal(button(ui.renderer,'claim','c1').props['data-related'],true)
    assert.equal(button(ui.renderer,'claim','c2').props['data-related'],false)
    ui.click('schema','schema1')
    assert.equal(button(ui.renderer,'function','fn1').props['data-related'],true)
    ui.click('step','s2',true);assert.equal(ui.tab(),'events')
    assert.equal(button(ui.renderer,'step','s2').props['aria-pressed'],true)
    assert.equal(button(ui.renderer,'event','t1').props['data-related'],false)
    ui.click('execution','x-out');ui.show('evidence')
    assert.equal(button(ui.renderer,'evidence','output').props['data-related'],true)
    assert.equal(button(ui.renderer,'claim','c1').props['data-related'],true)
    assert.equal(button(ui.renderer,'evidence','unrelated').props['data-related'],false)
  } finally {ui.close()}
})

test('input/output references select disclosed nodes, and a node execution reference changes the view',()=>{
  const ui=renderFixture()
  try {
    ui.click('evidence','input',true);assert.equal(ui.tab(),'evidence')
    assert.equal(button(ui.renderer,'evidence','input').props['aria-pressed'],true)
    ui.click('evidence','output',true)
    assert.equal(button(ui.renderer,'evidence','output').props['aria-pressed'],true)
    ui.click('execution','x-out',true);assert.equal(ui.tab(),'events')
    assert.equal(button(ui.renderer,'execution','x-out').props['aria-pressed'],true)
    assert.equal(button(ui.renderer,'execution','x-unrelated').props['data-related'],false)
    ui.language('en')
    assert.match(ui.text(),/Business execution steps/)
    assert.equal(button(ui.renderer,'execution','x-out').props['aria-pressed'],true)
  } finally {ui.close()}
})

test('opaque, ambiguous, absent and inconsistent references stay text and do not select a substitute event',()=>{
  const fixture=selectionFixture();const graph=fixture.explanation.selectedPairGraphs!.p1
  graph.schemaNodes.push({id:'input',label:'同 ID 定义',kind:'source'})
  graph.executionSteps[0].attempt=99
  graph.businessFunctions[0].businessInputs.push({name:'外部引用',sourceRef:'https://example.invalid/private'})
  const ui=renderFixture(fixture)
  try {
    for(const id of ['input','missing-source','opaque-row','https://example.invalid/private']) {
      assert.ok(ui.renderer.root.findAllByType('span').some(span=>span.props['data-unresolved-reference']===id),id)
    }
    assert.equal(ui.renderer.root.findAllByType('a').length,0)
    assert.equal(ui.renderer.root.findAllByType('button').some(item=>item.props['aria-label']==='查看关联：输入来源'),false)
    ui.click('step','s1')
    assert.equal(button(ui.renderer,'event','t1').props['data-related'],false)
    assert.match(ui.text(),/不一致/)
  } finally {ui.close()}
})

test('changing pairs clears the old selection even when the next pair reuses a node ID',()=>{
  const fixture=selectionFixture();const next=fixture.explanation.selectedPairGraphs!.p2
  next.evidenceNodes=[{id:'input',label:'另一问题的同 ID 来源',kind:'source'}];next.claims[0].nodeIds=['input']
  const ui=renderFixture(fixture)
  try {
    ui.click('evidence','input',true)
    assert.equal(button(ui.renderer,'evidence','input').props['aria-pressed'],true)
    act(()=>ui.renderer.root.findByType('select').props.onChange({target:{value:'p2'}}))
    assert.equal(button(ui.renderer,'evidence','input').props['aria-pressed'],false)
    assert.equal(button(ui.renderer,'claim','other-claim').props['aria-pressed'],true)
    assert.equal(ui.renderer.root.findAllByType('button').filter(item=>item.props['data-target-kind']==='function').length,0)
    ui.show('events')
    assert.equal(ui.renderer.root.findAllByType('button').some(item=>item.props['aria-pressed']===true),false)
    assert.equal(button(ui.renderer,'event','t1').props['data-related'],false)
  } finally {ui.close()}
})

test('an event linked to multiple business functions shows all recorded associations without choosing a primary function',()=>{
  const fixture=selectionFixture();const graph=fixture.explanation.selectedPairGraphs!.p1
  graph.businessFunctions.push({...structuredClone(graph.businessFunctions[0]),id:'fn2',displayName:'第二处理',supportsClaimIds:['c2']})
  const ui=renderFixture(fixture)
  try {
    assert.ok(button(ui.renderer,'event','t1').findAllByType('strong').some(label=>label.children.includes('查询第一次')))
    assert.match(ui.text(),/平台关联了 2 项业务处理/)
    ui.click('event','t1')
    assert.equal(button(ui.renderer,'function','fn1').props['data-related'],true)
    assert.equal(button(ui.renderer,'function','fn2').props['data-related'],true)
    assert.equal(button(ui.renderer,'function','fn1').props['aria-pressed'],false)
    assert.equal(button(ui.renderer,'function','fn2').props['aria-pressed'],false)
  } finally {ui.close()}
})

test('the actual overlay changes tabs on reference clicks without rereading and resets after close/reopen',async()=>{
  const {ProvenanceOverlay,ProvenanceOverlayController}=await import('../src/client/ProvenanceOverlay.tsx')
  const controller=new ProvenanceOverlayController();const fixture=selectionFixture();const harness=localeHarness();let reads=0
  const previousWindow=Object.getOwnPropertyDescriptor(globalThis,'window')
  Object.defineProperty(globalThis,'window',{configurable:true,value:{addEventListener:()=>{},removeEventListener:()=>{}}})
  const handle={schemaVersion:2 as const,interactionId:'int-fixture',status:'completed' as const,requestIds:[],traceIds:[],receiptIds:[],partial:false}
  const Component=localized(ProvenanceOverlay,harness.locale);let renderer!:ReturnType<typeof create>
  const load=async()=>{reads++;return fixture.view}
  try {
    controller.open('s1','m1',handle)
    await act(async()=>{renderer=create(createElement(Component,{useProvenanceOverlay:(select:(state:ReturnType<typeof controller.getSnapshot>)=>unknown)=>select(useSyncExternalStore(controller.subscribe,controller.getSnapshot)),load,close:()=>controller.close()} as never))})
    act(()=>button(renderer,'evidence','input',true).props.onClick())
    assert.ok(renderer.root.findAllByType('h3').some(heading=>heading.children.includes('业务证据与来源')))
    assert.equal(button(renderer,'evidence','input').props['aria-pressed'],true)
    harness.set('en');assert.equal(reads,1)
    act(()=>button(renderer,'step','s2',true).props.onClick())
    assert.equal(button(renderer,'step','s2').props['aria-pressed'],true);assert.equal(reads,1)
    act(()=>controller.close())
    await act(async()=>controller.open('s1','m2',handle))
    assert.equal(reads,2)
    assert.equal(button(renderer,'step','s2').props['aria-pressed'],false)
  } finally {
    act(()=>renderer.unmount())
    if(previousWindow) Object.defineProperty(globalThis,'window',previousWindow);else Reflect.deleteProperty(globalThis,'window')
  }
})
