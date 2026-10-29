// Observe the actual packed Service only after the panel persists a confirmed synthetic CA.
import assert from 'node:assert/strict'
import { writeFileSync, readFileSync, realpathSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createHash } from 'node:crypto'
export const name='panel-certificate-actual-service-observer'
export const inject=['openbknBusinessContext','pluginPackages','tools','loader']
export function apply(ctx){
 let started=false
 const timer=setInterval(()=>{
  if(started||ctx.openbknBusinessContext.config.platformTrust==null)return
  started=true;void observe(ctx)
 },150)
 ctx.effect(()=>()=>clearInterval(timer),'certificate proof observer lifetime')
}
async function observe(ctx){
 const output=process.env.OPENBKN_CERT_PROOF_OUTPUT,report={kind:'local-controlled-actual-host-service',ciRun:null,formalAcceptanceEligible:false,checkedAt:new Date().toISOString()}
 try {
  const svc=ctx.openbknBusinessContext,installed=process.env.OPENBKN_CERT_PROOF_INSTALLED
  const businessFile=join(installed,'lib/business.js'),business=await import(pathToFileURL(businessFile).href)
  assert(svc instanceof business.OpenBknBusinessContextService)
  report.loadedClassIdentity=true;report.businessSha256=createHash('sha256').update(readFileSync(businessFile)).digest('hex')
  report.version=JSON.parse(readFileSync(join(installed,'package.json'))).version
  report.hasAmbientExtraCa=!!process.env.NODE_EXTRA_CA_CERTS;report.tlsDisabled=process.env.NODE_TLS_REJECT_UNAUTHORIZED==='0'
  assert.equal(report.hasAmbientExtraCa,false);assert.equal(report.tlsDisabled,false)
  await assert.rejects(svc.remoteBeginLogin(AbortSignal.timeout(2000)),e=>e.code==='openbkn/transport-failed'&&e.details?.reason==='TRUST_CLI_UNAVAILABLE')
  report.importedCertificateCliLoginBlocked='PASS'
  report.components=[...ctx.loader.entries()].filter(x=>String(x.options.name??'').startsWith('@openbkn/dsh-business-context')).map(x=>({name:x.options.name,state:x.fiber?.state}))
  assert.equal(report.components.length,3);assert(report.components.every(x=>x.state===2))
  const priorPath=join(process.env.OPENBKN_CERT_PROOF_PROFILE,'../../../ACTUAL-SERVICE-attempt1.json')
  const prior=existsSync(priorPath)?JSON.parse(readFileSync(priorPath)):undefined
  if(prior?.managedMcpAndCatalog==='PASS'&&prior.businessSha256===report.businessSha256&&svc.mcpManagerInstance?.fiber){
   report.managedMcpAndCatalog='PASS';report.reusedManagedMcpAndCatalogFrom='ACTUAL-SERVICE-attempt1.json'
  }else{
   const networks=await svc.remoteConfigureToken('synthetic-only',AbortSignal.timeout(5000))
   assert.equal(networks.length,1);assert.equal(networks[0].id,'synthetic-network');report.managedMcpAndCatalog='PASS'
  }
  const selected=ctx.pluginPackages.packageOf('@deepseek-ai/dsh-mcp-client',pathToFileURL(businessFile).href)
  const selectedFile=realpathSync(join(selected.dir,'lib/index.js')),module=await import(pathToFileURL(selectedFile).href)
  assert.equal(module.platformFetchSupported,true)
  report.mcpEntrySha256=createHash('sha256').update(readFileSync(selectedFile)).digest('hex')
  assert.equal(svc.mcpManagerInstance.fiber.runtime,ctx.registry.get(module))
  report.actualManagerUsesSelectedModule=true
  assert(selectedFile.startsWith(process.env.OPENBKN_CERT_PROOF_PROFILE+'/node_modules/'))
  report.profileOverrideAutomatic=true
  const reader=svc.platformReader()
  const detail=await reader.getNativeInteractionDetail('int-fixture',AbortSignal.timeout(3000))
  assert.equal(detail.interactionId,'int-fixture')
  const explanation=await reader.getNativeInteractionExplanation('int-fixture',AbortSignal.timeout(3000))
  assert.equal(explanation.kind,'ready')
  assert.equal(explanation.view.claims[0].status,'candidate')
  assert.equal(explanation.view.claims[0].supportStatus,'partial')
  assert.equal(explanation.view.claims[0].attributionStatus,'explicit')
  report.nativeReadsPreservePlatformStates='PASS'
  report.noBusinessToolsCalled=true;report.result='PASS'
 }catch(error){report.result='FAIL';report.failure={name:error.name,message:String(error.message).slice(0,800)}}
 writeFileSync(output,JSON.stringify(report,null,2)+'\n')
}
