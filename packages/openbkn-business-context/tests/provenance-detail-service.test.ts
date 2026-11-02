import assert from 'node:assert/strict'
import test from 'node:test'
import { OpenBknBusinessContextService } from '../src/business-context-service.ts'
import { Config } from '../src/config.ts'
import { OpenBknPlatformReader, PlatformReaderError } from '../src/platform-reader.ts'
import type { ProvenanceDetailEvent, ProvenanceDetailRequest } from '../src/provenance-detail-types.ts'

function fixture() {
  let binding = { platformBaseUrl:'https://platform.invalid',knowledgeNetworkId:'kn1',displayName:'Network' }
  let handle = {schemaVersion:2,interactionId:'int1',conversationId:'conv1',requestIds:[],traceIds:[],receiptIds:[],status:'completed',partial:true,turn:1}
  const events = () => [{type:'openbkn/turn-provenance',data:{messageId:'m1',handle}},{type:'user/message',time:1000,data:{turn:1,message:{id:'u1',role:'user',content:[{type:'text',text:'Q'}]}}},{type:'assistant/message',time:1100,data:{turn:1,message:{id:'m1',role:'assistant',content:[{type:'text',text:'A'}]}}}]
  const agent = {id:'s1',session:{id:'s1',header:{cwd:'/workspace'},snapshotEvents:events}}
  let live = true, calls = 0
  const reader = {
    async readProvenanceDetailData(_request: ProvenanceDetailRequest,_conversation: string,id: string) { calls++; return {interaction_id:id,operations:[{operation_id:'op1',knowledge_network_id:'kn1',status:'invalid',error:{reason:'platform-original'}}]} },
    async *streamProvenanceDetailAnalysis() {},
  }
  const service = Object.create(OpenBknBusinessContextService.prototype) as OpenBknBusinessContextService
  Object.assign(service,{config:Config({baseUrl:binding.platformBaseUrl}),ctx:{agents:{get:(id:string)=>live&&id==='s1'?agent:undefined}},bindingRecords:{read:()=>({binding:{...binding}})},platformReader:()=>reader})
  const run = async (request: ProvenanceDetailRequest = {kind:'detail'}, signal = AbortSignal.timeout(2000)) => { const result: ProvenanceDetailEvent[] = []; for await (const event of service.provenanceDetailStream('s1' as never,'m1',request,signal)) result.push(event); return result }
  return {service,reader,run,calls:()=>calls,setBinding:(patch: Partial<typeof binding>)=>{binding={...binding,...patch}},setHandle:(patch: Partial<typeof handle>)=>{handle={...handle,...patch}},detach:()=>{live=false}}
}

test('new native Remote uses one trusted message identity and preserves original platform invalid state', async () => {
  const f = fixture(), events = await f.run()
  assert.deepEqual(events[0],{kind:'context',conversationId:'conv1',initialInteractionId:'int1',interactionId:'int1',knowledgeNetworkId:'kn1'})
  assert.equal(events.at(-1)?.kind,'result')
  assert.match(JSON.stringify(events),/platform-original/)
  assert.equal(f.calls(),1)
})

test('another platform or an absent live session is denied before the reader is used', async () => {
  const f=fixture(); f.setBinding({platformBaseUrl:'https://other.invalid'})
  assert.deepEqual(await f.run(),[{kind:'failure',code:'PLATFORM_MISMATCH'}]); assert.equal(f.calls(),0)
  f.detach(); assert.deepEqual(await f.run(),[{kind:'failure',code:'SESSION_UNAVAILABLE'}]); assert.equal(f.calls(),0)
})

for (const boundary of ['binding','handle','agent','revision'] as const) test(`a ${boundary} change while detail is pending cannot emit the old platform result`, async () => {
  const f=fixture()
  f.reader.readProvenanceDetailData=async (_request,_conversation,id) => {
    if (boundary==='binding') f.setBinding({knowledgeNetworkId:'kn2'})
    if (boundary==='handle') f.setHandle({conversationId:'conv2'})
    if (boundary==='agent') f.detach()
    if (boundary==='revision') Object.assign(f.service,{provenanceRevision:1})
    return {interaction_id:id,operations:[]}
  }
  const events=await f.run()
  assert.deepEqual(events.at(-1),{kind:'failure',code:'IDENTITY_CHANGED'})
  assert.ok(!events.some(event=>event.kind==='result'||event.kind==='chunk'))
})

test('Host failures have safe fixed classifications and never expose arbitrary exception text or causes', async () => {
  const f=fixture()
  f.reader.readProvenanceDetailData=async ()=>{throw new Error('secret token https://internal.invalid')}
  assert.deepEqual((await f.run()).at(-1),{kind:'failure',code:'PLATFORM_UNAVAILABLE'})
  f.reader.readProvenanceDetailData=async ()=>{throw new PlatformReaderError('ACCESS_DENIED','secret platform body',{httpStatus:403,cause:new Error('private-token')})}
  assert.deepEqual((await f.run()).at(-1),{kind:'failure',code:'ACCESS_DENIED',httpStatus:403})
})

test('already aborted streams never reach the platform', async () => {
  const f=fixture(), abort=new AbortController(); abort.abort(new Error('private-token'))
  assert.deepEqual(await f.run({kind:'detail'},abort.signal),[{kind:'failure',code:'REQUEST_ABORTED'}])
  assert.equal(f.calls(),0)
})

for (const kind of ['generate','analyze'] as const) test(`the composed Host scope blocks ${kind} POST when identity changes during its credential lookup`, async () => {
  const f=fixture()
  let entered!:()=>void, release!:()=>void
  const lookupEntered=new Promise<void>(resolve=>{entered=resolve}), waiting=new Promise<void>(resolve=>{release=resolve})
  let lookups=0, posts=0
  const reader=new OpenBknPlatformReader({baseUrl:'https://platform.invalid',requestTimeoutMs:1000,maxResultBytes:1024,allowInsecureTls:false,resolveToken:async()=>{
    if(++lookups===(kind==='generate'?2:3)){entered();await waiting}
    return 'private-token'
  }},async(url,init)=>{
    if(init.method==='POST')posts++
    return url.pathname.endsWith('/markdown')?new Response('# 平台原文'):new Response(JSON.stringify({interaction_id:'int1',operations:[{knowledge_network_id:'kn1'}]}),{headers:{'content-type':'application/json'}})
  })
  Object.assign(f.service,{platformReader:()=>reader})
  const pending=f.run({kind})
  await lookupEntered; f.setBinding({knowledgeNetworkId:'kn2'}); release()
  assert.deepEqual((await pending).at(-1),{kind:'failure',code:'IDENTITY_CHANGED'})
  assert.equal(posts,0)
})

test('disposing the Host lifetime cancels a pending read and prevents stale results', async () => {
  const f=fixture(), lifetime=new AbortController()
  let release!:()=>void, entered!:()=>void
  const started=new Promise<void>(resolve=>{entered=resolve}), waiting=new Promise<void>(resolve=>{release=resolve})
  Object.assign(f.service,{lifetime})
  f.reader.readProvenanceDetailData=async(_request,_conversation,id)=>{entered();await waiting;return {interaction_id:id,operations:[]}}
  const pending=f.run();await started;lifetime.abort();release()
  const events=await pending
  assert.deepEqual(events.at(-1),{kind:'failure',code:'REQUEST_ABORTED'})
  assert.ok(!events.some(event=>event.kind==='result'))
})

test('two concurrent Remote reads have independent cancellation and cannot consume each other results', async () => {
  const f=fixture(), first=new AbortController(), second=new AbortController()
  let ready!:()=>void, release!:()=>void, started=0
  const bothStarted=new Promise<void>(resolve=>{ready=resolve}), waiting=new Promise<void>(resolve=>{release=resolve})
  Object.assign(f.reader,{async readProvenanceDetailData(_request:unknown,_conversation:string,id:string,signal:AbortSignal){
    if(++started===2)ready()
    await waiting
    signal.throwIfAborted()
    return {interaction_id:id,operations:[]}
  }})
  const a=f.run({kind:'detail'},first.signal), b=f.run({kind:'detail'},second.signal)
  await bothStarted;first.abort();release()
  const [cancelled, completed]=await Promise.all([a,b])
  assert.deepEqual(cancelled.at(-1),{kind:'failure',code:'REQUEST_ABORTED'})
  assert.equal(completed.at(-1)?.kind,'result')
  assert.equal(second.signal.aborted,false)
})
