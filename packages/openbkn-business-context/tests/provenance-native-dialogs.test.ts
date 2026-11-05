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

function setup(options:{history?:boolean;conversationDelayMs?:number;analysis?:Promise<Record<string,unknown>>;readHistory?:()=>Promise<{entries:unknown[]}>}={}) {
  const calls:string[] = []
  const copied:string[] = []
  const analysisInputs:{interactionId?:string;markdown?:string}[] = []
  const adapter = createPlatformProvenanceAdapter(async (request,_signal,onAnalysis) => {
    calls.push(request.kind)
    switch(request.kind) {
      case 'conversation':
        if (options.conversationDelayMs) await new Promise(resolve=>setTimeout(resolve,options.conversationDelayMs))
        return {entries:[fixture.conversation],total:1}
      case 'rounds':return {entries:[fixture.rounds.find((row:{interaction_id:string})=>row.interaction_id===anchor)],total:1,page:1,page_size:50}
      case 'detail':return structuredClone(fixture.details[anchor])
      case 'markdown':return fixture.markdown[anchor]
      case 'history':return options.readHistory?await options.readHistory():{entries:options.history?structuredClone(fixture.history[anchor]):[]}
      case 'explanation':return {schema_version:'1',interaction_id:anchor,status:'not_generated'}
      case 'analyze': {
        if (!options.analysis) throw new Error('Opening a reader must not generate or analyze')
        analysisInputs.push({interactionId:request.interactionId,markdown:request.markdown})
        const result=await options.analysis
        onAnalysis?.({event:'structured',data:{content:result as never}})
        return null
      }
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
  return {...render(createElement(ProvenanceOverlay,props as never)),controller,calls,copied,analysisInputs}
}

async function ready() {
  // Cold AntD rendering and queued reads can exceed the default 1 s on CI.
  await screen.findByRole('heading',{name:'本轮业务执行过程'},{timeout:10_000})
  await waitFor(()=>assert.equal((screen.getByRole('button',{name:'交给 BKN Agent 分析'}) as HTMLButtonElement).disabled,false),{timeout:10_000})
  await act(async()=>{})
}

async function sourceLayer(title:string):Promise<HTMLElement> {
  await waitFor(()=>assert.equal(screen.queryAllByRole('heading',{name:title}).length,2),{timeout:10_000})
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

for (const [label,title] of [
  ['查看完整本轮输入','本轮输入（原文）'],
  ['查看完整本轮输出','本轮输出（原文）'],
] as const) {
  test(`owned Escape dismisses a popup focused from hover without accepting delayed hover re-entry: ${label}`,async()=>{
    const state = setup();await ready()
    const search = screen.getByRole('textbox')
    const trigger = screen.getByRole('button',{name:label})
    search.focus();fireEvent.mouseEnter(trigger)
    const layer = await sourceLayer(title)
    assert.equal(document.activeElement,search,'hover must retain the external keyboard focus')
    // JSDOM models the owned focus/event sequence, not real popup overlap or hit testing.
    layer.focus();fireEvent.click(layer)
    fireEvent.keyDown(layer,{key:'Escape'})
    // A disappearing overlay can expose its still-hovered trigger and queue another enter.
    fireEvent.mouseLeave(layer,{relatedTarget:trigger})
    fireEvent.mouseEnter(trigger)
    await act(async()=>{await new Promise(resolve=>setTimeout(resolve,450))})
    assert.ok(state.controller.getSnapshot().handle,'owned Escape must preserve the parent detail')
    assert.equal(screen.queryAllByRole('heading',{name:title}).length,1,'dismissal must outlive hover and exit-motion delays')
    assert.equal(document.activeElement,search,'a hover-focused popup returns to the original search control')
    assert.equal(state.calls.includes('generate')||state.calls.includes('analyze'),false)
  })

  test(`Escape dismissal allows a later pointer visit and explicit activation: ${label}`,async()=>{
    const state = setup();await ready()
    const search = screen.getByRole('textbox')
    const trigger = screen.getByRole('button',{name:label})
    search.focus();fireEvent.mouseEnter(trigger)
    const layer = await sourceLayer(title)
    layer.focus();fireEvent.keyDown(layer,{key:'Escape'})
    await waitFor(()=>assert.equal(screen.queryAllByRole('heading',{name:title}).length,1))
    fireEvent.mouseLeave(trigger,{relatedTarget:search})
    fireEvent.mouseEnter(trigger)
    const hovered = await sourceLayer(title)
    assert.equal(document.activeElement,search,'a fresh pointer visit still must not steal focus')
    hovered.focus();fireEvent.keyDown(hovered,{key:'Escape'})
    await waitFor(()=>assert.equal(screen.queryAllByRole('heading',{name:title}).length,1))
    // Explicit click is also the native keyboard activation's click path.
    trigger.focus();fireEvent.click(trigger,{detail:0})
    const activated = await sourceLayer(title)
    assert.ok(activated.contains(document.activeElement),'explicit activation must not stay hover-suppressed')
    fireEvent.keyDown(activated,{key:'Escape'})
    await waitFor(()=>assert.equal(screen.queryAllByRole('heading',{name:title}).length,1))
    assert.equal(document.activeElement,trigger,'explicit activation restores its trigger')
    assert.ok(state.controller.getSnapshot().handle)
    assert.equal(state.calls.includes('generate')||state.calls.includes('analyze'),false)
  })

  test(`keyboard dismissal without a hover visit permits the first later hover: ${label}`,async()=>{
    const state = setup();await ready()
    const trigger = screen.getByRole('button',{name:label})
    trigger.focus();fireEvent.click(trigger,{detail:0})
    const layer = await sourceLayer(title)
    fireEvent.keyDown(layer,{key:'Escape'})
    await waitFor(()=>assert.equal(screen.queryAllByRole('heading',{name:title}).length,1))
    // There was no pointer visit, so no preceding mouseLeave exists to clear a dismissal.
    fireEvent.mouseEnter(trigger)
    await sourceLayer(title)
    assert.equal(document.activeElement,trigger,'first hover after keyboard dismissal remains nonmodal')
    assert.ok(state.controller.getSnapshot().handle)
    assert.equal(state.calls.includes('generate')||state.calls.includes('analyze'),false)
  })

  test(`owned Escape also dismisses the same hover visit while the pointer is on popup padding: ${label}`,async()=>{
    const state = setup();await ready()
    const search = screen.getByRole('textbox')
    const trigger = screen.getByRole('button',{name:label})
    search.focus();fireEvent.mouseEnter(trigger)
    const layer = await sourceLayer(title)
    const popup = layer.closest<HTMLElement>('.ant-popover')
    const padding = popup?.querySelector<HTMLElement>('.ant-popover-inner')
    assert.ok(popup&&padding)
    layer.focus();fireEvent.click(layer)
    // Model moving into AntD padding without leaving this popup's actual root.
    fireEvent.mouseLeave(layer,{relatedTarget:padding})
    fireEvent.keyDown(layer,{key:'Escape'})
    fireEvent.mouseLeave(popup,{relatedTarget:trigger})
    fireEvent.mouseEnter(trigger)
    await act(async()=>{await new Promise(resolve=>setTimeout(resolve,450))})
    assert.equal(screen.queryAllByRole('heading',{name:title}).length,1,'popup chrome belongs to the same dismissed hover visit')
    assert.ok(state.controller.getSnapshot().handle)
    assert.equal(document.activeElement,search)
    assert.equal(state.calls.includes('generate')||state.calls.includes('analyze'),false)
    fireEvent.mouseLeave(popup,{relatedTarget:search})
    fireEvent.mouseEnter(trigger)
    await sourceLayer(title)
    assert.equal(document.activeElement,search,'leaving the complete popup allows a fresh nonmodal hover visit')
  })
}

test('pure hover with search focus leaves Escape ownership with the parent detail',async()=>{
  const state = setup();await ready()
  const search = screen.getByRole('textbox')
  const trigger = screen.getByRole('button',{name:'查看完整本轮输出'})
  search.focus();fireEvent.mouseEnter(trigger)
  await sourceLayer('本轮输出（原文）')
  assert.equal(document.activeElement,search,'a hover preview is not a modal activation')
  fireEvent.keyDown(search,{key:'Escape'})
  await waitFor(()=>assert.equal(state.controller.getSnapshot().handle,undefined))
  assert.equal(state.calls.includes('generate')||state.calls.includes('analyze'),false)
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

function deferred<T>() {
  let resolve!:(value:T)=>void, reject!:(reason:unknown)=>void
  const promise=new Promise<T>((done,fail)=>{resolve=done;reject=fail})
  return {promise,resolve,reject}
}

async function analysisPanel(state:ReturnType<typeof setup>) {
  await ready()
  const opener=screen.getByRole('button',{name:'交给 BKN Agent 分析'})
  opener.focus();fireEvent.click(opener)
  const panel=state.container.querySelector<HTMLElement>('aside[class*="agentPanel"]')
  assert.ok(panel)
  return {opener,panel}
}

test('analysis lifecycle keeps Escape owned after the focused start control is removed and a not_evaluable result arrives',async()=>{
  const pending=deferred<Record<string,unknown>>()
  const result={decision:'not_evaluable',conclusion:'平台完成结果原文',recommendations:[]}
  const original=JSON.stringify(result)
  const state=setup({analysis:pending.promise})
  const {opener,panel}=await analysisPanel(state)
  const start=within(panel).getByRole('button',{name:'开始分析'})
  start.focus();fireEvent.click(start)
  assert.equal(start.isConnected,false,'busy replaces the focused editor; it does not merely disable Start')
  const busyOwned=panel.contains(document.activeElement)
  await act(async()=>pending.resolve(result))
  await within(panel).findByText('平台完成结果原文')
  const completedOwned=panel.contains(document.activeElement)
  fireEvent.keyDown(document.activeElement!,{key:'Escape'})
  await act(async()=>{})
  assert.ok(state.controller.getSnapshot().handle,'analysis completion Escape must retain the outer overlay')
  assert.ok(!state.container.contains(panel),'Escape must close the completed analysis without needing Tab first')
  assert.ok(document.activeElement===opener,'completion Escape restores the analysis opener')
  assert.ok(busyOwned&&completedOwned,'focus stays owned across busy and completed states')
  assert.equal(JSON.stringify(result),original,'platform not_evaluable and zero recommendations stay unchanged')
  assert.deepEqual(state.analysisInputs,[{interactionId:anchor,markdown:fixture.markdown[anchor]}])
  assert.equal(state.calls.filter(kind=>kind==='analyze').length,1)
  assert.equal(state.calls.includes('generate'),false)
})

test('analysis lifecycle restores panel focus when restarting an existing history result removes its button',async()=>{
  const state=setup({history:true})
  const {opener,panel}=await analysisPanel(state)
  const restart=await within(panel).findByRole('button',{name:'重新分析'})
  restart.focus();fireEvent.click(restart)
  assert.equal(restart.isConnected,false)
  assert.ok(panel.contains(document.activeElement),'the removed result action cannot leave focus on body')
  fireEvent.keyDown(document.activeElement!,{key:'Escape'})
  await waitFor(()=>assert.ok(!state.container.contains(panel)))
  assert.ok(state.controller.getSnapshot().handle)
  assert.ok(document.activeElement===opener)
  assert.equal(state.calls.includes('generate')||state.calls.includes('analyze'),false)
})

test('analysis lifecycle restores panel focus when late history replaces the focused editor',async()=>{
  const history=deferred<{entries:unknown[]}>()
  const state=setup({readHistory:()=>history.promise})
  const {opener,panel}=await analysisPanel(state)
  const start=within(panel).getByRole('button',{name:'开始分析'})
  start.focus()
  await act(async()=>history.resolve({entries:structuredClone(fixture.history[anchor])}))
  await within(panel).findByRole('button',{name:'重新分析'})
  assert.equal(start.isConnected,false)
  assert.ok(panel.contains(document.activeElement),'an authorized history read cannot strand focus outside its panel')
  fireEvent.keyDown(document.activeElement!,{key:'Escape'})
  await waitFor(()=>assert.ok(!state.container.contains(panel)))
  assert.ok(state.controller.getSnapshot().handle)
  assert.ok(document.activeElement===opener)
  assert.equal(state.calls.includes('generate')||state.calls.includes('analyze'),false)
})

test('analysis lifecycle preserves another connected portal focus while a pending result arrives',async()=>{
  const pending=deferred<Record<string,unknown>>()
  const state=setup({analysis:pending.promise})
  const {panel}=await analysisPanel(state)
  const start=within(panel).getByRole('button',{name:'开始分析'})
  start.focus();fireEvent.click(start)
  const portal=document.createElement('button')
  portal.textContent='unrelated host portal'
  document.body.append(portal)
  try {
    portal.focus()
    await act(async()=>pending.resolve({conclusion:'平台异步结果原文',recommendations:[]}))
    await within(panel).findByText('平台异步结果原文')
    assert.ok(document.activeElement===portal,'analysis completion must not take focus from another connected portal')
    fireEvent.keyDown(portal,{key:'Escape'})
    assert.ok(state.container.contains(panel),'the panel does not globally consume another portal Escape')
    assert.ok(state.controller.getSnapshot().handle)
  } finally {portal.remove()}
})

test('analysis lifecycle preserves its stable close control focus during a result transition',async()=>{
  const pending=deferred<Record<string,unknown>>()
  const state=setup({analysis:pending.promise})
  const {panel}=await analysisPanel(state)
  const start=within(panel).getByRole('button',{name:'开始分析'})
  start.focus();fireEvent.click(start)
  const close=within(panel).getByRole('button',{name:'关闭 BKN Agent 分析'})
  close.focus()
  await act(async()=>pending.resolve({conclusion:'平台稳定焦点原文',recommendations:[]}))
  await within(panel).findByText('平台稳定焦点原文')
  assert.ok(document.activeElement===close,'connected controls keep their existing focus')
})

test('analysis lifecycle restores panel focus when returning from a failed result removes its action',async()=>{
  const pending=deferred<Record<string,unknown>>()
  const state=setup({analysis:pending.promise})
  const {opener,panel}=await analysisPanel(state)
  const start=within(panel).getByRole('button',{name:'开始分析'})
  start.focus();fireEvent.click(start)
  await act(async()=>pending.reject(new Error('平台分析失败原文')))
  const back=await within(panel).findByRole('button',{name:'返回事实输入'})
  back.focus();fireEvent.click(back)
  assert.equal(back.isConnected,false)
  assert.ok(panel.contains(document.activeElement),'removing the error action restores the owned panel')
  fireEvent.keyDown(document.activeElement!,{key:'Escape'})
  await waitFor(()=>assert.ok(!state.container.contains(panel)))
  assert.ok(state.controller.getSnapshot().handle)
  assert.ok(document.activeElement===opener)
  assert.equal(state.calls.filter(kind=>kind==='analyze').length,1)
})

test('analysis lifecycle recovers browser root focus from a still-connected disabled control',async()=>{
  const history=deferred<{entries:unknown[]}>()
  const state=setup({readHistory:()=>history.promise})
  const {opener,panel}=await analysisPanel(state)
  const close=within(panel).getByRole('button',{name:'关闭 BKN Agent 分析'}) as HTMLButtonElement
  const root=document.documentElement,previousTabIndex=root.getAttribute('tabindex')
  try {
    close.focus();close.disabled=true;close.blur()
    root.tabIndex=-1;root.focus()
    assert.ok(close.isConnected&&close.disabled)
    assert.ok(document.activeElement===root,'model the native browser root fallback after disabling a focused control')
    await act(async()=>history.resolve({entries:structuredClone(fixture.history[anchor])}))
    await within(panel).findByRole('button',{name:'重新分析'})
    assert.ok(panel.contains(document.activeElement),'a connected but disabled owned control must not strand focus on HTML')
    close.disabled=false
    fireEvent.keyDown(document.activeElement!,{key:'Escape'})
    await waitFor(()=>assert.ok(!state.container.contains(panel)))
    assert.ok(state.controller.getSnapshot().handle)
    assert.ok(document.activeElement===opener)
    assert.equal(state.calls.includes('generate')||state.calls.includes('analyze'),false)
  } finally {
    if(previousTabIndex===null)root.removeAttribute('tabindex');else root.setAttribute('tabindex',previousTabIndex)
  }
})

test('analysis lifecycle recovers panel focus when refreshed history removes its focused combobox',async()=>{
  const pending=deferred<Record<string,unknown>>()
  let historyReads=0
  const state=setup({analysis:pending.promise,readHistory:async()=>({entries:++historyReads===1?structuredClone(fixture.history[anchor]):[]})})
  const {opener,panel}=await analysisPanel(state)
  fireEvent.click(await within(panel).findByRole('button',{name:'重新分析'}))
  const start=within(panel).getByRole('button',{name:'开始分析'})
  start.focus();fireEvent.click(start)
  const history=within(panel).getByRole('combobox')
  history.focus()
  await act(async()=>pending.resolve({conclusion:'平台空历史刷新结果原文',recommendations:[]}))
  await within(panel).findByText('平台空历史刷新结果原文')
  await waitFor(()=>assert.equal(history.isConnected,false))
  assert.ok(panel.contains(document.activeElement),'removing an owned history control restores panel focus')
  fireEvent.keyDown(document.activeElement!,{key:'Escape'})
  await waitFor(()=>assert.ok(!state.container.contains(panel)))
  assert.ok(state.controller.getSnapshot().handle)
  assert.ok(document.activeElement===opener)
  assert.equal(state.calls.filter(kind=>kind==='analyze').length,1)
})
