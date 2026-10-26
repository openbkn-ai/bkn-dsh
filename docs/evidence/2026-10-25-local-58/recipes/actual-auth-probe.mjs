import {readFileSync,writeFileSync,realpathSync} from 'node:fs'
import {createRequire} from 'node:module'
import {pathToFileURL} from 'node:url'
import {join} from 'node:path'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
export const name='local58-actual-plugin-auth-proof'
export const inject=['openbknBusinessContext','openbknDiagnostics','loader','pluginPackages','credentials','tools','subprocess']
export function apply(ctx){setImmediate(()=>{void run(ctx)})}
async function run(ctx){
 const out=process.env.LOCAL58_OUTPUT,req=createRequire(join(process.env.LOCAL58_RUNTIME,'package.json')),rows=[],report={scope:'Actual frozen32 profile in complete Host; native business service and native subprocess; real CLI browser login and read-only platform MCP/catalogue; no model/tool execution/Sandbox',host:process.env.LOCAL58_HOST,form:process.env.LOCAL58_FORM,node:process.versions.node,electron:process.versions.electron??null}
 const emit=(phase,details={})=>writeFileSync(out,JSON.stringify({...report,phase,rows,...details},null,2)+'\n')
 try{
  for(let i=0;i<150;i++){const entries=[...ctx.loader.entries()].filter(x=>String(x.options.name??'').startsWith('@openbkn/dsh-business-context'));if(entries.length===3&&entries.every(x=>x.fiber?.state===2))break;await new Promise(r=>setTimeout(r,30))}
  const entries=[...ctx.loader.entries()].filter(x=>String(x.options.name??'').startsWith('@openbkn/dsh-business-context'));assert.equal(entries.length,3);assert(entries.every(x=>x.fiber?.state===2),'The 3 frozen plugin components must be live');report.loadedEntries=entries.map(x=>({name:x.options.name,state:x.fiber.state}))
  const installed=process.env.LOCAL58_INSTALLED,pluginReq=createRequire(join(installed,'lib/business.js')),business=await import(pathToFileURL(join(installed,'lib/business.js')).href);report.pluginClassIdentity=ctx.openbknBusinessContext instanceof business.OpenBknBusinessContextService;assert(report.pluginClassIdentity,'Loaded service must use the exact installed candidate module')
  const nodeMcp=realpathSync(pluginReq.resolve('@deepseek-ai/dsh-mcp-client')),owner=ctx.pluginPackages.packageOf('@deepseek-ai/dsh-mcp-client',pathToFileURL(join(installed,'lib/business.js')).href),apiMcp=realpathSync(join(owner.dir,'lib/index.js'));assert.equal(nodeMcp,apiMcp);report.actualMcpEntrySha256=createHash('sha256').update(readFileSync(nodeMcp)).digest('hex');assert.equal(report.actualMcpEntrySha256,'b3cd7156c0b8639656ce117530fec4d006b74cafdc9a78ac426fec084e62972c');report.mcpSamePhysicalPackage=true
  const envCheck=ctx.subprocess.spawn({argv:[process.env.LOCAL58_NODE,...(process.versions.electron?['--expose-internals']:[]),'-e','process.stdout.write(JSON.stringify({isolated:process.env.BKN_CONFIG_DIR===process.argv[1]}))',process.env.BKN_CONFIG_DIR],cwd:process.env.DSH_HOME,stdio:{stdin:{data:''},stdout:{maxBytes:2048},stderr:{maxBytes:2048}},graceMs:3000,signal:AbortSignal.timeout(10000)});const done=await envCheck.done;assert.equal(done.exitCode,0);assert.equal(JSON.parse(envCheck.collected.stdout.readFrom(0).text).isolated,true);report.nativeSubprocessCliConfigIsolated=true
  const signal=AbortSignal.timeout(180000),before=await ctx.openbknBusinessContext.remoteStatus(signal);rows.push({stage:'before',kind:before.kind,baseUrl:before.baseUrl??null});emit('awaiting-native-cli-browser-login')
  const networks=await ctx.openbknBusinessContext.remoteBeginLogin(signal);rows.push({stage:'beginLogin',networkCount:networks.length});assert(networks.length>0)
  const after=await ctx.openbknBusinessContext.remoteStatus(signal);assert.equal(after.kind,'authenticated');rows.push({stage:'after',kind:after.kind,baseUrl:after.baseUrl})
  const credentials=await import(pathToFileURL(req.resolve('@deepseek-ai/dsh-credentials')).href),description=await ctx.credentials.describe(credentials.credentialRef('OPENBKN_MCP_TOKEN'));assert(description.configured);report.vaultCredentialConfigured=true
  report.managedToolRegistered=ctx.tools.get('mcp__openbkn__bkn_start_interaction')!==undefined;assert(report.managedToolRegistered);report.openbknToolNames=ctx.tools.schemas().map(x=>x.name).filter(x=>x.startsWith('mcp__openbkn__')).sort()
  const diagnostic=await ctx.openbknDiagnostics.getReport(signal);report.diagnostics={mode:diagnostic.mode,loadedVersion:diagnostic.target.pluginLoadedVersion,diskVersion:diagnostic.target.pluginDiskVersion,checks:diagnostic.checks.map(x=>({id:x.id,status:x.status,code:x.code}))}
  emit('complete',{result:'PASS',realBusinessToolsExecuted:0,modelCalls:0})
 }catch(error){emit('failed',{result:'FAIL',error:{name:error.name,message:String(error.message).replace(/Bearer\s+[^\s]+/gi,'Bearer <redacted>').slice(0,1400)}})}
}
