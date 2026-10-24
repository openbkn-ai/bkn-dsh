// Read-only, portable verifier. Local preparation is never final CI acceptance.
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {mkdtempSync,readFileSync,readdirSync,rmSync,statSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {dirname,join,relative,resolve,isAbsolute} from 'node:path'
import {fileURLToPath} from 'node:url'
import {parseArgs} from 'node:util'
import {runTar} from './portable-tar.mjs'
import {inspectProfileClosure} from './profile-closure.mjs'
const kit=dirname(fileURLToPath(import.meta.url))
const {values}=parseArgs({options:{tarball:{type:'string'},installed:{type:'string'},runtime:{type:'string'},host:{type:'string'},profile:{type:'string'},'kit-only':{type:'boolean'}}})
assert.ok(!values.profile||values.runtime,'--profile requires --runtime')
assert.ok(!values.profile||!values['kit-only'],'Actual profile checks require package inventory verification')
if(values.profile&&!values.installed)values.installed=join(values.profile,'node_modules','@openbkn','dsh-business-context')
const sha=b=>createHash('sha256').update(b).digest('hex')
const inventory=JSON.parse(readFileSync(join(kit,'KIT-FILES.json'),'utf8'))
const actualKitFiles=[]
function listKit(dir){for(const entry of readdirSync(dir,{withFileTypes:true})){
 const path=join(dir,entry.name)
 if(entry.isDirectory())listKit(path)
 else {assert.ok(entry.isFile(),'Kit contains a link or special entry');const name=relative(kit,path).split('\\').join('/');if(name!=='KIT-FILES.json')actualKitFiles.push(name)}
}}
listKit(kit)
assert.deepEqual(actualKitFiles.sort(),Object.keys(inventory).sort(),'Unexpected or missing kit files; keep outputs outside the frozen kit')
for(const [name,hash] of Object.entries(inventory)){
 const target=resolve(kit,name),rel=relative(kit,target)
 assert.ok(rel && !rel.startsWith('..') && !isAbsolute(rel),'Unsafe kit entry')
 assert.equal(sha(readFileSync(target)),hash,`Kit file mismatch: ${name}`)
}
const candidate=JSON.parse(readFileSync(join(kit,'candidate-manifest.json'),'utf8'))
assert.equal(candidate.kind,'local-development-preacceptance')
assert.equal(candidate.ciRun,null)
assert.equal(candidate.formalAcceptanceEligible,false)
const filesRaw=readFileSync(join(kit,'candidate-files.json'))
assert.equal(sha(filesRaw),candidate.filesManifestSha256)
const files=JSON.parse(filesRaw.toString())
assert.equal(Object.keys(files).length,candidate.fileCount)
const report={kitFilesVerified:Object.keys(inventory).length,kind:candidate.kind,formalAcceptanceEligible:false,ciRun:null}
function checkPackage(root){
 root=resolve(root)
 const actual=[]
 function walk(dir){for(const entry of readdirSync(dir,{withFileTypes:true})){
  if(entry.name==='node_modules')continue
  const path=join(dir,entry.name)
  if(entry.isDirectory())walk(path)
  else {assert.ok(entry.isFile(),'Unexpected package link or special entry');actual.push(relative(root,path).split('\\').join('/'))}
 }}
 walk(root)
 assert.deepEqual(actual.sort(),Object.keys(files).sort(),'Package inventory differs')
 for(const [name,hash] of Object.entries(files))assert.equal(sha(readFileSync(join(root,name))),hash,`Package file mismatch: ${name}`)
 assert.equal(JSON.parse(readFileSync(join(root,'package.json'))).version,candidate.version)
 return {root,matched:actual.length,version:candidate.version}
}
if(!values['kit-only']){
 const tarball=resolve(values.tarball??join(kit,candidate.file))
 assert.equal(sha(readFileSync(tarball)),candidate.sha256,'Tarball SHA mismatch')
 assert.equal(statSync(tarball).size,candidate.bytes,'Tarball size mismatch')
 const temp=mkdtempSync(join(tmpdir(),'bkn021-verify-'))
 try{
  const entries=runTar(['-tf',tarball])
  for(const name of entries.trim().split(/\r?\n/))assert.ok(name.startsWith('package/')&&!name.split('/').includes('..')&&!name.includes('\\'),'Unexpected tar path')
  runTar(['-xf',tarball,'-C',temp])
  report.candidate=checkPackage(join(temp,'package'))
 }finally{rmSync(temp,{recursive:true,force:true})}
 const sdk=JSON.parse(readFileSync(join(kit,'sdk-manifest.json'),'utf8')),sdkPath=join(kit,sdk.file)
 assert.equal(sha(readFileSync(sdkPath)),sdk.sha256,'Official SDK SHA mismatch')
 assert.equal('sha512-'+createHash('sha512').update(readFileSync(sdkPath)).digest('base64'),sdk.integrity,'Official registry SDK integrity mismatch')
 report.sdk={version:sdk.version,officialRegistryIntegrityMatched:true}
 if(values.installed)report.installed=checkPackage(values.installed)
}
if(values.runtime){
 report.runtime=await inspectProfileClosure(values)
 if(values.profile)assert.equal(report.runtime.pluginVersion,candidate.version,'Profile loads a different plugin version')
}
console.log(JSON.stringify(report,null,2))
