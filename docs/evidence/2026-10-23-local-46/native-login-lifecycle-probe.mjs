/** Native Gateway wire + unchanged packed consumer/service; source-loaded
 * process lifecycle with injected Windows APIs. No real CLI/browser/Job. */
import assert from 'node:assert/strict'
import { readFileSync, writeFileSync, mkdirSync, symlinkSync, realpathSync } from 'node:fs'
import { createRequire, stripTypeScriptTypes } from 'node:module'
import { createHash } from 'node:crypto'
import { resolve, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createServer } from 'node:http'
import { EventEmitter } from 'node:events'
import { setTimeout as pause } from 'node:timers/promises'
const repository=process.cwd(), target=resolve(process.argv[2]??('release/local-46/native-probe-'+Date.now())), reportPath=join(target,'native-login-lifecycle.json')
mkdirSync(target,{recursive:false})
const sha=value=>createHash('sha256').update(value).digest('hex')
const versions=['0.2.0-rc.2','0.2.1-rc.2']
const report={kind:'controlled native-wire and source-loaded lifecycle probe',platform:process.platform,node:process.version,plugin:'0.2.0-rc.2-openbkn.0.2.0-30',platformAccessed:false,realCliExecuted:false,browserExecuted:false,realWindowsJobExecuted:false,hostUiStarted:false,hosts:[]}
async function deadline(p,label){let timer;try{return await Promise.race([p,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('Deadline: '+label)),2500)})])}finally{clearTimeout(timer)}}
async function until(test,label){await deadline((async()=>{while(!test())await pause(2)})(),label)}
function sliceBetween(text,start,end){const a=text.indexOf(start),b=text.indexOf(end,a);assert.ok(a>=0&&b>a,start);return text.slice(a,b)}
function factory(code,names,args,returnName){const js=stripTypeScriptTypes(code.replace(/^export /gm,''),{mode:'transform'});return new Function(...names,js+';return '+returnName)(...args)}
for(const version of versions){
 const local=join(target,version);mkdirSync(local,{recursive:true})
 const runtime=resolve('release/local-40/controlled-hosts-30',version)
 const require=createRequire(join(runtime,'package.json'))
 const gatewayDir=realpathSync(join(runtime,'node_modules/@deepseek-ai/dsh-api-gateway'))
 const gatewayRequire=createRequire(join(gatewayDir,'package.json'))
 try{symlinkSync(resolve(gatewayDir,'../..'),join(local,'node_modules'),'dir')}catch(error){if(error.code!=='EEXIST')throw error;assert.equal(realpathSync(join(local,'node_modules')),resolve(gatewayDir,'../..'))}
 const serverText=readFileSync(join(gatewayDir,'lib/index.js'),'utf8')
 const serverFile=join(local,'gateway-server.mjs')
 writeFileSync(serverFile,serverText+'\nexport { RemoteStreamMuxConnection };\n')
 const {RemoteStreamMuxConnection}=await import(pathToFileURL(serverFile))
 const Ws=gatewayRequire('ws');const WebSocketServer=Ws.WebSocketServer??Ws.Server;assert.equal(typeof WebSocketServer,'function')
 const clientPath=join(gatewayDir,'lib',version==='0.2.0-rc.2'?'client.js':'client.node.js')
 const clientText=readFileSync(clientPath,'utf8'); let client;const browserDocument={baseURI:'http://127.0.0.1/'}
 if(version==='0.2.0-rc.2'){
  assert.equal(clientText.split('return module.exports;').length,2)
  let loaded
  const moduleLoader={load({factory}){loaded=factory(gatewayRequire)}}
  new Function('window','document',clientText.replace('return module.exports;','exports.__lifecycleProbe = { RemoteStreamMuxClient, ClientStreamHandle, ClientUplinkQueue }; return module.exports;'))({__ModuleLoader__:moduleLoader},browserDocument)
  client=loaded.__lifecycleProbe
 }else{
  const clientFile=join(local,'gateway-client.mjs')
  writeFileSync(clientFile,clientText+'\nexport { RemoteStreamMuxClient, ClientStreamHandle, ClientUplinkQueue };\n')
  client=await import(pathToFileURL(clientFile))
 }
 const pluginDir=realpathSync(join(runtime,'node_modules/@openbkn/dsh-business-context'))
 const packedClient=readFileSync(join(pluginDir,'lib/client.js'),'utf8')
 const portBody=sliceBetween(packedClient,'function remotePort(', 'function createNetworkSessionOpener(')
 const makePort=new Function(portBody+';return remotePort')()
 const {OpenBknBusinessContextService}=await import(pathToFileURL(join(pluginDir,'lib/business.js')))
 const nativeLoginStream=OpenBknBusinessContextService.prototype.beginLoginStream
 assert.equal(typeof nativeLoginStream,'function')
 const sourceRoot=resolve('release',version==='0.2.0-rc.2'?'deepseek-harness':'dsh-0.2.1-rc.2')
 const processRoot=join(sourceRoot,'packages/subprocess/subprocess-local/src')
 const runnerSource=readFileSync(join(processRoot,'spawn-runner.ts'),'utf8')
 const runnerBody=sliceBetween(runnerSource,'function sendMessage(', '/**\n * Execute the selected Linux')
 const protocolSource=readFileSync(join(processRoot,'runner-protocol.ts'),'utf8')
 const protocolFile=join(local,'runner-protocol.mjs');writeFileSync(protocolFile,stripTypeScriptTypes(protocolSource,{mode:'transform'}))
 const protocol=await import(pathToFileURL(protocolFile))
 class UnusedWin32Error extends Error{}
 const unexpected=(...args)=>{throw new Error('Unexpected injected error branch: '+String(args[0]))}
 const Runner=factory(runnerBody,['parseWindowsStartRequest','isWindowsTerminateRequest','serializeRunnerError','Win32Error','SUBPROCESS_CONTROL_FD','asSpawnError','windowsPathNotFoundError','windowsStartCancelledError'],[protocol.parseWindowsStartRequest,protocol.isWindowsTerminateRequest,protocol.serializeRunnerError,UnusedWin32Error,7,unexpected,unexpected,unexpected],'WindowsJobRunner')
 const ownerSource=readFileSync(join(processRoot,'windows-job.ts'),'utf8')
 const ownerBody=sliceBetween(ownerSource,'class WindowsJobOwner', '/**\n * Launch one target')
 const cancellationPredicate=factory(sliceBetween(ownerSource,'function isWindowsStartCancellationError(', '/**\n * Re-check the runner'),[],[],'isWindowsStartCancellationError')
 const Owner=factory(ownerBody,['isWindowsStartCancellationError'],[cancellationPredicate],'WindowsJobOwner')
 const spawnSource=readFileSync(join(processRoot,'spawn.ts'),'utf8')
 const bindBody=sliceBetween(spawnSource,'export function bindManagedProcess(', '/**\n * Spawn one detached')
 for(const [input,output] of [['managed-owner.ts','managed-owner.mjs'],['output.ts','output.mjs']]){
  writeFileSync(join(local,output),stripTypeScriptTypes(readFileSync(join(processRoot,input),'utf8'),{mode:'transform'}))
 }
 const [{waitWithAbort},{prepareManagedProcessBinding,OutputCollector}]=await Promise.all(['managed-owner.mjs','output.mjs'].map(n=>import(pathToFileURL(join(local,n)))))
 const bind=factory(bindBody,['prepareManagedProcessBinding','OutputCollector','waitWithAbort'],[prepareManagedProcessBinding,OutputCollector,waitWithAbort],'bindManagedProcess')
 const hostReport={version,code:{gatewayClientSHA256:sha(clientText),gatewayServerSHA256:sha(serverText),packedClientSHA256:sha(packedClient),packedConsumerSHA256:sha(portBody),packedLoginStreamSHA256:sha(nativeLoginStream.toString()),runnerSourceSHA256:sha(runnerSource),runnerExtractSHA256:sha(runnerBody),parentOwnerSourceSHA256:sha(ownerSource),parentOwnerExtractSHA256:sha(ownerBody),commonLifecycleSourceSHA256:sha(spawnSource),bindExtractSHA256:sha(bindBody)},executionBoundary:{gateway:'published bundles, added private-symbol exports only',plugin:'unchanged -30 packed consumer and service method',processLifecycle:'unchanged pinned source functions/classes, TypeScript transform only',windowsApis:'injected fixture with an intentionally nonempty Job, no actual processes or Job handles',authAndTarget:'remoteBeginLogin stand-in waits for an injected direct-exit result; no CLI credentials or auth coordinator',dispatch:'native mux classes instantiated directly; public Gateway/Typert mount and authorization are not exercised',timing:'active-send cases deliberately delay only the WebSocket item-send acknowledgement callback; production service generator is unchanged'},cases:[]}
 report.hosts.push(hostReport)
 for(const mode of ['first-result-active-send','drain-to-terminal-active-send','first-result-server-finished']){
  const events=[];const mark=(name,extra={})=>events.push({sequence:events.length+1,name,...extra})
  const direct=Promise.withResolvers();const nativeHost=new EventEmitter();nativeHost.env={};nativeHost.connected=true;nativeHost.cwd=()=>local;nativeHost.chdir=()=>{};nativeHost.exitCode=undefined
  nativeHost.send=(message,callback)=>{mark('runner-target-result',{type:message.type,exitCode:message.exitCode});direct.resolve({exitCode:message.exitCode});callback(null)}
  nativeHost.disconnect=()=>{nativeHost.connected=false;mark('runner-finished',{exitCode:nativeHost.exitCode});nativeHost.emit('disconnect')}
  let jobEmpty=false,terminateCalls=0;const ownerSignals=[]
  const internals={resolveWindowsExecutable:()=> 'controlled-cli.exe',loadWin32ProcessBindings:()=>({fixture:true}),spawnCurrentTokenJobProcess:()=>{mark('fixture-job-created');return {process:'fixture-process',job:'fixture-job'}},closeFileDescriptor:()=>{},pollProcessExit:()=>0,isJobEmpty:()=>jobEmpty,terminateJob:()=>{terminateCalls++;jobEmpty=true;mark('injected-terminate-job')},closeHandleChecked:(_api,_handle,label)=>mark('native-close-handle',{label})}
  const runner=new Runner(['controlled-cli.exe'],nativeHost,internals);const runnerDone=runner.run()
  nativeHost.emit('message',{type:'start',cwd:local,env:{}})
  let control,common,connection,clientMux,serverSocket;let heldCallback,releaseTimer
  let cancelSeen=false,serverAborted=false,itemSeen=false,endSeen=false
  const wire=[]
  const releaseCallback=()=>{const fn=heldCallback;heldCallback=undefined;if(fn){mark('fixture-release-send-callback');fn()}}
  const http=createServer();const wsServer=new WebSocketServer({noServer:true});let connectionDone
  http.on('upgrade',(req,socket,head)=>wsServer.handleUpgrade(req,socket,head,ws=>wsServer.emit('connection',ws)))
  wsServer.on('connection',ws=>{
   serverSocket=ws;const send=ws.send.bind(ws)
   ws.send=(text,callback)=>{
    const frame=JSON.parse(String(text));wire.push({direction:'server-to-client',type:frame.type});mark('server-send-'+frame.type)
    if(frame.type==='item')itemSeen=true;if(frame.type==='end')endSeen=true
    if(frame.type==='item'&&mode!=='first-result-server-finished'){
     send(text,error=>{if(error){callback(error);return}heldCallback=()=>callback();mark('fixture-hold-send-callback');releaseTimer=setTimeout(releaseCallback,mode==='drain-to-terminal-active-send'?25:500)})
    }else send(text,callback)
   }
   ws.on('message',data=>{const frame=JSON.parse(data.toString());wire.push({direction:'client-to-server',type:frame.type});mark('server-receive-'+frame.type);if(frame.type==='cancel'){cancelSeen=true;mark('cancel-active-observation',{activeStreams:connection.streams.size})}})
   const open=async(_endpoint,_payload,_uplink,streamControl)=>{
    control=streamControl
    control.signal.addEventListener('abort',()=>{serverAborted=true;mark('server-operation-aborted');releaseCallback()},{once:true})
    const parentRunner={get connected(){return nativeHost.connected},send(message,callback){mark('parent-to-runner-'+message.type);queueMicrotask(()=>{nativeHost.emit('message',message);callback(null)})},kill(){throw new Error('Unexpected host-exit fallback')}}
    const owner=new Owner(parentRunner,runnerDone,()=> 'target-exit',unexpected)
    const nativeSignal=owner.signal.bind(owner);owner.signal=(signal,reason)=>{ownerSignals.push(signal);mark('common-owner-signal',{signal});nativeSignal(signal,reason)}
    common=bind({argv:['controlled-cli.exe'],cwd:local,stdio:{stdin:'ignore',stdout:'inherit',stderr:'inherit'},graceMs:100,signal:control.signal},{stdin:null,stdout:null,stderr:null,direct:direct.promise,owner},{spillDir:local,onSpillFailure:unexpected})
    await common.done;mark('common-direct-done-before-login-result')
    return nativeLoginStream.call({remoteBeginLogin:async()=>[{id:'fixture-network',name:'Fixture network'}]},control.signal)
   }
   connection=new RemoteStreamMuxConnection(ws,open,error=>({code:'fixture/failure',message:String(error)}),1024*1024,()=>{})
   connectionDone=connection.run()
  })
  await new Promise(resolveListen=>http.listen(0,'127.0.0.1',resolveListen))
  const address=http.address();assert.equal(typeof address,'object')
  browserDocument.baseURI='http://127.0.0.1:'+address.port+'/';clientMux=version==='0.2.0-rc.2'?new client.RemoteStreamMuxClient():new client.RemoteStreamMuxClient(()=>new WebSocket('ws://127.0.0.1:'+address.port+'/api/remote.mux'))
  clientMux.start();let handle
  try{
   const callerOperation=new AbortController(),generation=new AbortController(),queue=new client.ClientUplinkQueue('openbknBusinessContext/beginLoginStream')
   handle=new client.ClientStreamHandle('openbknBusinessContext/beginLoginStream',clientMux.open('openbknBusinessContext/beginLoginStream',{args:{}},AbortSignal.any([generation.signal,callerOperation.signal]),queue),queue,generation,{active:true})
   if(mode==='first-result-server-finished')await until(()=>itemSeen&&endSeen&&connection.streams.size===0,'server natural removal')
   let value
   if(mode==='drain-to-terminal-active-send'){
    for await(const item of handle)value=item
    await handle.dispose();mark('drain-consumer-completed')
   }else{
    value=await deadline(makePort({remote:{openbknBusinessContext:{beginLoginStream:()=>handle}}}).beginLogin(callerOperation.signal),'packed consumer')
    mark('packed-consumer-returned')
   }
   assert.equal(value[0].id,'fixture-network')
   if(mode!=='drain-to-terminal-active-send')await until(()=>cancelSeen,'wire cancel received')
   await until(()=>connection.streams.size===0,'server stream removed')
   await pause(20)
   assert.equal(callerOperation.signal.aborted,false)
   const beforeCleanup={callerOperationAborted:callerOperation.signal.aborted,cancelSeen,serverAborted,ownerSignals:[...ownerSignals],terminateCalls,runnerStillConnected:nativeHost.connected,serverStreamRemoved:connection.streams.size===0,endFrameSent:endSeen,directDoneBeforeLoginResult:events.some(e=>e.name==='common-direct-done-before-login-result')}
   if(mode==='first-result-active-send'){
    assert.equal(serverAborted,true);assert.deepEqual(ownerSignals,['SIGTERM']);assert.equal(terminateCalls,1);assert.equal(nativeHost.connected,false)
   }else{
    assert.equal(serverAborted,false);assert.deepEqual(ownerSignals,[]);assert.equal(terminateCalls,0);assert.equal(nativeHost.connected,true)
   }
   if(mode==='drain-to-terminal-active-send')assert.equal(cancelSeen,false)
   if(mode==='first-result-server-finished')assert.equal(cancelSeen,true)
   hostReport.cases.push({mode,verdict:'PASS',observedBeforeFixtureCleanup:beforeCleanup,wire,events})
  }catch(error){
   writeFileSync(join(target,'probe-failure-private.json'),JSON.stringify({version,mode,error:String(error),stack:error.stack,events,wire},null,2)+'\n');throw error
  }finally{
   clearTimeout(releaseTimer);releaseCallback();await handle?.dispose()
   // Fixture-only release. No real process or browser is signalled.
   jobEmpty=true;mark('fixture-natural-job-release-for-cleanup');await deadline(runnerDone,'fixture runner cleanup')
   if(common)assert.equal(await deadline(common.waitForExit(),'common range cleanup'),true)
   await clientMux.close();serverSocket?.close();if(connectionDone)await deadline(connectionDone,'server connection cleanup')
   await new Promise(resolveClose=>wsServer.close(()=>resolveClose()))
   await new Promise(resolveClose=>http.close(()=>resolveClose()))
   const cleanup={fixtureRunnerDisconnected:!nativeHost.connected,httpListenerClosed:!http.listening,serverWebSocketsClosed:wsServer.clients.size===0};assert.ok(Object.values(cleanup).every(Boolean));hostReport.cases.at(-1).cleanup=cleanup
  }
 }
}
report.conclusion='The unchanged packed first-result consumer sends a real cancel frame. With a controlled delayed item-send acknowledgement while the native server is active, that frame aborts the operation after direct CLI-result settlement; unchanged process binding requests SIGTERM, unchanged WindowsJobOwner sends terminate IPC, and unchanged runner state calls the injected terminateJob. Draining terminal avoids cancel. If the server already removed the stream, the same late cancel is ignored and a fixture nonempty Job keeps the runner pending. No real Windows Job membership, browser closure, or incident causality is established.'
writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify({hosts:report.hosts.map(h=>({version:h.version,cases:h.cases.map(c=>({mode:c.mode,...c.observedBeforeFixtureCleanup}))})),platformAccessed:false,realWindowsJobExecuted:false,browserExecuted:false},null,2))
