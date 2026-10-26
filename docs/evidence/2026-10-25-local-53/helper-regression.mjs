import assert from 'node:assert/strict'
import { readFileSync, writeFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import { fetchWithinOrigin, isWithinOrigin } from './backport/fetch-within-origin.mjs'
// Execute the exact upstream helper as a reference, retaining its unused opt-out API.
const original = readFileSync(new URL('./upstream-mcp/transport.ts', import.meta.url), 'utf8')
const region = original.slice(original.indexOf('const REDIRECT_STATUSES'), original.indexOf('/** Error text for a redirect'))
const reference = new Function(stripTypeScriptTypes(region).replaceAll('export function', 'function') + '\nreturn {fetchWithinOrigin,isWithinOrigin}')()
const rows = []
const origins = [
  ['https://example.com/mcp','https://example.com/mcp',true],
  ['https://example.com/mcp','https://example.com/mcp/?a=1',true],
  ['http://example.com:8080/mcp','http://example.com:8080/other',true],
  ['http://example.com/mcp','https://example.com/mcp',true],
  ['http://example.com:80/mcp','https://example.com:443/mcp',true],
  ['https://example.com/mcp','http://example.com/mcp',false],
  ['https://example.com/mcp','https://example.com:8443/mcp',false],
  ['http://example.com:8080/mcp','https://example.com/mcp',false],
  ['http://example.com/mcp','https://example.com:8443/mcp',false],
  ['https://example.com/mcp','https://other.example/mcp',false],
  ['http://example.com/mcp','https://other.example/mcp',false],
  ['https://example.com/mcp','https://sub.example.com/mcp',false],
]
for (const [from,to,expected] of origins) {
  assert.equal(isWithinOrigin(new URL(from),new URL(to)),expected)
  assert.equal(reference.isWithinOrigin(new URL(from),new URL(to)),expected)
  rows.push({kind:'upstream-origin-vector',from,to,expected,result:'PASS'})
}
const cases = []
for (const method of ['GET','POST','DELETE']) for (const status of [301,302,303,307,308]) {
  cases.push({name:`same-${method}-${status}`,method,status,target:'/final',follows:method==='GET'||[307,308].includes(status)})
  cases.push({name:`cross-${method}-${status}`,method,status,target:'https://other.example/mcp',follows:false})
}
for (const target of ['https://example.com:8443/mcp','http://example.com/mcp','//other.example/mcp','https://user:pass@example.com/mcp/','ftp://example.com/mcp','http://[']) cases.push({name:`unsafe-${target}`,method:'POST',status:307,target,follows:false})
cases.push({name:'default-port-https-upgrade',from:'http://example.com/mcp',method:'POST',status:307,target:'https://example.com/mcp',follows:true})
cases.push({name:'same-userinfo',from:'https://user:pass@example.com/mcp',method:'POST',status:307,target:'/final',follows:true})
cases.push({name:'changed-userinfo',from:'https://user:pass@example.com/mcp',method:'POST',status:307,target:'https://other:pass@example.com/final',follows:false})
async function run(wrapper,item) {
  const calls=[],signal=new AbortController().signal
  const init={method:item.method,headers:{'x-probe':'synthetic-only'},body:item.method==='POST'?'synthetic-body':undefined,signal}
  const base=async(url,asked)=>{
    calls.push({url:String(url),method:asked.method,redirect:asked.redirect,headers:asked.headers,body:asked.body,signalSame:asked.signal===signal})
    return calls.length===1?new Response(null,{status:item.status,headers:{location:item.target}}):new Response('ok')
  }
  const response=await wrapper(base)(item.from??'https://example.com/mcp',init)
  assert.equal(calls.length,item.follows?2:1)
  assert(calls.every(x=>x.redirect==='manual'&&x.signalSame&&x.method===item.method&&x.body===init.body))
  return {status:response.status,calls}
}
for (const item of cases) {
  assert.deepEqual(await run(fetchWithinOrigin,item),await run(reference.fetchWithinOrigin,item))
  rows.push({kind:'official-helper-equivalence',name:item.name,result:'PASS'})
}
for (const wrapper of [fetchWithinOrigin,reference.fetchWithinOrigin]) {
  let count=0
  const response=await wrapper(async()=>{count++;return new Response(null,{status:307,headers:{location:'/again'}})})('https://example.com/mcp',{method:'POST',body:'synthetic'})
  assert.equal(count,6);assert.equal(response.status,307)
  const opaque={type:'opaqueredirect',status:0,ok:false,headers:new Headers()}
  assert.equal(await wrapper(async()=>opaque)('https://example.com/mcp'),opaque)
  for(const mode of ['manual','error']) {
    const init={redirect:mode},response=new Response(null,{status:307,headers:{location:'/final'}})
    assert.equal(await wrapper(async(_url,asked)=>{assert.equal(asked,init);return response})('https://example.com/mcp',init),response)
  }
  let calls=[]
  const mixed=await wrapper(async(url)=>{calls.push(String(url));return new Response(null,{status:307,headers:{location:calls.length===1?'/same':'https://other.example/mcp'}})})('https://example.com/mcp',{method:'POST',body:'synthetic'})
  assert.equal(mixed.status,307);assert.deepEqual(calls,['https://example.com/mcp','https://example.com/same'])
  const controller=new AbortController();controller.abort()
  await assert.rejects(wrapper(fetch)('http://127.0.0.1:9/no-network',{signal:controller.signal}),{name:'AbortError'})
}
rows.push({kind:'hop-budget-opaque-explicit-modes-mixed-chain-abort',referenceAndBackport:true,result:'PASS'})
writeFileSync(new URL('./helper-regression.json',import.meta.url),JSON.stringify({sourceCommit:'433eb413dc305ebeb93b8ebcde0095a8fc0d5fa0',scope:'official golden vectors and exact-source helper equivalence; synthetic fetch plus already-aborted loopback fetch',rows},null,2)+'\n')
console.log(JSON.stringify({groups:rows.length,pass:rows.every(x=>x.result==='PASS')}))
