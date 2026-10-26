// Observe the real frozen business manager AFTER it mounts MCP. No manual MCP mount.
import assert from 'node:assert/strict'
import {readFileSync,writeFileSync,realpathSync} from 'node:fs'
import {createHash} from 'node:crypto'
import {join,relative,isAbsolute,sep} from 'node:path'
import {pathToFileURL} from 'node:url'
export const name='frozen32-profile-business-autoload-observer'
export const inject=['openbknBusinessContext','loader','pluginPackages','tools']
export function apply(ctx){setImmediate(()=>{void observe(ctx)})}
async function observe(ctx){
 const env=process.env,report={kind:'local-development-preacceptance',ciRun:null,formalAcceptanceEligible:false,node:process.versions.node,electron:process.versions.electron,scope:'real frozen32 business manager, profile-only MCP, single synthetic connection; no redirect/tool execution'},sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
 try{
  let entries=[]
  for(let i=0;i<150;i++){entries=[...ctx.loader.entries()].filter(x=>String(x.options.name??'').startsWith('@openbkn/dsh-business-context'));if(entries.length===3&&entries.every(x=>x.fiber?.state===2))break;await new Promise(r=>setTimeout(r,30))}
  assert.equal(entries.length,3);assert(entries.every(x=>x.fiber?.state===2));report.loadedComponents=entries.map(x=>({name:x.options.name,state:x.fiber.state}))
  const file=join(env.DSH_PROOF_INSTALLED,'lib/business.js'),business=await import(pathToFileURL(file).href),svc=ctx.openbknBusinessContext
  assert(svc instanceof business.OpenBknBusinessContextService);report.frozenServiceClassIdentity=true;report.businessSha256=sha(file)
  assert.equal(report.businessSha256,'9901a046cb3274a56ac47cc1734d669e7a012dab25ef7e34fe3643a38b8d1081')
  const networks=await svc.remoteConfigureToken('synthetic-profile-proof-only',AbortSignal.timeout(15000))
  assert.equal(networks.length,1);assert.equal(networks[0].id,'synthetic-kn');assert(ctx.tools.get('mcp__openbkn__bkn_start_interaction'));report.publicConfigureNormal='PASS'
  const selected=ctx.pluginPackages.packageOf('@deepseek-ai/dsh-mcp-client',pathToFileURL(file).href),selectedFile=realpathSync(join(selected.dir,'lib/index.js'))
  const within=relative(realpathSync(env.DSH_PROOF_PROFILE),selectedFile);assert(within&&!within.startsWith('..'+sep)&&within!=='..'&&!isAbsolute(within))
  report.selectedMcpSha256=sha(selectedFile);assert.equal(report.selectedMcpSha256,'b3cd7156c0b8639656ce117530fec4d006b74cafdc9a78ac426fec084e62972c')
  // Inspection only: this import is deliberately after remoteConfigureToken.
  const observedModule=await import(pathToFileURL(selectedFile).href),registered=ctx.registry.get(observedModule)
  assert(registered);report.selectedModuleAlreadyRegistered=true;report.managerFiberUsesSelectedModule=svc.mcpManagerInstance?.fiber?.runtime===registered;assert(report.managerFiberUsesSelectedModule)
  report.selectedProfileRelativeFile=within.replaceAll('\\','/');report.profileOverrideAutomatic='PASS';report.result='PASS'
 }catch(error){report.result='FAIL';report.error={name:error.name,message:String(error.message).slice(0,1000)}}
 finally{writeFileSync(env.DSH_PROOF_OUTPUT,JSON.stringify(report,null,2)+'\n')}
}
