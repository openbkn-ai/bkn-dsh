import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement, useState, useSyncExternalStore } from 'react'
import { act, create } from 'react-test-renderer'
import type { LocaleRuntime } from '@deepseek-ai/dsh-client-locale/client'
import { localized } from '../src/client/locale.tsx'
import { translateMessage } from '../src/client/messages.ts'
import { NativeProvenancePanel } from '../src/client/NativeProvenancePanel.tsx'
import type { NativeTargetKind } from '../src/client/native-provenance-selection.ts'
import { selectionFixture } from './fixtures/native-selection.ts'

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
    assert.equal(ui.renderer.root.findAllByType('h4').length,0)
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
