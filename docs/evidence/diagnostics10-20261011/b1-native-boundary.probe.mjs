// Manual boundary probe: real CLI + MCP + native tools, no model or complete UI Host.
import assert from 'node:assert/strict'
import { appendFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { resolve, dirname } from 'node:path'
import { pathToFileURL } from 'node:url'
import { parseArgs } from 'node:util'
const {values} = parseArgs({options:{plugin:{type:'string'}, runtime:{type:'string'}, cli:{type:'string'}, live:{type:'string'}, kn:{type:'string'}, relogin:{type:'boolean'}, 'address-cycle':{type:'boolean'}}})
for (const k of ['plugin','runtime','cli','live','kn']) assert.ok(values[k], '--'+k+' is required')
const req=createRequire(resolve(values.runtime,'package.json'))
const mod=async name=>import(pathToFileURL(req.resolve('@deepseek-ai/'+name)).href)
const [{Context,Service},tool,prompt,subprocess,credentials]=await Promise.all(['cordis','dsh-tools','dsh-system-prompt','dsh-subprocess-local','dsh-credentials-local'].map(mod))
const {createScope}=await import(pathToFileURL(req.resolve('@deepseek-ai/dsh-scope',{paths:[dirname(req.resolve('@deepseek-ai/dsh-tools/package.json'))]})).href)
const production=await import(pathToFileURL(resolve(values.plugin,'lib/business.js')).href)
const diagnostics=await import(pathToFileURL(resolve(values.plugin,'lib/diagnostics.js')).href)
const ctx=new Context(),fibers=[]
const config=production.Config({baseUrl:values.live,cliPath:values.cli,toolCallTimeoutMs:20000})
const signal=()=>AbortSignal.timeout(140000)
const record=(phase, facts)=>console.log(JSON.stringify({at:new Date().toISOString(),phase,evidence:'CLI/MCP/native-tool boundary probe; not full UI Host',...facts}))
// Constructor-only agent/storage responsibilities are outside this probe;
// these methods exercise the production auth/MCP boundaries, without replacing either.
const service=Object.create(production.OpenBknBusinessContextService.prototype)
Object.assign(service,{ctx,config,lifetime:new AbortController()})
let sequence=0
try {
 for (const [plugin,options] of [[tool.default],[prompt.default],[subprocess.default],[credentials.default,{dshHome:process.env.DSH_HOME,watch:false}]]) fibers.push(await ctx.plugin(plugin,options))
 fibers.push(await ctx.plugin(class ProbeRegistry extends Service { constructor(ctx){super(ctx,'openbknWorkspaceBindingRegistry')} get(){return undefined} }))
 record('before-status',{kind:(await service.remoteStatus(signal())).kind})
 if (values.relogin) {record('login-started',{}); await service.remoteBeginLogin(signal()); record('login-completed',{})}
 else await service.remoteListNetworks(signal())
 const baselineToken=service.synchronizedToken
 async function callPair(phase) {
  const agent={id:'b1-'+phase,session:{snapshotEvents:()=>[]}}
  const scope=createScope(ctx,agent)
  fibers.push(await scope.ctx.plugin({name:'b1-probe-agent',inject:['tools','systemPrompt'],apply(scoped){agent.ctx=scoped;production.mountBoundBusinessNetworkTool(agent,config,{platformBaseUrl:config.baseUrl,knowledgeNetworkId:values.kn,displayName:'B1 probe'})}}))
  const start=await ctx.tools.execute({callId:'b1-'+(++sequence),name:'mcp__openbkn__bkn_start_interaction',arguments:{conversation_mode:'new',question:'B1 authentication boundary probe; no business query',agent_name:'bkn-agent-dsh-business-context'},agent,signal:signal()})
  const text=(start.content??[]).filter(x=>x.type==='text').map(x=>x.text).join('\n')
  let data;try{data=JSON.parse(text)}catch{}
  appendFileSync(resolve(process.env.DSH_HOME,'probe-interactions.private.jsonl'), JSON.stringify({at:new Date().toISOString(),data})+'\n')
  record(phase,{startIsError:start.isError===true,publicUnauthorized:text.includes('Public.Unauthorized'),hasInteractionId:typeof data?.interaction_id==='string'})
  assert.equal(start.isError===true,false)
  assert.equal(typeof data?.interaction_id,'string')
  const finish=await ctx.tools.execute({callId:'b1-'+(++sequence),name:'mcp__openbkn__bkn_finish_interaction',arguments:{interaction_id:data.interaction_id,outcome:'completed',answer:'B1 probe finished; no business data query'},agent,signal:signal()})
  record(phase+'-finish',{isError:finish.isError===true}); if(finish.isError) console.error(JSON.stringify(finish))
  assert.equal(finish.isError===true,false)
 }
 await callPair('baseline')
 // Public status reconciles the CLI credential even when its token stays unchanged.
 await service.remoteStatus(signal()); await callPair('same-owner-reconcile')
 if(values['address-cycle']) {
  await service.mcpManagerInstance?.fiber?.dispose()
  service.lifetime.abort()
  const offline=Object.create(production.OpenBknBusinessContextService.prototype)
  Object.assign(offline,{ctx,config:production.Config({...config,baseUrl:'https://192.0.2.1'}),lifetime:new AbortController()})
  record('address-mismatch',{kind:(await offline.remoteStatus(signal())).kind})
  const replacement=Object.create(production.OpenBknBusinessContextService.prototype)
  Object.assign(replacement,{ctx,config,lifetime:new AbortController()})
  await replacement.remoteListNetworks(signal())
  // Continue the same probe process with the replacement configuration owner.
  service.mcpManagerInstance=replacement.mcpManagerInstance
  record('replacement-owner',{tokenSameAsBaseline:replacement.synchronizedToken===baselineToken})
  await callPair('after-address-restore')
 }
 const report=await diagnostics.OpenBknDiagnosticsService.prototype.getReport.call({ctx})
 record('diagnostic-context-loader',{checks:report.checks.filter(x=>x.id==='observed:context-loader').map(x=>({status:x.status,code:x.code}))})
 record('complete',{passed:true})
} finally {
 await service.mcpManagerInstance?.fiber?.dispose()
 for(const fiber of fibers.reverse()) await fiber.dispose()
}
