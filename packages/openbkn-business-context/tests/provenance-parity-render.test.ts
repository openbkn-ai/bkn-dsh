import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import { readFile } from 'node:fs/promises'
import { createElement, useSyncExternalStore } from 'react'
import { JSDOM } from 'jsdom'
import type { ProvenanceDetailRequest } from '../src/provenance-detail-types.ts'

const dom = new JSDOM('<!doctype html><html><body></body></html>',{url:'http://localhost/'})
for (const key of ['window','document','navigator','HTMLElement','Element','Node','ShadowRoot','SVGElement','MutationObserver','HTMLInputElement','HTMLTextAreaElement'] as const) {
  Object.defineProperty(globalThis,key,{value:dom.window[key],configurable:true,writable:true})
}
Object.defineProperty(globalThis,'getComputedStyle',{value:dom.window.getComputedStyle.bind(dom.window),configurable:true})
dom.window.matchMedia = () => ({matches:false,media:'',onchange:null,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){},dispatchEvent(){return true}})
class ResizeObserverStub { observe() {} unobserve() {} disconnect() {} }
Object.defineProperty(globalThis,'ResizeObserver',{value:ResizeObserverStub,configurable:true})
Object.defineProperty(globalThis,'requestAnimationFrame',{value:(cb:FrameRequestCallback)=>setTimeout(()=>cb(Date.now()),0),configurable:true})
Object.defineProperty(globalThis,'cancelAnimationFrame',{value:clearTimeout,configurable:true})
dom.window.HTMLElement.prototype.scrollIntoView = () => {}
const {render,screen,fireEvent,waitFor,cleanup,within,act} = await import('@testing-library/react')
const {PlatformProvenanceDetail,createPlatformProvenanceAdapter} = await import('../src/client/platform-provenance/index.tsx')
const fixture = JSON.parse(await readFile(new URL('./fixtures/provenance-parity/conversation.json',import.meta.url),'utf8'))
const anchor = fixture.identity.initialInteractionId

afterEach(() => {cleanup()})
function setup(options: { initialId?:string; missingAnchor?:boolean; partial?:boolean; detailDeferred?:Promise<unknown>; notGenerated?:boolean; emptyHistory?:boolean; analysisFails?:boolean; skipRender?:boolean; generateDeferred?:Promise<unknown>; explanationOverride?:unknown } = {}) {
  const calls: ProvenanceDetailRequest[] = []
  const signals:{kind:string;signal:AbortSignal|undefined}[]=[]
  const copied: string[] = []
  const downloads: {id:string;markdown:string}[] = []
  const adapter = createPlatformProvenanceAdapter(async (request, _signal, onAnalysis) => {
    calls.push(structuredClone(request))
    signals.push({kind:request.kind,signal:_signal})
    if(request.kind==='generate' && options.generateDeferred)return await options.generateDeferred as never
    switch(request.kind) {
      case 'conversation':return {entries:[fixture.conversation],total:1}
      case 'rounds': {
        const candidates = fixture.rounds.filter((item: {interaction_id:string;question_preview:string}) => (!options.missingAnchor || item.interaction_id !== anchor) && (!request.keyword || item.question_preview.includes(request.keyword)))
        const page = request.page ?? 1, size = request.pageSize ?? 50
        return {entries: candidates.slice((page-1)*size,page*size),total:candidates.length,page,page_size:size,...(options.partial?{partial:true,truncated:true,partial_reasons:['platform-test-partial']}: {})}
      }
      case 'detail': {
        if (options.detailDeferred) return await options.detailDeferred as never
        const detail = fixture.details[request.interactionId!]
        if (!detail) throw new Error('fixture detail missing')
        return structuredClone(detail)
      }
      case 'explanation':case 'generate':return structuredClone(request.kind==='explanation' && options.explanationOverride ? options.explanationOverride : request.kind==='explanation' && options.notGenerated ? {schema_version:'1',interaction_id:request.interactionId!,status:'not_generated'} : fixture.explanations[request.interactionId!] ?? {schema_version:'1',interaction_id:request.interactionId!,status:'not_generated'})
      case 'markdown':return fixture.markdown[request.interactionId!] ?? '# 平台其他轮 Markdown'
      case 'history':return {entries:structuredClone(options.emptyHistory ? [] : fixture.history[request.interactionId!] ?? [])}
      case 'analyze': {
        if(options.analysisFails) {onAnalysis?.({event:'error',data:{code:'platform-test-analysis-failure',message:'平台分析失败原文'}});return null}
        onAnalysis?.({event:'token',data:{content:'平台流式进度'}})
        onAnalysis?.({event:'structured',data:{content:{conclusion:'平台分析结论原文'}}})
        return null
      }
    }
  }, {async copyText(text){copied.push(text)},downloadMarkdown(id,markdown){downloads.push({id,markdown})}})
  const conversation = {conversationId:fixture.conversation.conversation_id,agentName:fixture.conversation.agent_name,interactionCount:73}
  const result = options.skipRender ? undefined : render(createElement(PlatformProvenanceDetail,{conversation,initialInteractionId:options.initialId??anchor,adapter,language:'zh'}))
  return {...result,calls,copied,downloads,adapter,signals}
}
async function ready() { await screen.findByRole('tab',{name:'时间链'}); await waitFor(()=>assert.ok(screen.queryByRole('heading',{name:'本轮业务执行过程'}))) }

test('platform detail opens the exact answer outside the first 50 rounds and uses canonical visible labels',async () => {
  const {calls,container} = setup()
  await ready()
  assert.ok(calls.some(call=>call.kind==='rounds' && call.page===2))
  assert.ok(calls.filter(call=>call.kind==='detail').every(call=>call.interactionId===anchor))
  assert.ok(screen.queryByText('返回业务溯源列表')===null)
  assert.ok(screen.queryByRole('tab',{name:'事件链'})===null)
  assert.ok(screen.getByRole('tab',{name:'证据链'}))
  assert.ok(screen.getByText('本轮输入（原文）'))
  assert.ok(screen.getByText('本轮输出（原文）'))
  assert.ok(screen.getByText(/平台回答原文：123\.450000 件/))
  const source = container.querySelector('[class*="interactionSummary"]')
  const tabs = screen.getByRole('tablist')
  assert.ok(source && source.compareDocumentPosition(tabs) & Node.DOCUMENT_POSITION_FOLLOWING)
  assert.equal(calls.some(call=>call.kind==='generate'||call.kind==='analyze'),false)
})

test('retry attempts remain independently selectable and preserve failed input/output/error facts',async () => {
  const {container} = setup(); await ready()
  const inspector = screen.getByRole('complementary',{name:'本轮业务调用'})
  assert.match(inspector.textContent??'',/平台原始错误：保持原文/)
  const cards = Array.from(container.querySelectorAll('button[class*="timelineBusinessCard"]'))
  assert.equal(cards.length,3)
  fireEvent.click(cards[1]!)
  await waitFor(()=>assert.match(inspector.textContent??'',/123\.450000/))
  assert.doesNotMatch(inspector.textContent??'',/平台原始错误：保持原文/)
  fireEvent.click(cards[0]!)
  await waitFor(()=>assert.match(inspector.textContent??'',/平台原始错误：保持原文/))
  fireEvent.click(screen.getByRole('button',{name:'成功 2'}))
  assert.equal(container.querySelectorAll('button[class*="timelineBusinessCard"]').length,2)
  fireEvent.click(screen.getByRole('button',{name:'失败 1'}))
  assert.equal(container.querySelectorAll('button[class*="timelineBusinessCard"]').length,1)
})

test('Markdown copy and download use the exact platform content, while refresh makes no generation or analysis request',async () => {
  const {calls,copied,downloads} = setup();await ready()
  const copy = await screen.findByRole('button',{name:'复制 Markdown'})
  await waitFor(()=>assert.equal((copy as HTMLButtonElement).disabled,false))
  fireEvent.click(copy)
  await waitFor(()=>assert.deepEqual(copied,[fixture.markdown[anchor]]))
  fireEvent.click(screen.getByRole('button',{name:'下载 Markdown'}))
  await waitFor(()=>assert.deepEqual(downloads,[{id:anchor,markdown:fixture.markdown[anchor]}]))
  const before = calls.filter(call=>call.kind==='detail').length
  fireEvent.click(screen.getByRole('button',{name:/刷新/}))
  await waitFor(()=>assert.ok(calls.filter(call=>call.kind==='detail').length>before))
  await ready()
  assert.equal(calls.some(call=>call.kind==='generate'||call.kind==='analyze'),false)
  assert.ok(calls.filter(call=>call.kind==='detail').every(call=>call.interactionId===anchor))
})

test('search or an absent list anchor never changes the clicked answer to the first or latest round',async () => {
  const {calls} = setup({missingAnchor:true,partial:true});await ready()
  assert.ok(screen.getByText('当前轮次列表不完整；保留当前交互，不自动切换。'))
  assert.equal(calls.some(call=>call.kind==='rounds' && (call.page??1)>1),false)
  const search = screen.getByRole('textbox',{name:''})
  fireEvent.change(search,{target:{value:'原始问题第73轮'}})
  await waitFor(()=>assert.ok(calls.some(call=>call.kind==='rounds' && call.keyword==='原始问题第73轮')))
  await ready()
  assert.ok(calls.filter(call=>call.kind==='detail').every(call=>call.interactionId===anchor))
  assert.ok(screen.getByText(/平台回答原文：123\.450000 件/))
})


test('managed function time rail keeps parent and failed internal calls with recorded payloads',async () => {
  const {calls,container} = setup({initialId:'int-parity-068'})
  await screen.findByRole('heading',{name:'确定性时间链'})
  assert.equal(container.querySelectorAll('button[class*="timelineBusinessCard"]').length,0)
  const inspector=screen.getByRole('complementary',{name:'调用检查器'})
  assert.match(inspector.textContent??'',/op-managed-root/)
  const expand=screen.getByRole('button',{name:'展开内部执行（1）'})
  fireEvent.click(expand)
  const internal=screen.getByRole('button',{name:/query_object_instance/})
  fireEvent.click(internal)
  await waitFor(()=>assert.match(inspector.textContent??'',/op-managed-inner/))
  assert.match(inspector.textContent??'',/平台原始错误：保持原文/)
  assert.equal(calls.some(call=>call.kind==='generate'||call.kind==='analyze'),false)
})

test('saved evidence supports reading and graph modes without auto-generating or changing raw invalid attribution',async () => {
  const {calls,container}=setup();await ready()
  fireEvent.click(screen.getByRole('tab',{name:'证据链'}))
  await screen.findByRole('heading',{name:'平台函数原文'})
  assert.ok(screen.getByText('platform-invalid-preserve'))
  assert.ok(screen.getByText('platform-edge-invalid-preserve'))
  assert.ok(screen.getAllByText('invalid').length>=2)
  assert.ok(screen.getByRole('button',{name:'阅读模式'}))
  fireEvent.click(screen.getByRole('button',{name:'图谱模式'}))
  await screen.findByRole('heading',{name:'从结论展开证据、本体与真实执行'})
  assert.ok(screen.getByRole('button',{name:'业务语义'}))
  assert.ok(screen.getByRole('button',{name:'本体结构层'}))
  fireEvent.click(screen.getByRole('button',{name:'技术执行层'}))
  assert.ok(container.querySelector('svg'))
  assert.equal(calls.some(call=>call.kind==='generate'||call.kind==='analyze'),false)
  const read=await createPlatformProvenanceAdapter(async()=>fixture.explanations[anchor],{async copyText(){},downloadMarkdown(){}}).readExplanation(anchor)
  assert.equal(read.view?.selectedPairGraphs?.pair1?.businessFunctions[0]?.validationStatus,'invalid')
  assert.equal(read.view?.selectedPairGraphs?.pair1?.businessFunctions[0]?.reasonCode,'platform-invalid-preserve')
  assert.equal(read.view?.selectedPairGraphs?.pair1?.edges[0]?.validationStatus,'invalid')
  assert.equal(read.view?.selectedPairGraphs?.pair1?.edges[0]?.reasonCode,'platform-edge-invalid-preserve')
})

test('an ungenerated explanation preserves timeline facts and generates only after explicit action',async () => {
  const {calls}=setup({notGenerated:true});await ready()
  assert.equal(calls.some(call=>call.kind==='generate'),false)
  fireEvent.click(screen.getByRole('tab',{name:'证据链'}))
  await screen.findByText('尚未生成解释，点击“查看证据链”整理已记录依据。')
  assert.equal(calls.some(call=>call.kind==='generate'),false)
  fireEvent.click(screen.getByRole('button',{name:'查看证据链'}))
  await screen.findByRole('heading',{name:'平台函数原文'})
  assert.deepEqual(calls.filter(call=>call.kind==='generate').map(call=>call.interactionId),[anchor])
  fireEvent.click(screen.getByRole('tab',{name:'时间链'}));await ready()
})

test('opening the analysis panel does not run an Agent; explicit start uses platform Markdown and displays its result',async () => {
  const {calls}=setup({emptyHistory:true});await ready()
  await waitFor(()=>assert.equal((screen.getByRole('button',{name:'交给 BKN Agent 分析'}) as HTMLButtonElement).disabled,false))
  fireEvent.click(screen.getByRole('button',{name:'交给 BKN Agent 分析'}))
  await screen.findByRole('button',{name:'开始分析'})
  assert.equal(calls.some(call=>call.kind==='analyze'),false)
  fireEvent.click(screen.getByRole('button',{name:'开始分析'}))
  await screen.findByText('平台分析结论原文')
  const sent=calls.filter(call=>call.kind==='analyze')
  assert.equal(sent.length,1)
  assert.equal(sent[0]?.interactionId,anchor)
  assert.equal(sent[0]?.markdown,fixture.markdown[anchor])
})


test('the real overlay cancels closed reads, ignores late results, and reopens at the new trusted message and language',async () => {
  const {ProvenanceOverlay,ProvenanceOverlayController}=await import('../src/client/ProvenanceOverlay.tsx')
  const {adapter,calls}=setup({skipRender:true})
  const controller=new ProvenanceOverlayController()
  const handle=(interactionId:string)=>({schemaVersion:2 as const,conversationId:fixture.identity.conversationId,interactionId,status:'completed' as const,requestIds:[],traceIds:[],receiptIds:[],partial:false})
  let oldResolve!:(value:unknown)=>void
  const oldRead=new Promise(resolve=>oldResolve=resolve)
  let firstSignal:AbortSignal|undefined
  let adapters=0,legacyReads=0,language='zh'
  const createAdapter=()=>{
    if(++adapters!==1)return adapter
    return {...adapter,readConversation:async(signal?:AbortSignal)=>{firstSignal=signal;return await oldRead as never}}
  }
  const props={
    useProvenanceOverlay:(select:(state:ReturnType<typeof controller.getSnapshot>)=>unknown)=>select(useSyncExternalStore(controller.subscribe,controller.getSnapshot)),
    load:async()=>{legacyReads++;return undefined},createDetailAdapter:createAdapter,language:()=>language,close:()=>controller.close(),
  }
  const opener=document.createElement('button');opener.textContent='open';document.body.append(opener);opener.focus()
  controller.open('session-fixture','message-old',handle(anchor))
  render(createElement(ProvenanceOverlay,props as never))
   await screen.findByRole('dialog');
  await waitFor(()=>assert.ok(firstSignal))
  fireEvent.keyDown(screen.getByRole('dialog'),{key:'Escape'})
  await waitFor(()=>assert.ok(screen.queryByRole('dialog')===null))
  assert.equal(firstSignal?.aborted,true)
  assert.ok(document.activeElement===opener)
  language='en'
  act(()=>controller.open('session-fixture','message-new',handle('int-parity-068')))
  await screen.findByRole('tab',{name:'Timeline'});
  oldResolve({conversationId:'conv-OLD-STALE-SENTINEL',agentName:'STALE'})
  await waitFor(()=>assert.ok(screen.queryByText(/OLD-STALE-SENTINEL/)===null))
  assert.ok(calls.filter(call=>call.kind==='detail').every(call=>call.interactionId==='int-parity-068'))
  assert.equal(legacyReads,0)
  assert.equal(calls.some(call=>call.kind==='generate'||call.kind==='analyze'),false)
  act(()=>controller.close())
  await waitFor(()=>assert.ok(screen.queryByRole('dialog')===null))
  language='zh'
  act(()=>controller.open('session-fixture','message-old-reopen',handle(anchor)))
  await ready()
  assert.ok(screen.queryByRole('tab',{name:'Timeline'})===null)
  assert.ok(screen.getByText(/平台回答原文：123\.450000 件/))
  assert.equal(legacyReads,0)
})


test('leaving an evidence view cancels its explicit pending generation and ignores its late result in the next round',async()=>{
  let resolve!:(value:unknown)=>void
  const pending=new Promise(value=>resolve=value)
  const first=setup({notGenerated:true,generateDeferred:pending});await ready()
  fireEvent.click(screen.getByRole('tab',{name:'证据链'}))
  await screen.findByText('尚未生成解释，点击“查看证据链”整理已记录依据。')
  fireEvent.click(screen.getByRole('button',{name:'查看证据链'}))
  const generation=first.signals.find(request=>request.kind==='generate')
  assert.ok(generation?.signal)
  first.unmount!()
  assert.equal(generation.signal.aborted,true)
  setup({initialId:'int-parity-068'})
  await screen.findByRole('heading',{name:'确定性时间链'})
  await act(async()=>resolve(fixture.explanations[anchor]))
  assert.ok(screen.queryByRole('heading',{name:'平台函数原文'})===null)
  assert.ok(screen.queryByText('platform-invalid-preserve')===null)
})


test('an explicit platform analysis failure retains its returned reason and does not retry by itself',async()=>{
  const {calls}=setup({emptyHistory:true,analysisFails:true});await ready()
  await waitFor(()=>assert.equal((screen.getByRole('button',{name:'交给 BKN Agent 分析'}) as HTMLButtonElement).disabled,false))
  fireEvent.click(screen.getByRole('button',{name:'交给 BKN Agent 分析'}))
  fireEvent.click(await screen.findByRole('button',{name:'开始分析'}))
  await screen.findByText('平台分析失败原文')
  assert.equal(calls.filter(call=>call.kind==='analyze').length,1)
  assert.ok(screen.getByRole('button',{name:'返回事实输入'}))
})


test('shared-input highlighting follows only platform-persisted edges while equal values never invent a relationship',async()=>{
  const explanation=JSON.parse(await readFile(new URL('./fixtures/provenance-parity/shared-input-explanation.json',import.meta.url),'utf8'))
  const {container}=setup({explanationOverride:explanation});await ready()
  fireEvent.click(screen.getByRole('tab',{name:'证据链'}))
  fireEvent.click(await screen.findByRole('button',{name:'图谱模式'}))
  fireEvent.click(screen.getByRole('button',{name:'支持证据：共享业务输入'}))
  const inspector=screen.getByRole('complementary',{name:'节点详情'})
  assert.match(inspector.textContent??'',/库存查询原文/)
  assert.match(inspector.textContent??'',/销售订单查询原文/)
  // The baseline platform highlights an undirected persisted connected component.
  fireEvent.click(screen.getByRole('button',{name:'业务函数：库存查询原文'}))
  assert.match(inspector.textContent??'',/销售订单查询原文/)
  fireEvent.click(screen.getByRole('button',{name:'支持证据：相同值无平台边'}))
  assert.match(inspector.textContent??'',/e-unrelated/)
  assert.doesNotMatch(inspector.textContent??'',/库存查询原文|销售订单查询原文|关联证明路径/)
  // Only one claim is visible; five of the six server-recorded edges have visible endpoints.
  assert.equal(container.querySelectorAll('svg[class*="graphEdges"] > path').length,5)
})

test('Escape in a legacy graph Inspector closes that Inspector and keeps the real DSH overlay open',async()=>{
  const explanation=JSON.parse(await readFile(new URL('./fixtures/provenance-parity/legacy-graph-explanation.json',import.meta.url),'utf8'))
  const {adapter}=setup({skipRender:true,explanationOverride:explanation})
  const {ProvenanceOverlay,ProvenanceOverlayController}=await import('../src/client/ProvenanceOverlay.tsx')
  const controller=new ProvenanceOverlayController()
  controller.open('session-fixture','message-nested',{schemaVersion:2,conversationId:fixture.identity.conversationId,interactionId:anchor,status:'completed',requestIds:[],traceIds:[],receiptIds:[],partial:false})
  const props={useProvenanceOverlay:(select:(state:ReturnType<typeof controller.getSnapshot>)=>unknown)=>select(useSyncExternalStore(controller.subscribe,controller.getSnapshot)),load:async()=>{throw new Error('legacy viewer must not load')},createDetailAdapter:()=>adapter,close:()=>controller.close()}
  render(createElement(ProvenanceOverlay,props as never));await ready()
  const outer=screen.getByRole('dialog')
  fireEvent.click(screen.getByRole('tab',{name:'证据链'}))
  const zoom=await screen.findByRole('button',{name:'放大图谱'})
  const tools=screen.getByRole('group',{name:'图谱视图控制'})
  fireEvent.click(zoom);assert.match(tools.textContent??'',/110%/)
  fireEvent.click(within(tools).getByRole('button',{name:'重置视图'}));assert.match(tools.textContent??'',/100%/)
  fireEvent.click(within(tools).getByRole('button',{name:'适应画布'}))
  const node=screen.getByRole('button',{name:/平台共享输入/})
  node.focus();fireEvent.click(node)
  const dialogs=screen.getAllByRole('dialog')
  assert.equal(dialogs.length,2)
  const inspector=dialogs.find(dialog=>dialog!==outer)!
  assert.ok(document.activeElement===inspector)
  fireEvent.keyDown(inspector,{key:'Escape'})
  await waitFor(()=>assert.equal(screen.getAllByRole('dialog').length,1))
  assert.ok(controller.getSnapshot().handle)
  assert.ok(document.activeElement===node)
  fireEvent.keyDown(outer,{key:'Escape'})
  await waitFor(()=>assert.ok(screen.queryByRole('dialog')===null))
})
