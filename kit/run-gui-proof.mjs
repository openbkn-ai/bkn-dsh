// One existing official Windows rc3 GUI, one new profile, one synthetic connection.
import assert from 'node:assert/strict'
import {createServer} from 'node:http'
import {spawn,spawnSync} from 'node:child_process'
import {readFileSync,writeFileSync,mkdirSync,renameSync,rmSync,cpSync,realpathSync,existsSync,openSync,closeSync} from 'node:fs'
import {resolve,join,dirname,relative,isAbsolute,sep} from 'node:path'
import {pathToFileURL,fileURLToPath} from 'node:url'
import {parseArgs} from 'node:util'
import {kit,read,sha,inventory,matches,unpack,verify} from './verify-inputs.mjs'
const sleep=ms=>new Promise(r=>setTimeout(r,ms))
const save=(p,d)=>writeFileSync(p,JSON.stringify(d,null,2)+'\n')
const within=(base,file)=>{const r=relative(base,file);return r===''||(!r.startsWith('..'+sep)&&r!=='..'&&!isAbsolute(r))}
export function prepare(taskRoot,zodDir){
 assert(isAbsolute(taskRoot)&&isAbsolute(zodDir),'Use absolute taskRoot and existing Zod directory')
 assert(!within(dirname(kit),taskRoot),'Keep task state and evidence outside the checkout')
 assert(!existsSync(taskRoot),'Retain earlier attempts; select a new task root')
 zodDir=realpathSync(zodDir);assert.equal(read(join(zodDir,'package.json')).version,'4.4.3')
 const sourceZod=inventory(zodDir),inputs=read(join(kit,'INPUTS.json')),home=join(taskRoot,'home'),profile=join(home,'profiles/desktop')
 mkdirSync(profile,{recursive:true});const installed=join(profile,'node_modules/@openbkn/dsh-business-context'),mcp=join(profile,'node_modules/@deepseek-ai/dsh-mcp-client')
 for(const p of inputs.packages){
  const temp=join(taskRoot,'.unpack-'+p.role);mkdirSync(temp);unpack(join(kit,p.path),temp)
  const dest=p.role==='plugin32'?installed:mcp;mkdirSync(dirname(dest),{recursive:true});renameSync(join(temp,'package'),dest);rmSync(temp,{recursive:true})
  matches(dest,read(join(kit,p.filesManifest)))
 }
 const zod=join(profile,'node_modules/zod');cpSync(zodDir,zod,{recursive:true,dereference:true});matches(zod,sourceZod);matches(zodDir,sourceZod)
 const dependencies={'@openbkn/dsh-business-context':pathToFileURL(join(kit,inputs.packages[0].path)).href,'@deepseek-ai/dsh-mcp-client':pathToFileURL(join(kit,inputs.packages[1].path)).href,zod:'4.4.3'}
 save(join(profile,'package.json'),{name:'dsh-profile-desktop',private:true,dependencies,dsh:{profile:{bundles:['@deepseek-ai/dsh-base','@deepseek-ai/dsh-web-app','@openbkn/dsh-business-context']}}})
 writeFileSync(join(profile,'cordis.yml'),'[]\n');writeFileSync(join(profile,'pnpm-workspace.yaml'),'nodeLinker: hoisted\nautoInstallPeers: false\n')
 for(const name of ['empty-cli-config','electron-user-data','tmp','evidence'])mkdirSync(join(taskRoot,name))
 const row={home,profile,installed,mcp,zod,taskRoot,zodSourceDir:zodDir,zodSourceFiles:Object.keys(sourceZod).length,zodSourceInventory:sourceZod}
 save(join(taskRoot,'evidence/preparation-private.json'),row);return row
}
async function main(){
 const {values}=parseArgs({options:{'task-root':{type:'string'},'zod-dir':{type:'string'},exe:{type:'string'},'prepare-only':{type:'boolean',default:false}}})
 assert(values['task-root']&&values['zod-dir'],'Required: --task-root <new absolute path> --zod-dir <existing 4.4.3 package>')
 const checked=verify();console.log(JSON.stringify(checked))
 if(!values['prepare-only']){assert.equal(process.platform,'win32','GUI execution is Windows only');assert(values.exe,'Required --exe <existing official rc3 exe>')}
 const row=prepare(values['task-root'],values['zod-dir']),evidence=join(row.taskRoot,'evidence'),inputs=read(join(kit,'INPUTS.json'))
 if(values['prepare-only']){console.log(JSON.stringify({preparation:'PASS',hostStarted:false,taskRoot:row.taskRoot}));return}
 const exe=realpathSync(values.exe);assert.equal(sha(exe),inputs.officialWindowsExeSha256,'Use the existing verified official Windows rc3 executable; no replacement or download')
 const baseEnv={}
 for(const key of ['OS','SystemRoot','WINDIR','ComSpec','PATH','PATHEXT','USERPROFILE','HOMEDRIVE','HOMEPATH','APPDATA','LOCALAPPDATA','USERNAME','USERDOMAIN','PROGRAMDATA','PROGRAMFILES','PROGRAMFILES(X86)'])if(process.env[key]!==undefined)baseEnv[key]=process.env[key]
 Object.assign(baseEnv,{DSH_HOME:row.home,BKN_CONFIG_DIR:join(row.taskRoot,'empty-cli-config'),TEMP:join(row.taskRoot,'tmp'),TMP:join(row.taskRoot,'tmp')})
 const powershell=join(baseEnv.SystemRoot,'System32/WindowsPowerShell/v1.0/powershell.exe'),associationRoot=join(evidence,'system-association')
 function associations(phase){
  const p=spawnSync(powershell,['-NoProfile','-File',join(kit,'system-association.ps1'),'-Phase',phase,'-EvidenceRoot',associationRoot,'-DesktopExe',exe],{env:baseEnv,encoding:'utf8',windowsHide:true})
  writeFileSync(join(evidence,'association-'+phase.toLowerCase()+'-private.log'),(p.stdout??'')+(p.stderr??''));assert.equal(p.status,0,'Association '+phase+' failed; preserve originals; do not bypass execution policy, permissions or UserChoice protection')
 }
 function inspect(){
  const p=spawnSync(exe,['--expose-internals',join(kit,'inspect-official.mjs')],{env:{...baseEnv,ELECTRON_RUN_AS_NODE:'1'},encoding:'utf8',windowsHide:true})
  writeFileSync(join(evidence,'identity-inspection-last-private.log'),(p.stdout??'')+(p.stderr??''));assert.equal(p.status,0,'Official runtime identity check failed');return JSON.parse(p.stdout.trim())
 }
 const original=inspect();save(join(evidence,'official-before-private.json'),original)
 const requests=[];let child,exit,failure,backupComplete=false,restored=false;const output=join(evidence,'business-autoload-private.json')
 const server=createServer(async(req,res)=>{try{
  let raw='';for await(const chunk of req)raw+=chunk;const msg=raw?JSON.parse(raw):null,path=new URL(req.url,'http://127.0.0.1').pathname
  requests.push({path,method:req.method,rpc:msg?.method??null,syntheticAuth:req.headers.authorization==='Bearer synthetic-profile-proof-only'})
  if(msg?.method==='tools/call'){res.writeHead(403).end();return}
  if(path==='/api/bkn-backend/v1/knowledge-networks'){res.writeHead(200,{'content-type':'application/json'}).end(JSON.stringify({entries:[{id:'synthetic-kn',name:'Local synthetic fixture'}]}));return}
  if(path!=='/mcp'){res.writeHead(404).end();return}
  if(req.method==='GET'){res.writeHead(405).end();return}if(req.method==='DELETE'){res.writeHead(200).end();return}
  if(msg?.id===undefined){res.writeHead(202).end();return}
  const result=msg.method==='initialize'?{protocolVersion:msg.params.protocolVersion,capabilities:{tools:{}},serverInfo:{name:'synthetic-profile-proof',version:'1'}}:msg.method==='tools/list'?{tools:[{name:'bkn_start_interaction',description:'Synthetic registration only; never executed',inputSchema:{type:'object'}}]}:{}
  res.writeHead(200,{'content-type':'application/json',...(msg.method==='initialize'?{'mcp-session-id':'synthetic-profile-session'}:{})}).end(JSON.stringify({jsonrpc:'2.0',id:msg.id,result}))
 }catch{res.writeHead(500).end()}})
 try{
  await new Promise(r=>server.listen(0,'127.0.0.1',r));const baseUrl='http://127.0.0.1:'+server.address().port
  save(join(row.profile,'cordis.patch.yml'),[{id:'openbkn-business-context',config:{baseUrl,mcpUrl:baseUrl+'/mcp',cliPath:join(row.taskRoot,'never-executed-cli.exe'),requestTimeoutMs:3000,toolCallTimeoutMs:3000}},{insert:[{id:'frozen32-profile-observer',name:join(kit,'business-autoload.probe.mjs').replaceAll('\\','/')}]}])
  associations('Before');backupComplete=true
  const before=read(join(associationRoot,'before/snapshot.json'));assert.equal(before.Complete,true);assert.equal(before.Exports.length,2)
  const env={...baseEnv,DSH_PROOF_INSTALLED:row.installed,DSH_PROOF_PROFILE:row.profile,DSH_PROOF_OUTPUT:output},fd=openSync(join(evidence,'gui-host-private.log'),'w')
  child=spawn(exe,['--user-data-dir='+join(row.taskRoot,'electron-user-data')],{cwd:row.home,env,stdio:['ignore',fd,fd]});closeSync(fd)
  child.on('error',e=>{failure={name:e.name,message:e.message}});child.on('exit',(code,signal)=>{exit={code,signal}})
  save(join(evidence,'owned-launch-private.json'),{pid:child.pid,launchRequestedUtc:new Date().toISOString(),exe,home:row.home,userData:join(row.taskRoot,'electron-user-data')})
  console.log(JSON.stringify({phase:'official-gui-started',pid:child.pid,backupComplete:true,next:'Capture actual PID/UTC creation/exe/children; observe one window; await autoload result; normal menu Quit.'}))
  for(let i=0;i<480&&!existsSync(output)&&exit===undefined&&!failure;i++)await sleep(250)
  assert(existsSync(output),'Observer result missing; keep logs and close only the owned GUI; do not start a second instance to obtain PASS')
  const proof=read(output);console.log(JSON.stringify({phase:'real-business-autoload-result',result:proof.result,profileOverrideAutomatic:proof.profileOverrideAutomatic,managerIdentity:proof.managerFiberUsesSelectedModule,next:'Normal official menu Quit once; record the observed window and menu action.'}))
  for(let i=0;i<1200&&exit===undefined&&!failure;i++)await sleep(250)
  assert.deepEqual(exit,{code:0,signal:null},'No normal exit0 observed; identity-check owned cleanup and report failure separately')
  assert.equal(proof.result,'PASS','Real business autoload failed; do not change frozen package or resolver')
  assert(requests.some(x=>x.rpc==='tools/list'));assert(requests.some(x=>x.path==='/api/bkn-backend/v1/knowledge-networks'&&x.syntheticAuth));assert(!requests.some(x=>x.rpc==='tools/call'))
 }catch(error){failure??={name:error.name,message:error.message};process.exitCode=1}
 finally{
  server.closeAllConnections();await new Promise(r=>server.close(r))
  if(backupComplete&&(!child||exit!==undefined)){
   try{associations('After');associations('Restore');restored=true}catch(error){failure??={name:error.name,message:error.message};process.exitCode=1}
  }
  let preservation
  try{const after=inspect();save(join(evidence,'official-after-private.json'),after);assert.deepEqual(after,original);assert.equal(sha(exe),inputs.officialWindowsExeSha256)
   for(const p of inputs.packages)matches(p.role==='plugin32'?row.installed:row.mcp,read(join(kit,p.filesManifest)))
   matches(row.zod,row.zodSourceInventory);matches(row.zodSourceDir,row.zodSourceInventory);preservation='PASS'
  }catch(error){preservation='FAIL';failure??={name:error.name,message:error.message};process.exitCode=1}
  const summary={kind:'local-development-preacceptance',ciRun:null,formalAcceptanceEligible:false,failure,normalExit:exit??null,ownedPid:child?.pid??null,ownedGuiStillNeedsCleanup:!!child&&exit===undefined,systemAssociationBackupComplete:backupComplete,systemAssociationRestoredAndVerified:restored,officialAppAndFrozenFilesPreservation:preservation,fixtureListenersClosed:!server.listening,requests,scope:'Only frozen32 real business/profile autoload and one official rc3 GUI startup/normal exit; no vectors/UI/login/B1/platform/model/Sandbox'}
  save(join(evidence,'summary-private.json'),summary);console.log(JSON.stringify(summary))
 }
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))await main()
