// Integrity/preparation only; never starts a Host, GUI or platform connection.
import assert from 'node:assert/strict'
import {readFileSync,readdirSync,lstatSync,mkdtempSync,rmSync} from 'node:fs'
import {createHash} from 'node:crypto'
import {dirname,join,relative,isAbsolute,resolve} from 'node:path'
import {tmpdir} from 'node:os'
import {fileURLToPath} from 'node:url'
import {runTar} from './portable-tar.mjs'
export const kit=dirname(fileURLToPath(import.meta.url))
export const read=p=>JSON.parse(readFileSync(p,'utf8').replace(/^\uFEFF/,''))
export const sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
export function inventory(root){
 const found={}
 function walk(dir){for(const entry of readdirSync(dir,{withFileTypes:true})){
  const p=join(dir,entry.name);assert(!lstatSync(p).isSymbolicLink(),'Unexpected link: '+p)
  if(entry.isDirectory())walk(p);else{assert(entry.isFile());found[relative(root,p).replaceAll('\\','/')]=sha(p)}
 }}walk(root);return Object.fromEntries(Object.entries(found).sort(([a],[b])=>a.localeCompare(b)))
}
export function matches(root,expected){assert.deepEqual(inventory(root),Object.fromEntries(Object.entries(expected).sort(([a],[b])=>a.localeCompare(b))))}
export function unpack(archive,dest){
 for(const n of runTar(['-tf',archive]).trim().split(/\r?\n/))assert(n.startsWith('package/')&&!n.includes('\\')&&!n.split('/').includes('..'),'Unsafe tar member')
 runTar(['-xf',archive,'-C',dest])
}
export function verify(){
 const wanted=read(join(kit,'KIT-FILES.json')),actual=inventory(kit);delete actual['KIT-FILES.json'];assert.deepEqual(actual,wanted,'Keep output outside frozen kit')
 const inputs=read(join(kit,'INPUTS.json'));assert.equal(inputs.ciRun,null);assert.equal(inputs.formalAcceptanceEligible,false)
 assert.deepEqual(inputs.packages.map(x=>x.role),['plugin32','mcpRc3']);const results=[]
 for(const p of inputs.packages){
  const file=join(kit,p.path);assert.equal(sha(file),p.sha256);assert.equal(readFileSync(file).length,p.bytes)
  const expected=read(join(kit,p.filesManifest));assert.equal(Object.keys(expected).length,p.fileCount)
  const temp=mkdtempSync(join(tmpdir(),'bkn-profile-input-'))
  try{unpack(file,temp);matches(join(temp,'package'),expected);assert.equal(read(join(temp,'package/package.json')).version,p.version)}finally{rmSync(temp,{recursive:true,force:true})}
  results.push({role:p.role,filesMatched:p.fileCount})
 }
 return {inputVerification:'PASS',kitFilesMatched:Object.keys(wanted).length,packages:results,windowsRuntimeExecution:'NOT_RUN',hostStarted:false,ciRun:null,formalAcceptanceEligible:false}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){assert.equal(process.argv.length,2);console.log(JSON.stringify(verify(),null,2))}
