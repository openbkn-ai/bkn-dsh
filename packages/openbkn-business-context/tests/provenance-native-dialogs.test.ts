import assert from 'node:assert/strict'
import { after, afterEach, test } from 'node:test'
import { readFile } from 'node:fs/promises'
import { createElement, useSyncExternalStore } from 'react'
import { JSDOM } from 'jsdom'

const dom = new JSDOM('<!doctype html><html><body></body></html>', {url:'http://localhost/'})
for (const key of ['window','document','navigator','HTMLElement','HTMLBodyElement','Element','Node','ShadowRoot','SVGElement','MutationObserver','HTMLInputElement','HTMLTextAreaElement'] as const) {
  Object.defineProperty(globalThis,key,{value:dom.window[key],configurable:true,writable:true})
}
for (const key of Object.getOwnPropertyNames(dom.window).filter(name=>/^HTML.*Element$/.test(name))) {
  Object.defineProperty(globalThis,key,{value:Reflect.get(dom.window,key),configurable:true,writable:true})
}
Object.defineProperty(globalThis,'getComputedStyle',{value:dom.window.getComputedStyle.bind(dom.window),configurable:true})
dom.window.matchMedia = () => ({matches:false,media:'',onchange:null,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){},dispatchEvent(){return true}})
class ResizeObserverStub { observe() {} unobserve() {} disconnect() {} }
Object.defineProperty(globalThis,'ResizeObserver',{value:ResizeObserverStub,configurable:true})
Object.defineProperty(globalThis,'requestAnimationFrame',{value:(cb:FrameRequestCallback)=>setTimeout(()=>cb(Date.now()),0),configurable:true})
Object.defineProperty(globalThis,'cancelAnimationFrame',{value:clearTimeout,configurable:true})
dom.window.HTMLElement.prototype.scrollIntoView = () => {}
const {render,screen,fireEvent,waitFor,cleanup,act,within} = await import('@testing-library/react')
const {createPlatformProvenanceAdapter} = await import('../src/client/platform-provenance/index.tsx')
const {ProvenanceOverlay,ProvenanceOverlayController} = await import('../src/client/ProvenanceOverlay.tsx')
const fixture = JSON.parse(await readFile(new URL('./fixtures/provenance-parity/conversation.json',import.meta.url),'utf8'))
const anchor = fixture.identity.initialInteractionId

afterEach(() => cleanup())
after(() => dom.window.close())

function setup(options:{history?:boolean;conversationDelayMs?:number}={}) {
  const calls:string[] = []
  const copied:string[] = []
  const adapter = createPlatformProvenanceAdapter(async request => {
    calls.push(request.kind)
    switch(request.kind) {
      case 'conversation':
        if (options.conversationDelayMs) await new Promise(resolve=>setTimeout(resolve,options.conversationDelayMs))
        return {entries:[fixture.conversation],total:1}
      case 'rounds':return {entries:[fixture.rounds.find((row:{interaction_id:string})=>row.interaction_id===anchor)],total:1,page:1,page_size:50}
      case 'detail':return structuredClone(fixture.details[anchor])
      case 'markdown':return fixture.markdown[anchor]
      case 'history':return {entries:options.history?structuredClone(fixture.history[anchor]):[]}
      case 'explanation':return {schema_version:'1',interaction_id:anchor,status:'not_generated'}
      default:throw new Error('Opening a reader must not generate or analyze')
    }
  }, {async copyText(value){copied.push(value)},downloadMarkdown(){}})
  const controller = new ProvenanceOverlayController()
  controller.open('session-native-dialogs','message-original',{schemaVersion:2,conversationId:fixture.identity.conversationId,interactionId:anchor,status:'completed',requestIds:[],traceIds:[],receiptIds:[],partial:false})
  const props = {
    useProvenanceOverlay:(select:(state:ReturnType<typeof controller.getSnapshot>)=>unknown)=>select(useSyncExternalStore(controller.subscribe,controller.getSnapshot)),
    load:async()=>{throw new Error('Legacy viewer must not load')},
    createDetailAdapter:()=>adapter,
    close:()=>controller.close(),
  }
  return {...render(createElement(ProvenanceOverlay,props as never)),controller,calls,copied}
}

async function ready() {
  // Cold AntD rendering and queued reads can exceed the default 1 s on CI.
  await screen.findByRole('heading',{name:'本轮业务执行过程'},{timeout:10_000})
  await waitFor(()=>assert.equal((screen.getByRole('button',{name:'交给 BKN Agent 分析'}) as HTMLButtonElement).disabled,false),{timeout:10_000})
  await act(async()=>{})
}

async function sourceLayer(title:string):Promise<HTMLElement> {
  await waitFor(()=>assert.equal(screen.queryAllByRole('heading',{name:title}).length,2))
  const section = screen.getAllByRole('heading',{name:title}).map(node=>node.closest('section')).find(node=>node?.className.includes('sourceTextPopoverContent'))
  assert.ok(section)
  return section
}

for (const [label,title,field] of [
  ['查看完整本轮输入','本轮输入（原文）','interaction_question'],
  ['查看完整本轮输出','本轮输出（原文）','interaction_result'],
] as const) {
  test(`native outer Escape closes only the activated ${field} popover and restores its trigger`,async()=>{
    // Keep the cold-start path slower than Testing Library's default 1 s window.
    const state = setup({conversationDelayMs:field==='interaction_question'?1200:0});await ready()
    const trigger = screen.getByRole('button',{name:label})
    trigger.focus();fireEvent.click(trigger)
    const layer = await sourceLayer(title)
    const focusedInside = layer.contains(document.activeElement)
    const copy = layer.querySelector('button')
    assert.ok(copy);fireEvent.click(copy)
    await waitFor(()=>assert.deepEqual(state.copied,[fixture.details[anchor][field]]))
    fireEvent.keyDown(document.activeElement!,{key:'Escape'})
    await act(async()=>{})
    assert.ok(state.controller.getSnapshot().handle,'first Escape must not close the DSH provenance overlay')
    assert.equal(focusedInside,true,'explicit original-text activation moves keyboard focus into its layer')
    await waitFor(()=>assert.equal(screen.queryAllByRole('heading',{name:title}).length,1))
    assert.ok(document.activeElement===trigger,'closing the original-text layer restores its trigger')
    assert.equal(state.calls.includes('generate')||state.calls.includes('analyze'),false)
    fireEvent.keyDown(trigger,{key:'Escape'})
    await waitFor(()=>assert.equal(screen.queryByRole('dialog')===null,true))
  })
}

test('hover original-text preview keeps existing focus and Escape on its trigger closes only the preview',async()=>{
  const state = setup();await ready()
  const outer = screen.getByRole('dialog')
  const trigger = screen.getByRole('button',{name:'查看完整本轮输入'})
  outer.focus();fireEvent.mouseEnter(trigger)
  await sourceLayer('本轮输入（原文）')
  assert.ok(document.activeElement===outer,'hover alone must not take keyboard focus')
  trigger.focus();fireEvent.keyDown(trigger,{key:'Escape'})
  await act(async()=>{})
  assert.ok(state.controller.getSnapshot().handle,'the open preview consumes its trigger Escape')
  await waitFor(()=>assert.equal(screen.queryAllByRole('heading',{name:'本轮输入（原文）'}).length,1))
})

test('analysis reader Escape closes only its side panel without starting analysis or closing the DSH overlay',async()=>{
  const state = setup();await ready()
  const trigger = screen.getByRole('button',{name:'交给 BKN Agent 分析'})
  trigger.focus();fireEvent.click(trigger)
  const panel = state.container.querySelector<HTMLElement>('aside[class*="agentPanel"]')
  assert.ok(panel)
  const focusedInside = panel.contains(document.activeElement)
  fireEvent.keyDown(document.activeElement!,{key:'Escape'})
  await act(async()=>{})
  assert.ok(state.controller.getSnapshot().handle,'analysis reader Escape must not close the DSH provenance overlay')
  assert.equal(focusedInside,true,'the analysis reader receives keyboard focus')
  await waitFor(()=>assert.equal(state.container.querySelector('aside[class*="agentPanel"]')===null,true))
  assert.ok(document.activeElement===trigger)
  assert.equal(state.calls.includes('generate')||state.calls.includes('analyze'),false)
  fireEvent.keyDown(trigger,{key:'Escape'})
  await waitFor(()=>assert.equal(screen.queryByRole('dialog')===null,true))
})

test('analysis history dropdown consumes Escape before the analysis panel and outer overlay',async()=>{
  const state = setup({history:true});await ready()
  const trigger = screen.getByRole('button',{name:'交给 BKN Agent 分析'})
  trigger.focus();fireEvent.click(trigger)
  const panel = state.container.querySelector<HTMLElement>('aside[class*="agentPanel"]')
  assert.ok(panel)
  const history = await within(panel).findByRole('combobox')
  history.focus();fireEvent.mouseDown(history)
  await waitFor(()=>assert.equal(history.getAttribute('aria-expanded'),'true'))
  fireEvent.keyDown(history,{key:'Escape'})
  await act(async()=>{})
  assert.ok(state.controller.getSnapshot().handle,'history Escape must not close the DSH overlay')
  assert.ok(state.container.contains(panel),'history Escape must not close the analysis panel')
  await waitFor(()=>assert.equal(history.getAttribute('aria-expanded'),'false'))
  fireEvent.keyDown(history,{key:'Escape'})
  await waitFor(()=>assert.equal(state.container.querySelector('aside[class*="agentPanel"]')===null,true))
  assert.ok(state.controller.getSnapshot().handle)
  assert.ok(document.activeElement===trigger)
  assert.equal(state.calls.includes('generate')||state.calls.includes('analyze'),false)
  fireEvent.keyDown(trigger,{key:'Escape'})
  await waitFor(()=>assert.equal(screen.queryByRole('dialog')===null,true))
})

async function withVisibleClientRects(run:()=>Promise<void>) {
  const previous = HTMLElement.prototype.getClientRects
  HTMLElement.prototype.getClientRects = function(){return this.isConnected?[{}] as never:[] as never}
  try {await run()} finally {HTMLElement.prototype.getClientRects=previous}
}

for (const backwards of [false,true]) {
  test(`analysis modal ${backwards?'ShiftTab wraps first to last':'Tab wraps last to first'} before the outer focus trap`,async()=>{
    await withVisibleClientRects(async()=>{
      const state=setup();await ready()
      const opener=screen.getByRole('button',{name:'交给 BKN Agent 分析'})
      opener.focus();fireEvent.click(opener)
      const panel=state.container.querySelector<HTMLElement>('aside[class*="agentPanel"]')
      assert.ok(panel)
      const first=within(panel).getByRole('button',{name:'关闭 BKN Agent 分析'})
      const last=within(panel).getByRole('button',{name:'开始分析'})
      const from=backwards?first:last, to=backwards?last:first
      from.focus();fireEvent.keyDown(from,{key:'Tab',shiftKey:backwards})
      assert.ok(panel.contains(document.activeElement),'Tab must stay in the inner analysis modal')
      assert.ok(document.activeElement===to,'the inner modal wraps at its own boundary')
      fireEvent.keyDown(to,{key:'Escape'})
      await waitFor(()=>assert.equal(state.container.querySelector('aside[class*="agentPanel"]')===null,true))
      assert.ok(state.controller.getSnapshot().handle,'Escape after Tab still belongs to the analysis modal')
      assert.ok(document.activeElement===opener)
      assert.equal(state.calls.includes('generate')||state.calls.includes('analyze'),false)
    })
  })
}

test('nonmodal original-text Popover permits Tab to leave its preview',async()=>{
  await withVisibleClientRects(async()=>{
    const state=setup();await ready()
    const trigger=screen.getByRole('button',{name:'查看完整本轮输入'})
    trigger.focus();fireEvent.click(trigger)
    const preview=await sourceLayer('本轮输入（原文）')
    const copy=preview.querySelector('button')
    assert.ok(copy);copy.focus();fireEvent.keyDown(copy,{key:'Tab'})
    assert.ok(!preview.contains(document.activeElement),'a nonmodal preview must not trap focus inside itself')
    assert.ok(state.controller.getSnapshot().handle)
    assert.equal(state.calls.includes('generate')||state.calls.includes('analyze'),false)
  })
})
