import assert from 'node:assert/strict'
import {createServer} from 'node:http'
import {writeFileSync} from 'node:fs'
import {fetchWithinOrigin} from './backport/fetch-within-origin.mjs'
const requests=[]
let address
const server=createServer((req,res)=>{
 requests.push(req.url)
 if(req.url==='/slow'){
  res.writeHead(307,{location:'/final','content-type':'text/plain'})
  res.write('synthetic incomplete redirect body')
 }else res.end('synthetic result')
})
await new Promise(r=>server.listen(0,'127.0.0.1',r));address=`http://127.0.0.1:${server.address().port}`
let error,elapsed
try{
 const controller=new AbortController(),start=Date.now()
 const pending=fetchWithinOrigin(fetch)(address+'/slow',{method:'POST',body:'synthetic-only',signal:controller.signal})
 const deadline=setTimeout(()=>controller.abort(),60)
 try{await pending}catch(e){error=e}finally{clearTimeout(deadline)}
 elapsed=Date.now()-start
 assert.equal(error?.name,'AbortError')
 assert.deepEqual(requests,['/slow'])
 assert(elapsed<1500)
}finally{server.closeAllConnections();await new Promise(r=>server.close(r))}
writeFileSync(new URL('./redirect-abort-probe.json',import.meta.url),JSON.stringify({scope:'real loopback HTTP with an unfinished same-origin redirect body; caller AbortSignal',rejectedAs:error?.name,elapsedMs:elapsed,requests,serversClosed:!server.listening,port:new URL(address).port,result:'PASS'},null,2)+'\n')
console.log(JSON.stringify({result:'PASS',elapsedMs:elapsed,finalEndpointRequests:0,serverClosed:!server.listening}))
