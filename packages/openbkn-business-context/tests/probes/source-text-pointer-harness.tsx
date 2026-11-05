import {createElement, useSyncExternalStore} from 'react'
import {createRoot} from 'react-dom/client'
import {ProvenanceOverlay, ProvenanceOverlayController} from '../../src/client/ProvenanceOverlay.tsx'
import {createPlatformProvenanceAdapter} from '../../src/client/platform-provenance/index.tsx'
import originalFixture from '../fixtures/provenance-parity/conversation.json'

// Controlled synthetic fixture: preserve the production scene, portal, AntD
// placement and native outer dialog; only the remote transport is substituted.
const fixture = structuredClone(originalFixture)
const interactionId = fixture.identity.initialInteractionId
const detail = fixture.details[interactionId as keyof typeof fixture.details]
detail.interaction_result = Array.from({length:20}, (_,index) =>
  `第 ${index + 1} 条静态浏览器样本：原平台内容仅用于测试原文弹层的长文本布局、焦点与 Escape，不执行业务查询。`).join('\n\n')
const calls: string[] = []
const adapter = createPlatformProvenanceAdapter(async request => {
  calls.push(request.kind)
  switch (request.kind) {
    case 'conversation': return {entries:[fixture.conversation],total:1}
    case 'rounds': return {entries:[fixture.rounds.find(row => row.interaction_id === interactionId)!],total:1,page:1,page_size:50}
    case 'detail': return structuredClone(detail)
    case 'markdown': return fixture.markdown[interactionId as keyof typeof fixture.markdown]
    case 'history': return {entries:[]}
    case 'explanation': return {schema_version:'1',interaction_id:interactionId,status:'not_generated'}
    default: throw new Error(`The pointer probe must never dispatch ${request.kind}`)
  }
}, {async copyText() {}, downloadMarkdown() {}})
const controller = new ProvenanceOverlayController()
function Harness() {
  const props = {
    useProvenanceOverlay:(select:(state:ReturnType<typeof controller.getSnapshot>) => unknown) =>
      select(useSyncExternalStore(controller.subscribe,controller.getSnapshot)),
    load:async () => { throw new Error('Legacy provenance must not load') },
    createDetailAdapter:() => adapter,
    close:() => controller.close(),
  }
  return <><button id="open-provenance" onClick={event => controller.open('pointer-session','pointer-message',{
    schemaVersion:2,conversationId:fixture.identity.conversationId,interactionId,status:'completed',
    requestIds:[],traceIds:[],receiptIds:[],partial:false,
  },event.currentTarget)}>Open controlled provenance</button>{createElement(ProvenanceOverlay,props as never)}</>
}
Object.assign(window,{sourceTextPointerProbe:{calls}})
createRoot(document.getElementById('root')!).render(createElement(Harness))
