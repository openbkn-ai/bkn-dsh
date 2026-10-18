import assert from 'node:assert/strict'
import test from 'node:test'
import { OpenBknBusinessContextService } from '../src/business-context-service.ts'
import { Config } from '../src/config.ts'
import { PlatformReaderError } from '../src/platform-reader.ts'
const baseUrl='https://platform.invalid'
function serviceCase() {
  let binding = {platformBaseUrl:baseUrl,knowledgeNetworkId:'kn1',displayName:'业务名称'}
  const handle = {schemaVersion:2,interactionId:'int-fixture',requestIds:[],traceIds:[],receiptIds:[],status:'completed',partial:true,turn:1}
  const events = [{type:'openbkn/turn-provenance',data:{messageId:'m1',handle}},{type:'user/message',time:1000,data:{turn:1,message:{id:'u1',role:'user',content:[{type:'text',text:'Q'}]}}},{type:'assistant/message',time:1100,data:{turn:1,message:{id:'m1',role:'assistant',content:[{type:'text',text:'A'}]}}}]
  const agent={id:'s1',session:{id:'s1',header:{cwd:'/workspace'},snapshotEvents:()=>events}}
  const calls:string[]=[]
  const reader={
    getInteractionOperations:async () => ({entries:[]}),getInteractionBusinessGraph:async () => ({}),
    getNativeInteractionDetail:async (id:string) => { calls.push(id);return {interactionId:id,timeRail:[],knowledgeNetworkIds:['kn1']} },
    getNativeInteractionExplanation:async (id:string) => {calls.push(id);return {kind:'not-generated' as const}},
  }
  const service=Object.create(OpenBknBusinessContextService.prototype) as OpenBknBusinessContextService
  Object.assign(service,{config:Config({baseUrl}),ctx:{agents:{get:(id:string)=>id==='s1'?agent:undefined},logger:{warn:()=>{}}},bindingRecords:{read:()=>({binding:{...binding}})},platformReader:()=>reader})
  return {service,reader,calls,setBinding:()=>{binding={...binding,knowledgeNetworkId:'kn2'}}}
}
test('stable binding identity survives fresh record objects on each read',async () => {
  const {service,calls}=serviceCase()
  const view=await service.remoteGetTurnProvenanceView('s1' as never,'m1',AbortSignal.timeout(1000))
  assert.equal(view?.native?.explanation.kind,'not-generated');assert.deepEqual(calls,['int-fixture','int-fixture'])
})
test('native read failure preserves the independently readable detail and local timeline',async () => {
  const {service,reader}=serviceCase()
  reader.getNativeInteractionExplanation=async () => { throw new PlatformReaderError('ACCESS_DENIED','test refusal') }
  const view=await service.remoteGetTurnProvenanceView('s1' as never,'m1',AbortSignal.timeout(1000))
  assert.equal(view?.native?.detail.kind,'ready');assert.deepEqual(view?.native?.explanation,{kind:'unavailable',reason:'access-denied'});assert.ok(view!.timeline.length>0)
})
test('binding changes discard in-flight native replies',async () => {
  const {service,reader,setBinding}=serviceCase();let release!:()=>void
  reader.getNativeInteractionDetail=async id => {await new Promise<void>(resolve=>{release=resolve});return {interactionId:id,timeRail:[],knowledgeNetworkIds:['kn1']}}
  const pending=service.remoteGetTurnProvenanceView('s1' as never,'m1',AbortSignal.timeout(1000));await new Promise(resolve=>setImmediate(resolve));setBinding();release()
  await assert.rejects(pending,/identity changed/)
})
test('credential generation changes discard in-flight native replies',async () => {
  const {service,reader}=serviceCase();let release!:()=>void
  reader.getNativeInteractionDetail=async id => {await new Promise<void>(resolve=>{release=resolve});return {interactionId:id,timeRail:[],knowledgeNetworkIds:['kn1']}}
  const pending=service.remoteGetTurnProvenanceView('s1' as never,'m1',AbortSignal.timeout(1000));await new Promise(resolve=>setImmediate(resolve));Object.assign(service,{provenanceRevision:1});release()
  await assert.rejects(pending,/identity changed/)
})
test('missing message handles never dispatch native reads',async () => {
  const {service,calls}=serviceCase();assert.equal(await service.remoteGetTurnProvenanceView('s1' as never,'other',AbortSignal.timeout(1000)),undefined);assert.deepEqual(calls,[])
})

test('explicit primary-operation network mismatch rejects both native projections',async () => {
  const {service,reader}=serviceCase()
  reader.getNativeInteractionDetail=async id=>({interactionId:id,timeRail:[],knowledgeNetworkIds:['other-network']})
  const view=await service.remoteGetTurnProvenanceView('s1' as never,'m1',AbortSignal.timeout(1000))
  assert.deepEqual(view?.native?.explanation,{kind:'unavailable',reason:'invalid-response'})
  assert.deepEqual(view?.native?.detail,{kind:'unavailable',reason:'invalid-response'})
  assert.ok(view!.timeline.length>0)
})
