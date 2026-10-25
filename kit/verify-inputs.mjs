// Preparation integrity only. No Host, GUI, browser, credentials or platform access.
import assert from 'node:assert/strict'
import {readFileSync,readdirSync,mkdtempSync,lstatSync,rmSync} from 'node:fs'
import {createHash} from 'node:crypto'
import {dirname,join,relative,resolve,isAbsolute} from 'node:path'
import {tmpdir} from 'node:os'
import {fileURLToPath} from 'node:url'
import {parseArgs} from 'node:util'
import {runTar} from './portable-tar.mjs'

parseArgs({options:{}})
const kit=dirname(fileURLToPath(import.meta.url))
const read=p=>JSON.parse(readFileSync(p,'utf8'))
const sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
function walk(dir,root,callback){
 for(const entry of readdirSync(dir,{withFileTypes:true})){
  const path=join(dir,entry.name)
  assert(!lstatSync(path).isSymbolicLink(),'Kit/package links not admitted')
  if(entry.isDirectory())walk(path,root,callback)
  else {assert(entry.isFile());callback(relative(root,path).replaceAll('\\','/'),path)}
 }
}
const wanted=read(join(kit,'KIT-FILES.json')),actual=[]
walk(kit,kit,(name)=>{if(name!=='KIT-FILES.json')actual.push(name)})
assert.deepEqual(actual.sort(),Object.keys(wanted).sort(),'Keep receipts outside the frozen kit')
for(const [name,hash] of Object.entries(wanted)){
 const file=resolve(kit,name),rel=relative(kit,file)
 assert(rel&&!rel.startsWith('..')&&!isAbsolute(rel),'Unsafe manifest path')
 assert.equal(sha(file),hash,'Input changed: '+name)
}
const inputs=read(join(kit,'INPUTS.json'))
assert.equal(inputs.formalAcceptanceEligible,false)
assert.equal(inputs.ciRun,null)
assert.equal(inputs.autoLaunchHostOrLogin,false)
assert.equal(inputs.requiresGuiArtifact,false)
assert.equal(inputs.requiresProductionSigning,false)
assert.equal(inputs.requiresWLifeOrChrome,false)
assert.deepEqual(inputs.packages.map(p=>p.role),['plugin32','mcpOld','mcpRc3'])
const packages=[]
for(const p of inputs.packages){
 const file=join(kit,p.path)
 assert.equal(sha(file),p.sha256,'Package digest: '+p.role)
 assert.equal(readFileSync(file).length,p.bytes)
 const expected=read(join(kit,p.filesManifest))
 assert.equal(Object.keys(expected).length,p.fileCount)
 const dir=mkdtempSync(join(tmpdir(),'bkn-backport-input-'))
 try{
  const names=runTar(['-tf',file]).trim().split(/\r?\n/)
  for(const n of names)assert(n.startsWith('package/')&&!n.includes('\\')&&!n.split('/').includes('..'),'Unsafe tar path')
  runTar(['-xf',file,'-C',dir])
  const files=[]
  walk(join(dir,'package'),join(dir,'package'),(name,path)=>{files.push(name);assert.equal(sha(path),expected[name],'Payload mismatch '+name)})
  assert.deepEqual(files.sort(),Object.keys(expected).sort())
  assert.equal(read(join(dir,'package/package.json')).version,p.version)
  packages.push({role:p.role,filesMatched:files.length,version:p.version})
 }finally{rmSync(dir,{recursive:true,force:true})}
}
console.log(JSON.stringify({
 kitFilesMatched:Object.keys(wanted).length,packages,inputVerification:'PASS',
 nonGuiInputsReady:true,hostStartedByVerifier:false,
 prerequisitesRemoved:['independent GUI','production signing','W-LIFE','daily Chrome identity','real CLI login'],
 remainingPrerequisites:inputs.runtimePrerequisites,
 windowsRuntimeExecution:'NOT_RUN',guiAcceptance:'OUT_OF_SCOPE',
 ciRun:null,formalAcceptanceEligible:false,
},null,2))
