import {readFileSync,writeFileSync,existsSync,openSync,closeSync} from 'node:fs'
import {spawn,spawnSync} from 'node:child_process'
import {resolve,join} from 'node:path'
import assert from 'node:assert/strict'
const task=resolve('release/local-58'),row=JSON.parse(readFileSync(join(task,'identities-private.json'))).find(x=>x.id===process.argv[2]);assert(row,'Explicit new task identity required');const output=join(row.run,'actual-auth-proof-private.json'),fd=openSync(join(row.run,'host-private.log'),'w'),desktop=row.profile==='desktop'
const env={HOME:process.env.HOME,PATH:desktop?'/usr/bin:/bin:/usr/sbin:/sbin':join(row.hostRoot,'bin')+':/usr/bin:/bin:/usr/sbin:/sbin',LANG:'en_US.UTF-8',TMPDIR:row.run,NODE_EXTRA_CA_CERTS:resolve('../test-deploy/tls/ca.crt'),DSH_HOME:row.home,BKN_CONFIG_DIR:row.cliConfig,LOCAL58_OUTPUT:output,LOCAL58_RUNTIME:row.runtime,LOCAL58_INSTALLED:row.installed,LOCAL58_NODE:row.node,LOCAL58_FORM:row.form,LOCAL58_HOST:row.baseHostVersion,...(desktop?{ELECTRON_RUN_AS_NODE:'1'}:{})}
const args=desktop?['--expose-internals',row.hostEntry,row.runtime,row.profileDir,row.primaryRuntime]:['--home',row.home,'--profile','web','--host','127.0.0.1','--port','0','--no-open'];const child=spawn(row.executable,args,{cwd:row.home,env,stdio:desktop?['ignore',fd,fd,'ipc']:['ignore',fd,fd]});closeSync(fd);let exit,ready=false;child.on('exit',(code,signal)=>{exit={code,signal}});child.on('message',msg=>{if(msg?.type==='ready'){ready=true;writeFileSync(join(row.run,'desktop-ready-private.json'),JSON.stringify(msg))}})
const processInfo=spawnSync('/bin/ps',['-p',String(child.pid),'-o','lstart=','-o','comm='],{encoding:'utf8'});writeFileSync(join(row.run,'owned-process-private.json'),JSON.stringify({id:row.id,pid:child.pid,startedAt:new Date().toISOString(),osIdentity:processInfo.stdout.trim(),executable:row.executable,home:row.home,cliConfig:row.cliConfig},null,2)+'\n')
let result
try{
 let last
 for(let i=0;i<1300&&exit===undefined;i++){
  if(existsSync(output)){const state=JSON.parse(readFileSync(output));if(state.phase!==last){last=state.phase;console.log(JSON.stringify({id:row.id,phase:last,...(state.result?{result:state.result}:{})}))}if(state.phase==='complete'||state.phase==='failed'){result=state;break}}
  await new Promise(r=>setTimeout(r,200))
 }
 assert(result,'No terminal proof from the new isolated Host');assert.equal(result.result,'PASS','Actual profile/auth proof failed; preserve private evidence')
 if(desktop){for(let i=0;i<100&&!ready&&exit===undefined;i++)await new Promise(r=>setTimeout(r,50));assert(ready,'Desktop backend must have emitted ready IPC')}
 console.log(JSON.stringify({id:row.id,result:result.result,loadedComponents:result.loadedEntries.length,networkCount:result.rows.find(x=>x.stage==='beginLogin').networkCount,actualMcpEntrySha256:result.actualMcpEntrySha256,desktopReady:desktop?ready:null}))
}catch(error){process.exitCode=1;console.log(JSON.stringify({id:row.id,error:error.message}))}
finally{
 if(exit===undefined){if(desktop&&child.connected)child.send({type:'shutdown'});else child.kill('SIGTERM')}
 for(let i=0;i<100&&exit===undefined;i++)await new Promise(r=>setTimeout(r,50))
 if(exit===undefined){child.kill('SIGTERM');for(let i=0;i<100&&exit===undefined;i++)await new Promise(r=>setTimeout(r,50))}
 assert(exit,'Owned Host failed to exit; preserve identity and investigate');writeFileSync(join(row.run,'cleanup.json'),JSON.stringify({pid:child.pid,exit,exited:true,method:desktop?'official Desktop shutdown IPC':'owned subprocess SIGTERM'},null,2)+'\n')
}
