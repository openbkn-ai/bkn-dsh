import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { act, create } from 'react-test-renderer'
import { localized } from '../src/client/locale.tsx'
import { translateMessage } from '../src/client/messages.ts'
import { ProvenanceOverlay, ProvenanceOverlayController } from '../src/client/ProvenanceOverlay.tsx'
import { OpenBknDiagnostics } from '../src/client/OpenBknDiagnostics.tsx'
import { OpenBknOverlay } from '../src/client/OpenBknOverlay.tsx'
import type { LocaleRuntime } from '@deepseek-ai/dsh-client-locale/client'

function language() {
  let snapshot = { active: 'zh', revision: 0, locales: [] }; const listeners = new Set<() => void>()
  const locale = { getSnapshot: () => snapshot, subscribe: (f: () => void) => { listeners.add(f); return () => listeners.delete(f) }, bind: () => (key: Parameters<typeof translateMessage>[1], params?: Record<string,unknown>) => translateMessage(snapshot.active,key,params) } as unknown as LocaleRuntime
  return { locale, set(active: string) { snapshot = { ...snapshot, active, revision: snapshot.revision+1 }; for (const f of listeners) f() } }
}
function text(value: any): string { if(value == null) return ''; if(typeof value === 'string') return value; if(Array.isArray(value)) return value.map(text).join(''); return text(value.children) }
const report = { schemaVersion: 1, reportId: 'fixture-report', createdAt: '2026-10-24T00:00:00Z', mode: 'passive', target: { hostForm: 'unknown',platform: 'win32',dshVersion:null,pluginDiskVersion:null,pluginLoadedVersion:null }, checks: [{id:'observed:cli',stage:'cli',status:'pass',source:'observed-operation',code:'cli',evidence:{lastOutcomeAgoMs:3600000},nextAction:null}], coverage: {executedChecks:1,notRunChecks:0,insufficientEvidenceChecks:0,notes:[]} }

test('historical reference labels switch zh/en/zh without rereading or changing platform facts', async () => {
  globalThis.window = { addEventListener() {}, removeEventListener() {} } as unknown as Window & typeof globalThis
  const controller = new ProvenanceOverlayController(); controller.open('fixture-session','fixture-message',{interactionId:'fixture-interaction',status:'completed'} as never)
  const view = { timeline:[{seq:1,kind:'tool',at:'2026-10-24T00:00:00Z',tool:'fixture_tool',outcome:'error',platform:{operationId:'fixture-operation',receiptId:'fixture-receipt',status:'completed'}}], sources:{timeline:'local-session',operations:'platform',business:'unavailable',evidence:'unavailable',degraded:[]}, execution:{operations:[{id:'fixture-operation',label:'原始平台名称',status:'completed',requestId:'fixture-request',traceId:'fixture-trace',receiptId:'fixture-receipt'}]},business:{kind:'unavailable'},evidence:{kind:'unavailable',reason:'no-receipts'} }
  const before=JSON.stringify(view), lang=language(), Component=localized(ProvenanceOverlay,lang.locale);let reads=0,ui!:ReturnType<typeof create>
  const props={useProvenanceOverlay:(select:any)=>select(controller.getSnapshot()),load:async()=>{reads++;return view},close:()=>controller.close()}
  await act(async()=>{ui=create(createElement(Component,props as never));await new Promise(r=>setImmediate(r))})
  try { for(const active of ['zh','en','zh']) { act(()=>lang.set(active));const rendered=text(ui.toJSON());for(const label of active==='zh'?['请求','跟踪','回执','操作','状态']:['Request','Trace','Receipt','Op','Status']) assert.ok(rendered.includes(label),label);assert.ok(rendered.includes('原始平台名称'));assert.ok(rendered.includes('completed'));assert.ok(rendered.includes('fixture-operation')) } assert.equal(reads,1);assert.equal(JSON.stringify(view),before) } finally {act(()=>ui.unmount())}
})

test('passive diagnostics explains observation age without relabeling historical pass or changing JSON', () => {
  const before=JSON.stringify(report),lang=language(),Component=localized(OpenBknDiagnostics,lang.locale);let ui!:ReturnType<typeof create>
  act(()=>{ui=create(createElement(Component,{useDiagnostics:(s:any)=>s({open:true,phase:'ready',report}),close(){},refresh:async()=>{}} as never))})
  try {assert.match(text(ui.toJSON()),/历史观察/);assert.match(text(ui.toJSON()),/不会主动验证/);act(()=>lang.set('en'));assert.match(text(ui.toJSON()),/last observed operations/);assert.match(text(ui.toJSON()),/does not recheck/);assert.equal(JSON.stringify(report),before)} finally {act(()=>ui.unmount())}
})

test('brand captions and the sign-in action have normal-text contrast on their actual surfaces', () => {
  const luminance=(hex:string)=>hex.slice(1).match(/../g)!.map(c=>parseInt(c,16)/255).map(c=>c<=0.04045?c/12.92:((c+0.055)/1.055)**2.4).reduce((s,c,i)=>s+c*[0.2126,0.7152,0.0722][i],0)
  const contrast=(a:string,b:string)=>(Math.max(luminance(a),luminance(b))+0.05)/(Math.min(luminance(a),luminance(b))+0.05)
  for(const [Component,props] of [[OpenBknDiagnostics,{useDiagnostics:(s:any)=>s({open:true,phase:'ready',report}),close(){},refresh:async()=>{}}],[OpenBknOverlay,{useUi:(s:any)=>s({open:true,phase:'authentication-required',auth:{kind:'authentication-required',baseUrl:'https://fixture.invalid'},networks:[]}),close(){},refresh:async()=>{},beginLogin:async()=>{},cancelLogin(){},showSettings(){},saveConfiguration:async()=>{},cliSetup:{},openNetwork:async()=>{},openDiagnostics(){}}]] as const) {
    let ui!:ReturnType<typeof create>;act(()=>{ui=create(createElement(Component as any,props))})
    try {const brand=ui.root.findAll(node=>node.type==='div'&&node.children.length===1&&node.children[0]==='OPENBKN')[0]!;assert.ok(contrast(brand.props.style.color,'#ffffff')>=4.5,'brand caption contrast');for(const button of ui.root.findAllByType('button')) {const s=button.props.style;if(s?.background?.startsWith('#')&&s?.color==='#fff')assert.ok(contrast(s.background,'#ffffff')>=4.5,'button label contrast')} } finally {act(()=>ui.unmount())}
  }
})
