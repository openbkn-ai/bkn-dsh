// Actual official CLI 0.2.0 against loopback synthetic HTTPS only. No browser URI is returned.
import { createServer } from 'node:https'
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { execFileSync, execFile } from 'node:child_process'
const [node, cli, outputArg] = process.argv.slice(2)
const output = resolve(outputArg), temp = mkdtempSync(join(tmpdir(),'openbkn-cli-origin-'))
execFileSync('openssl',['req','-x509','-newkey','ec','-pkeyopt','ec_paramgen_curve:P-256','-nodes','-keyout',join(temp,'key'),'-out',join(temp,'cert'),'-days','2','-subj','/CN=127.0.0.1','-addext','subjectAltName=IP:127.0.0.1','-addext','basicConstraints=critical,CA:FALSE'],{stdio:'ignore'})
const cert=readFileSync(join(temp,'cert')),key=readFileSync(join(temp,'key')),requests=[],servers=[],origins={}
let outcome
try {
 for(const name of ['a','b']) {
  const s=createServer({cert,key},async(req,res)=>{
   let bytes=0;for await(const c of req)bytes+=c.length
   requests.push({origin:name,method:req.method,path:req.url,bodyBytes:bytes,hasAuthorization:!!req.headers.authorization})
   if(name==='a')res.writeHead(307,{location:origins.b+'/synthetic-device-target'}).end()
   else res.writeHead(400,{'content-type':'application/json'}).end('{"error":"synthetic_stop_before_browser"}')
  })
  await new Promise(r=>s.listen(0,'127.0.0.1',r));servers.push(s);origins[name]='https://127.0.0.1:'+s.address().port
 }
 outcome=await new Promise(resolve=>execFile(node,[cli,'auth','login',origins.a],{env:{...process.env,NODE_EXTRA_CA_CERTS:join(temp,'cert'),BKN_CONFIG_DIR:join(temp,'cli-config')},timeout:8000,maxBuffer:65536},(error,stdout,stderr)=>resolve({exitCode:error?.code??0,killed:error?.killed??false,outputContainsSyntheticStop:(stdout+stderr).includes('synthetic_stop_before_browser')})))
} finally {
 for(const s of servers){s.closeAllConnections();await new Promise(r=>s.close(r))}
 rmSync(temp,{recursive:true,force:true})
 const report={kind:'controlled-official-cli-origin-boundary',cliVersion:'0.2.0',nodeInvocation:'explicit task Node',scope:'loopback HTTPS; synthetic device request; no account authorization, browser URI or credential',ciRun:null,outcome,requests,secondOriginRequests:requests.filter(r=>r.origin==='b').length,fixtureListenersClosed:servers.every(s=>!s.listening)}
 writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report))
}
