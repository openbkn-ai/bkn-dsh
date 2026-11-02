import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import { readFile } from 'node:fs/promises'
import { createElement } from 'react'
import { JSDOM } from 'jsdom'
import type { JsonValue } from '@deepseek-ai/dsh-util-values'
import type { ProvenanceDetailRequest } from '../../provenance-detail-types.js'

const dom=new JSDOM('<!doctype html><html><body></body></html>',{url:'http://localhost/'})
for(const key of ['window','document','navigator','HTMLElement','Element','Node','ShadowRoot','SVGElement','MutationObserver','HTMLInputElement','HTMLTextAreaElement'] as const)Object.defineProperty(globalThis,key,{value:dom.window[key],configurable:true,writable:true})
Object.defineProperty(globalThis,'getComputedStyle',{value:dom.window.getComputedStyle.bind(dom.window),configurable:true})
dom.window.matchMedia=()=>({matches:false,media:'',onchange:null,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){},dispatchEvent(){return true}})
class ResizeObserverStub{observe(){}unobserve(){}disconnect(){}}
Object.defineProperty(globalThis,'ResizeObserver',{value:ResizeObserverStub,configurable:true})
Object.defineProperty(globalThis,'requestAnimationFrame',{value:(callback:FrameRequestCallback)=>setTimeout(()=>callback(Date.now()),0),configurable:true})
Object.defineProperty(globalThis,'cancelAnimationFrame',{value:clearTimeout,configurable:true})
dom.window.HTMLElement.prototype.scrollIntoView=()=>{}
const {render,screen,fireEvent,waitFor,cleanup,act}=await import('@testing-library/react')
const {PlatformProvenanceDetail,createPlatformProvenanceAdapter}=await import('./index.js')
const fixture=JSON.parse(await readFile(new URL('../../../tests/fixtures/provenance-parity/conversation.json',import.meta.url),'utf8'))
const anchor=fixture.identity.initialInteractionId as string
function deferred<T>(){let resolve!:(value:T)=>void;const promise=new Promise<T>(finish=>{resolve=finish});return {promise,resolve}}
afterEach(()=>cleanup())
function setup(){
  const calls:ProvenanceDetailRequest[]=[]
  const signals:{kind:string;signal?:AbortSignal}[]=[]
  const list=deferred<JsonValue>(),generate=deferred<JsonValue>(),analysis=deferred<void>()
  const rows={entries:[fixture.rounds.find((row:{interaction_id:string})=>row.interaction_id===anchor)],total:73,page:1,page_size:50}
  const adapter=createPlatformProvenanceAdapter(async(request,signal,onAnalysis):Promise<JsonValue>=>{
    calls.push({...request});signals.push({kind:request.kind,signal})
    switch(request.kind){
      case 'conversation':return {entries:[fixture.conversation],total:1}
      case 'rounds':return request.keyword || request.page===2?await list.promise:structuredClone(rows)
      case 'detail':return structuredClone(fixture.details[anchor])
      case 'explanation':return {schema_version:'1',interaction_id:anchor,status:'not_generated'}
      case 'generate':return await generate.promise
      case 'markdown':return fixture.markdown[anchor]
      case 'history':return {entries:[]}
      case 'analyze':await analysis.promise;onAnalysis?.({event:'structured',data:{content:{conclusion:'平台分析完成原文'}}});return null
    }
  },{async copyText(){},downloadMarkdown(){}})
  const rendered=render(createElement(PlatformProvenanceDetail,{conversation:{conversationId:fixture.conversation.conversation_id,agentName:'测试 Agent',interactionCount:73},initialInteractionId:anchor,adapter,language:'zh'}))
  return {...rendered,calls,signals,list,generate,analysis,rows}
}
async function ready(){await screen.findByRole('heading',{name:'本轮业务执行过程'});await act(async()=>{})}

test('same-interaction search metadata preserves the mounted evidence view and in-flight generation',async()=>{
  const state=setup();await ready()
  fireEvent.click(screen.getByRole('tab',{name:'证据链'}))
  fireEvent.click(await screen.findByRole('button',{name:'查看证据链'}))
  await waitFor(()=>assert.equal(state.calls.filter(call=>call.kind==='generate').length,1))
  const signal=state.signals.find(value=>value.kind==='generate')?.signal
  const reads=state.calls.filter(call=>call.kind==='detail').length
  fireEvent.change(screen.getByPlaceholderText('搜索问题或业务对象'),{target:{value:'同一轮'}})
  await waitFor(()=>assert.ok(state.calls.some(call=>call.kind==='rounds' && call.keyword==='同一轮')))
  const tabsPersisted=screen.queryByRole('tab',{name:'证据链'})!==null
  await act(async()=>state.list.resolve({...state.rows,entries:[{...state.rows.entries[0],question_preview:'同一Interaction的新列表摘要'}]}))
  await waitFor(()=>assert.ok(screen.queryByRole('tab',{name:'证据链'})))
  assert.equal(tabsPersisted,true,'list loading must not unmount the active detail view')
  assert.equal(state.calls.filter(call=>call.kind==='detail').length,reads,'same interaction metadata must not reload facts')
  assert.equal(signal?.aborted,false,'same interaction metadata must not cancel explicit generation')
  await act(async()=>state.generate.resolve(structuredClone(fixture.explanations[anchor])))
  await screen.findByRole('heading',{name:'平台函数原文'})
})

test('same-interaction pagination preserves in-flight analysis; only explicit refresh reloads facts',async()=>{
  const state=setup();await ready()
  const action=screen.getByRole('button',{name:'交给 BKN Agent 分析'}) as HTMLButtonElement
  await waitFor(()=>assert.equal(action.disabled,false))
  fireEvent.click(action);fireEvent.click(await screen.findByRole('button',{name:'开始分析'}))
  await waitFor(()=>assert.equal(state.calls.filter(call=>call.kind==='analyze').length,1))
  const signal=state.signals.find(value=>value.kind==='analyze')?.signal
  const reads=state.calls.filter(call=>call.kind==='detail').length
  const next=state.container.querySelector('.ant-pagination-next button')
  assert.ok(next);fireEvent.click(next)
  await waitFor(()=>assert.ok(state.calls.some(call=>call.kind==='rounds' && call.page===2)))
  await act(async()=>state.list.resolve({...state.rows,page:2}))
  await screen.findByRole('tab',{name:'时间链'})
  assert.equal(state.calls.filter(call=>call.kind==='detail').length,reads,'pagination must not reload the selected facts')
  assert.equal(signal?.aborted,false,'pagination must not cancel explicit analysis')
  await act(async()=>state.analysis.resolve())
  await screen.findByText('平台分析完成原文')
  fireEvent.click(screen.getByRole('button',{name:/刷新/}))
  await waitFor(()=>assert.equal(state.calls.filter(call=>call.kind==='detail').length,reads+1))
  assert.equal(state.calls.filter(call=>call.kind==='analyze').length,1)
})
