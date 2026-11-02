import assert from 'node:assert/strict'
import { after, afterEach, test } from 'node:test'
import { readFile } from 'node:fs/promises'
import { createElement, useSyncExternalStore } from 'react'
import { JSDOM } from 'jsdom'

const dom = new JSDOM('<!doctype html><html><body></body></html>',{url:'http://localhost/'})
for (const key of ['window','document','navigator','HTMLElement','Element','Node','ShadowRoot','SVGElement','MutationObserver','HTMLInputElement','HTMLTextAreaElement','HTMLBodyElement','HTMLHtmlElement'] as const) {
  Object.defineProperty(globalThis,key,{value:dom.window[key],configurable:true,writable:true})
}
Object.defineProperty(globalThis,'getComputedStyle',{value:dom.window.getComputedStyle.bind(dom.window),configurable:true})
dom.window.matchMedia = () => ({matches:false,media:'',onchange:null,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){},dispatchEvent(){return true}})
class ResizeObserverStub { observe() {} unobserve() {} disconnect() {} }
Object.defineProperty(globalThis,'ResizeObserver',{value:ResizeObserverStub,configurable:true})
Object.defineProperty(globalThis,'requestAnimationFrame',{value:(cb:FrameRequestCallback)=>setTimeout(()=>cb(Date.now()),0),configurable:true})
Object.defineProperty(globalThis,'cancelAnimationFrame',{value:clearTimeout,configurable:true})
dom.window.HTMLElement.prototype.scrollIntoView = () => {}
const {render,screen,fireEvent,waitFor,cleanup,act} = await import('@testing-library/react')
const {createPlatformProvenanceAdapter} = await import('../src/client/platform-provenance/index.tsx')
const {ProvenanceOverlay,ProvenanceOverlayController} = await import('../src/client/ProvenanceOverlay.tsx')
const fixture = JSON.parse(await readFile(new URL('./fixtures/provenance-parity/conversation.json',import.meta.url),'utf8'))
const legacy = JSON.parse(await readFile(new URL('./fixtures/provenance-parity/legacy-graph-explanation.json',import.meta.url),'utf8'))
const anchor = fixture.identity.initialInteractionId
afterEach(()=>cleanup())
after(()=>dom.window.close())

function setup(explanation:unknown,conversationDelayMs=0) {
  const calls:string[]=[]
  let conversationDelayed=false
  const adapter=createPlatformProvenanceAdapter(async request=>{
    calls.push(request.kind)
    switch(request.kind){
      case 'conversation':
        if(conversationDelayMs>0&&!conversationDelayed){
          conversationDelayed=true
          await new Promise(resolve=>setTimeout(resolve,conversationDelayMs))
        }
        return {entries:[fixture.conversation],total:1}
      case 'rounds':return {entries:[fixture.rounds.find((row:{interaction_id:string})=>row.interaction_id===anchor)],total:1,page:1,page_size:50}
      case 'detail':return structuredClone(fixture.details[anchor])
      case 'explanation':return structuredClone(explanation) as never
      case 'markdown':return fixture.markdown[anchor]
      case 'history':return {entries:[]}
      default:throw new Error('Fullscreen browsing must not generate or analyze')
    }
  },{async copyText(){},downloadMarkdown(){}})
  const controller=new ProvenanceOverlayController()
  controller.open('session-fullscreen','message-evidence',{schemaVersion:2,conversationId:fixture.identity.conversationId,interactionId:anchor,status:'completed',requestIds:[],traceIds:[],receiptIds:[],partial:false})
  const props={
    useProvenanceOverlay:(select:(state:ReturnType<typeof controller.getSnapshot>)=>unknown)=>select(useSyncExternalStore(controller.subscribe,controller.getSnapshot)),
    load:async()=>{throw new Error('Legacy viewer must not load')},createDetailAdapter:()=>adapter,close:()=>controller.close(),
  }
  return {...render(createElement(ProvenanceOverlay,props as never)),controller,calls}
}

async function evidenceReady() {
  await screen.findByRole('heading',{name:'本轮业务执行过程'},{timeout:10_000})
  fireEvent.click(screen.getByRole('tab',{name:'证据链'}))
  await screen.findByRole('button',{name:'全屏查看'},{timeout:10_000})
  await act(async()=>{})
}

async function withConnectedRects(run:()=>Promise<void>) {
  const prototype=dom.window.HTMLElement.prototype
  const original=prototype.getClientRects
  prototype.getClientRects=function(){return (this.isConnected?[new dom.window.DOMRect(0,0,100,24)]:[]) as unknown as DOMRectList}
  try {await run()} finally {prototype.getClientRects=original}
}

function tabCycle(layer:HTMLElement,name:string) {
  const controls=Array.from(layer.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]):not([type="hidden"]), textarea:not([disabled]), select:not([disabled]), summary, [tabindex]:not([tabindex="-1"])'))
    .filter(control=>control.tabIndex>=0 && control.getClientRects().length>0)
  const first=controls[0],last=controls.at(-1)
  assert.ok(first&&last)
  last.focus()
  const forwardConsumed=!fireEvent.keyDown(last,{key:'Tab'})
  const forward=forwardConsumed&&document.activeElement===first
  first.focus()
  const backwardConsumed=!fireEvent.keyDown(first,{key:'Tab',shiftKey:true})
  const backward=backwardConsumed&&document.activeElement===last
  return {layer:name,forward,backward}
}

test('v016 evidence fullscreen consumes Escape and restores the new non-portal fullscreen trigger',()=>withConnectedRects(async()=>{
  const state=setup(fixture.explanations[anchor],1200);await evidenceReady()
  const opener=screen.getByRole('button',{name:'全屏查看'})
  opener.focus();fireEvent.click(opener)
  const exit=await screen.findByRole('button',{name:'退出全屏'})
  const fullscreen=exit.closest<HTMLElement>('div[class*="fullScreen"]')
  assert.ok(fullscreen)
  const focusedOnEntry=fullscreen.contains(document.activeElement)
  const tabs=tabCycle(fullscreen,'v016 fullscreen')
  const graph=screen.getByRole('button',{name:'图谱模式'})
  graph.focus();fireEvent.keyDown(graph,{key:'Escape'})
  await act(async()=>{})
  assert.ok(state.controller.getSnapshot().handle,'fullscreen Escape must retain the DSH provenance overlay')
  assert.equal(focusedOnEntry,true,'entering fullscreen gives its owned layer keyboard focus')
  await waitFor(()=>assert.equal(screen.queryByRole('button',{name:'退出全屏'})===null,true))
  const restored=screen.getByRole('button',{name:'全屏查看'})
  assert.ok(restored!==opener,'the Portal transition remounts its trigger')
  assert.ok(document.activeElement===restored,'fullscreen exit restores the newly mounted trigger')
  assert.equal(state.calls.includes('generate')||state.calls.includes('analyze'),false)
  fireEvent.keyDown(restored,{key:'Escape'})
  await waitFor(()=>assert.equal(screen.queryByRole('dialog')===null,true))
  assert.ok(tabs.forward&&tabs.backward,JSON.stringify(tabs))
}))

test('legacy evidence fullscreen and its Inspector close in inner-to-outer Escape order',()=>withConnectedRects(async()=>{
  const state=setup(legacy);await evidenceReady()
  const opener=screen.getByRole('button',{name:'全屏查看'})
  opener.focus();fireEvent.click(opener)
  const exit=await screen.findByRole('button',{name:'退出全屏'})
  const fullscreen=exit.closest<HTMLElement>('div[class*="fullScreen"]')
  assert.ok(fullscreen)
  const focusedOnEntry=fullscreen.contains(document.activeElement)
  const tabs=[tabCycle(fullscreen,'legacy fullscreen')]
  const zoom=screen.getByRole('button',{name:'放大图谱'})
  zoom.focus();fireEvent.keyDown(zoom,{key:'Escape'})
  await act(async()=>{})
  assert.ok(state.controller.getSnapshot().handle,'legacy fullscreen Escape must retain the DSH provenance overlay')
  assert.equal(focusedOnEntry,true)
  await waitFor(()=>assert.equal(screen.queryByRole('button',{name:'退出全屏'})===null,true))
  const restored=screen.getByRole('button',{name:'全屏查看'})
  assert.ok(document.activeElement===restored)
  fireEvent.click(restored)
  await screen.findByRole('button',{name:'退出全屏'})
  const node=screen.getByRole('button',{name:/平台共享输入/})
  node.focus();fireEvent.click(node)
  const inspector=screen.getAllByRole('dialog').find(dialog=>dialog!==fullscreen && dialog.getAttribute('aria-label')!=='OpenBKN 业务溯源' && !dialog.className.includes('fullScreen'))
  assert.ok(inspector)
  assert.ok(document.activeElement===inspector)
  tabs.push(tabCycle(inspector,'legacy Inspector'))
  fireEvent.keyDown(document.activeElement!,{key:'Escape'})
  await act(async()=>{})
  assert.ok(state.controller.getSnapshot().handle)
  assert.ok(screen.queryByRole('button',{name:'退出全屏'}),'Inspector Escape must keep fullscreen active')
  assert.ok(document.activeElement===node)
  fireEvent.keyDown(node,{key:'Escape'})
  await waitFor(()=>assert.equal(screen.queryByRole('button',{name:'退出全屏'})===null,true))
  const finalTrigger=screen.getByRole('button',{name:'全屏查看'})
  assert.ok(document.activeElement===finalTrigger)
  assert.equal(state.calls.includes('generate')||state.calls.includes('analyze'),false)
  fireEvent.keyDown(finalTrigger,{key:'Escape'})
  await waitFor(()=>assert.equal(screen.queryByRole('dialog')===null,true))
  assert.ok(tabs.every(cycle=>cycle.forward&&cycle.backward),JSON.stringify(tabs))
}))
