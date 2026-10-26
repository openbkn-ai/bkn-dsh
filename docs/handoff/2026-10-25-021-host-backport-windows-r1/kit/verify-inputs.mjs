// Fixed preparation inputs only. Does not install, start a Host, sign, log in or contact any platform.
import assert from 'node:assert/strict'
import {readFileSync,readdirSync,mkdtempSync,lstatSync,rmSync} from 'node:fs'
import {createHash} from 'node:crypto'
import {dirname,join,relative,resolve,isAbsolute} from 'node:path'
import {tmpdir} from 'node:os'
import {fileURLToPath} from 'node:url'
import {parseArgs} from 'node:util'
import {runTar} from './portable-tar.mjs'
import {requireGuiArtifact} from './gui-contract.mjs'
const {values}=parseArgs({options:{'require-gui':{type:'boolean'}}}),kit=dirname(fileURLToPath(import.meta.url)),read=p=>JSON.parse(readFileSync(p)),sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex'),wanted=read(join(kit,'KIT-FILES.json')),actual=[]
function walk(dir,root,callback){for(const entry of readdirSync(dir,{withFileTypes:true})){const path=join(dir,entry.name);assert(!lstatSync(path).isSymbolicLink(),'Kit/package links not admitted');if(entry.isDirectory())walk(path,root,callback);else{assert(entry.isFile());callback(relative(root,path).replaceAll('\\','/'),path)}}}
walk(kit,kit,(name,path)=>{if(name!=='KIT-FILES.json')actual.push(name)});assert.deepEqual(actual.sort(),Object.keys(wanted).sort(),'Keep receipts outside the frozen kit')
for(const [name,hash] of Object.entries(wanted)){const file=resolve(kit,name),rel=relative(kit,file);assert(rel&&!rel.startsWith('..')&&!isAbsolute(rel));assert.equal(sha(file),hash,'Input changed: '+name)}
const inputs=read(join(kit,'INPUTS.json'));assert.equal(inputs.formalAcceptanceEligible,false);assert.equal(inputs.ciRun,null);assert.equal(inputs.autoLaunchHostOrLogin,false);const packages=[]
for(const p of inputs.packages){const file=join(kit,p.path);assert.equal(sha(file),p.sha256);assert.equal(readFileSync(file).length,p.bytes);const expected=read(join(kit,p.filesManifest));assert.equal(Object.keys(expected).length,p.fileCount);const dir=mkdtempSync(join(tmpdir(),'bkn-backport-input-'));try{const names=runTar(['-tf',file]).trim().split(/\r?\n/);for(const n of names)assert(n.startsWith('package/')&&!n.includes('\\')&&!n.split('/').includes('..'),'Unsafe tar path');runTar(['-xf',file,'-C',dir]);const files=[];walk(join(dir,'package'),join(dir,'package'),(name,path)=>{files.push(name);assert.equal(sha(path),expected[name],'Payload mismatch '+name)});assert.deepEqual(files.sort(),Object.keys(expected).sort());assert.equal(read(join(dir,'package/package.json')).version,p.version);packages.push({role:p.role,filesMatched:files.length,version:p.version})}finally{rmSync(dir,{recursive:true,force:true})}}
const gui=read(join(kit,'GUI-ARTIFACTS.json')),blocked=[];for(const [base,receipt] of Object.entries(gui)){try{requireGuiArtifact(receipt)}catch{blocked.push(base+': independent signed GUI artifact is not supplied')}}
console.log(JSON.stringify({kitFilesMatched:Object.keys(wanted).length,packages,inputVerification:'PASS',executionAuthorized:false,guiReady:blocked.length===0,blocked,ciRun:null,formalAcceptanceEligible:false},null,2));if(values['require-gui']&&blocked.length)process.exitCode=2
