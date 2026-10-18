import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { createElement, useSyncExternalStore } from 'react'
import { act, create } from 'react-test-renderer'
import type { LocaleRuntime } from '@deepseek-ai/dsh-client-locale/client'
import { localized, useOpenBknTranslation } from '../src/client/locale.tsx'
import { en, zh, type OpenBknMessageKey } from '../src/client/locales.ts'
import { translateMessage, renderUiMessage } from '../src/client/messages.ts'
import { OpenBknUiController } from '../src/client/openbkn-ui-controller.ts'
import { NativeProvenancePanel } from '../src/client/NativeProvenancePanel.tsx'
import { projectNativeExplanation } from '../src/native-provenance.ts'
import { diagnosticAction } from '../src/client/diagnostics-copy.ts'
import type { ProvenanceView } from '../src/types.ts'

function localeHarness() {
  let snapshot = { active: 'zh', revision: 0, locales: [] }; const listeners = new Set<() => void>()
  const locale = {
    subscribe(listener: () => void) { listeners.add(listener);return () => {listeners.delete(listener)} },
    getSnapshot() { return snapshot },
    bind() {return (key: OpenBknMessageKey, params?: Record<string,unknown>) => translateMessage(snapshot.active,key,params)},
  } as unknown as LocaleRuntime
  return {locale, set(active: string) { snapshot = {...snapshot, active, revision:snapshot.revision+1};for(const listener of listeners) listener() }}
}
test('both dictionaries cover the same keys and interpolation contracts', () => {
  assert.deepEqual(Object.keys(en).sort(),Object.keys(zh).sort())
  for (const key of Object.keys(zh) as OpenBknMessageKey[]) {
    const params = (value: string) => [...value.matchAll(/\{(\w+)\}/g)].map(match => match[1]).sort()
    assert.deepEqual(params(zh[key]),params(en[key]),key)
    assert.ok(en[key].trim(), key)
  }
  assert.equal(translateMessage('en', '__unknown__' as OpenBknMessageKey),'Text unavailable')
})
test('an already displayed failure updates zh/en/zh without rereading credentials or reconnecting', async () => {
  let calls = 0
  const controller = new OpenBknUiController({
    status: async () => { calls++;throw Object.assign(new Error('private-cli-output'),{code:'openbkn/cli-unavailable'}) },
    beginLogin: async () => [], configureToken: async () => [], listNetworks: async () => [],
    bindNetworkWorkspace: async () => ({id:'n',displayName:'N'}), bindNetwork: async () => ({platformBaseUrl:'https://p.invalid',knowledgeNetworkId:'n',displayName:'N'}),
  },async () => 's')
  controller.open();await controller.refresh()
  const frozen = controller.getSnapshot(); const harness = localeHarness()
  function Failure() { const state = useSyncExternalStore(listener => controller.subscribe(listener),()=>controller.getSnapshot());const t = useOpenBknTranslation();return createElement('p',null,renderUiMessage(state.message,t)) }
  const Component = localized(Failure,harness.locale);let renderer!: ReturnType<typeof create>
  act(() => { renderer = create(createElement(Component)) }); assert.match(JSON.stringify(renderer.toJSON()),/当前 DSH/)
  act(() => harness.set('en'));assert.match(JSON.stringify(renderer.toJSON()),/This DSH Host cannot use OpenBKN CLI/)
  act(() => harness.set('zh'));assert.match(JSON.stringify(renderer.toJSON()),/当前 DSH/)
  assert.equal(controller.getSnapshot(),frozen);assert.equal(calls,1);assert.doesNotMatch(JSON.stringify(renderer.toJSON()),/private-cli-output/)
  act(() => renderer.unmount())
})
test('native evidence selection survives language changes and never links equal-valued unrelated nodes', () => {
  const raw = JSON.parse(readFileSync(new URL('./fixtures/native-provenance-schema1.json',import.meta.url),'utf8'))
  const explanation = projectNativeExplanation(raw,'int-fixture')
  const view: ProvenanceView = {interactionId:'int-fixture',native:{detail:{kind:'unavailable',reason:'unavailable'},explanation},timeline:[],sources:{timeline:'local-session',operations:'unavailable',business:'unavailable',evidence:'unavailable',degraded:[]},execution:{operations:[]},business:{kind:'unavailable'},evidence:{kind:'unavailable',reason:'no-receipts'}}
  const harness = localeHarness();const Component = localized(NativeProvenancePanel,harness.locale);let renderer!: ReturnType<typeof create>
  act(() => { renderer = create(createElement(Component,{view,tab:'evidence'})) })
  const text = () => JSON.stringify(renderer.toJSON())
  assert.match(text(),/candidate/);assert.match(text(),/平台缺口原文/);assert.match(text(),/部分引用端点未披露/)
  const nodes = renderer.root.findAllByType('button'); const linked = nodes.find(node => node.findAllByType('strong').some(label => label.children.includes('来源原文')))!;const unrelated = nodes.find(node => node.findAllByType('strong').some(label => label.children.includes('同值非关联')))!
  assert.equal(linked.props.style.borderColor,'#087d72');assert.equal(unrelated.props.style.borderColor,'#dce4ec')
  act(() => unrelated.props.onClick());assert.equal(renderer.root.findAllByType('button').find(node => node.findAllByType('strong').some(label => label.children.includes('同值非关联')))!.props['aria-pressed'],true)
  act(() => harness.set('en'));assert.match(text(),/Business inputs/);assert.match(text(),/业务原文 Answer/);assert.match(text(),/平台缺口原文/)
  assert.equal(renderer.root.findAllByType('button').find(node => node.findAllByType('strong').some(label => label.children.includes('同值非关联')))!.props['aria-pressed'],true)
  act(() => renderer.unmount())
})
test('diagnostic next actions translate without mutating exported report facts or unknown text', () => {
  const original = 'Open OpenBKN settings, save the platform URL, then sign in with the OpenBKN CLI.'
  const t = (key:OpenBknMessageKey) => translateMessage('zh',key)
  assert.match(diagnosticAction(original,t),/保存平台地址/);assert.equal(diagnosticAction('external fact 原文',t),'external fact 原文');assert.equal(original,'Open OpenBKN settings, save the platform URL, then sign in with the OpenBKN CLI.')
})

test('the open login panel switches language while waiting and cancellation never dispatches a second login', async () => {
  const { OpenBknOverlay } = await import('../src/client/OpenBknOverlay.tsx')
  let resolve!: (value: readonly []) => void; let calls=0; let checked=0
  const pending = new Promise<readonly []>(accept=>{resolve=accept})
  const controller=new OpenBknUiController({status:async()=>{checked++;return {kind:'authenticated',baseUrl:'https://p.invalid'}},beginLogin:async()=>{calls++;return pending},configureToken:async()=>[],listNetworks:async()=>[],bindNetworkWorkspace:async()=>({id:'n',displayName:'N'}),bindNetwork:async()=>({platformBaseUrl:'https://p.invalid',knowledgeNetworkId:'n',displayName:'N'})},async()=> 's')
  controller.open();const login=controller.beginLogin();const harness=localeHarness();const Component=localized(OpenBknOverlay,harness.locale)
  let renderer!: ReturnType<typeof create>
  const props={useUi:(select: (state:ReturnType<typeof controller.getSnapshot>)=>unknown)=>select(useSyncExternalStore(listener=>controller.subscribe(listener),()=>controller.getSnapshot())),close:()=>controller.close(),refresh:()=>controller.refresh(),beginLogin:()=>controller.beginLogin(),cancelLogin:()=>controller.cancelLogin(),showSettings:()=>controller.showSettings(),saveConfiguration:async()=>{},cliSetup:{checkCli:async()=>({state:'ready' as const,canInstall:false}),installCli:async()=>({state:'ready' as const,canInstall:false})},openNetwork:async()=>{},openDiagnostics:()=>{}}
  act(()=>{renderer=create(createElement(Component,props as never))})
  assert.match(JSON.stringify(renderer.toJSON()),/正在等待 OpenBKN CLI/)
  act(()=>harness.set('en'));assert.match(JSON.stringify(renderer.toJSON()),/Waiting for OpenBKN CLI/)
  act(()=>renderer.root.findAllByType('button').find(button=>button.children.includes('Cancel sign-in'))!.props.onClick())
  assert.equal(controller.snapshot().login,'cancelled');assert.match(JSON.stringify(renderer.toJSON()),/Sign-in wait cancelled/)
  resolve([]);await login;assert.equal(calls,1);assert.equal(checked,0)
  act(()=>renderer.unmount())
})

test('closing provenance cancels its read and discards the late response', async () => {
  const {ProvenanceOverlay,ProvenanceOverlayController}=await import('../src/client/ProvenanceOverlay.tsx')
  const controller=new ProvenanceOverlayController();const handle={schemaVersion:2 as const,interactionId:'int-fixture',status:'completed' as const,requestIds:[],traceIds:[],receiptIds:[],partial:false}
  let requestSignal:AbortSignal|undefined;let resolve!: (value:undefined)=>void
  const pending=new Promise<undefined>(accept=>{resolve=accept});const previousWindow=Object.getOwnPropertyDescriptor(globalThis,'window')
  Object.defineProperty(globalThis,'window',{configurable:true,value:{addEventListener:()=>{},removeEventListener:()=>{}}})
  const harness=localeHarness();const Component=localized(ProvenanceOverlay,harness.locale);let renderer!:ReturnType<typeof create>
  try {
    controller.open('s1','m1',handle)
    act(()=>{renderer=create(createElement(Component,{useProvenanceOverlay:(select:(state:ReturnType<typeof controller.getSnapshot>)=>unknown)=>select(useSyncExternalStore(controller.subscribe,controller.getSnapshot)),load:async(_session:string,_message:string,signal?:AbortSignal)=>{requestSignal=signal;return pending},close:()=>controller.close()} as never))})
    act(()=>controller.close());assert.equal(requestSignal?.aborted,true)
    await act(async()=>{resolve(undefined);await pending})
    assert.equal(renderer.toJSON(),null)
    act(()=>renderer.unmount())
  } finally {if(previousWindow) Object.defineProperty(globalThis,'window',previousWindow);else Reflect.deleteProperty(globalThis,'window')}
})
