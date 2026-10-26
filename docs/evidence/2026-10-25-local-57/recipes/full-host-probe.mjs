import {createRequire} from 'node:module'
import {writeFileSync,readFileSync} from 'node:fs'
import {resolve,join} from 'node:path'
import {pathToFileURL} from 'node:url'
import {createHash} from 'node:crypto'
export const name='local57-full-host-probe'
export const inject=['tools','sessions']
export async function apply(ctx){
 const req=createRequire(join(process.env.LOCAL57_RUNTIME,'package.json')),output=process.env.LOCAL57_OUTPUT,rows=[]
 try {
  const scopeEntry=req.resolve('@deepseek-ai/dsh-scope',{paths:[req.resolve('@deepseek-ai/dsh-tools/package.json')]}),{createScope}=await import(pathToFileURL(scopeEntry).href)
  for(let i=0;i<100&&(!ctx.tools.get('mcp__same__echo')||!ctx.tools.get('mcp__cross__echo'));i++)await new Promise(r=>setTimeout(r,50))
  const session=ctx.sessions.create(undefined,{meta:{cwd:process.env.DSH_HOME}})
  const agent={id:session.id,session}
  agent.ctx=createScope(ctx,agent).ctx
  for(const server of ['same','cross']){
   if(!ctx.tools.get(`mcp__${server}__echo`))throw new Error('Expected native configured tool not registered: '+server)
   const result=await ctx.tools.execute({callId:'local57-'+server,name:`mcp__${server}__echo`,arguments:{question:'synthetic-business-question-local57'},agent,signal:AbortSignal.timeout(5000)})
   rows.push({server,errorText:result.isError?JSON.stringify(result.content):null,isError:result.isError===true,syntheticResult:result.content?.some(x=>x.type==='text'&&x.text==='synthetic-result')===true})
  }
  const mcp=req.resolve('@deepseek-ai/dsh-mcp-client')
  writeFileSync(output,JSON.stringify({mode:process.env.LOCAL57_MODE,fullHostProfile:process.env.LOCAL57_PROFILE,rows,mcpEntry:mcp,mcpEntrySha256:createHash('sha256').update(readFileSync(mcp)).digest('hex'),node:process.versions.node,electron:process.versions.electron??null,agentKind:'synthetic Agent using real temporary Host Session; no model or existing user session'},null,2)+'\n')
 }catch(error){writeFileSync(output,JSON.stringify({mode:process.env.LOCAL57_MODE,rows,error:{name:error.name,message:error.message,stack:error.stack}},null,2)+'\n')}
}
