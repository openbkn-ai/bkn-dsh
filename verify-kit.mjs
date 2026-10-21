// Read-only, portable verifier. Local preparation is never final CI acceptance.
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {existsSync,mkdtempSync,readFileSync,readdirSync,realpathSync,rmSync,statSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {dirname,join,relative,resolve,isAbsolute} from 'node:path'
import {fileURLToPath} from 'node:url'
import {spawnSync} from 'node:child_process'
import {createRequire} from 'node:module'
import {parseArgs} from 'node:util'
const kit=dirname(fileURLToPath(import.meta.url))
const {values}=parseArgs({options:{tarball:{type:'string'},installed:{type:'string'},runtime:{type:'string'},host:{type:'string'},'kit-only':{type:'boolean'}}})
const sha=b=>createHash('sha256').update(b).digest('hex')
const inventory=JSON.parse(readFileSync(join(kit,'KIT-FILES.json'),'utf8'))
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
  const entries=spawnSync('tar',['-tf',tarball],{encoding:'utf8'});assert.equal(entries.status,0,'tar list failed')
  for(const name of entries.stdout.trim().split(/\r?\n/))assert.ok(name.startsWith('package/')&&!name.split('/').includes('..'),'Unexpected tar path')
  const unpack=spawnSync('tar',['-xf',tarball,'-C',temp],{encoding:'utf8'});assert.equal(unpack.status,0,'tar extraction failed')
  report.candidate=checkPackage(join(temp,'package'))
 }finally{rmSync(temp,{recursive:true,force:true})}
 const sdk=JSON.parse(readFileSync(join(kit,'sdk-manifest.json'),'utf8')),sdkPath=join(kit,sdk.file)
 assert.equal(sha(readFileSync(sdkPath)),sdk.sha256,'Official SDK SHA mismatch')
 assert.equal('sha512-'+createHash('sha512').update(readFileSync(sdkPath)).digest('base64'),sdk.integrity,'Official registry SDK integrity mismatch')
 report.sdk={version:sdk.version,officialRegistryIntegrityMatched:true}
 if(values.installed)report.installed=checkPackage(values.installed)
}
if(values.runtime){
 assert.ok(['0.2.0-rc.2','0.2.1-rc.2'].includes(values.host),'--host exact version required with --runtime')
 const runtime=resolve(values.runtime),seen=new Set(),found=new Map(),anchor=createRequire(join(runtime,'package.json'))
 const cordis=realpathSync(anchor.resolve('@deepseek-ai/cordis/package.json'))
 const cordisVersion=JSON.parse(readFileSync(cordis)).version
 assert.equal(cordisVersion,values.host==='0.2.0-rc.2'?'4.0.4':'4.0.5','Unexpected Cordis baseline')
 const schema=realpathSync(anchor.resolve('@deepseek-ai/schemastery/package.json'))
 const schemaVersion=JSON.parse(readFileSync(schema)).version
 assert.equal(schemaVersion,values.host==='0.2.0-rc.2'?'3.18.4':'3.18.5','Unexpected Schemastery baseline')
 const zodVersion=JSON.parse(readFileSync(anchor.resolve('zod/package.json'))).version
 assert.equal(zodVersion,'4.4.3','Unexpected Zod baseline')
 function visit(file){
  file=realpathSync(file);if(seen.has(file))return;seen.add(file)
  const p=JSON.parse(readFileSync(file)),req=createRequire(file)
  if(p.name==='@deepseek-ai/dsh'||p.name?.startsWith('@deepseek-ai/dsh-')){
   assert.equal(p.version,values.host,`Mixed DSH: ${p.name}`);found.set(p.name,p.version)
  }
  if(p.dependencies?.['@deepseek-ai/cordis']||p.peerDependencies?.['@deepseek-ai/cordis'])assert.equal(realpathSync(req.resolve('@deepseek-ai/cordis/package.json')),cordis,`Split Cordis: ${p.name}`)
  if(p.dependencies?.['@deepseek-ai/schemastery']||p.peerDependencies?.['@deepseek-ai/schemastery'])assert.equal(realpathSync(req.resolve('@deepseek-ai/schemastery/package.json')),schema,`Split Schemastery: ${p.name}`)
  if(p.dependencies?.zod||p.peerDependencies?.zod)assert.equal(JSON.parse(readFileSync(req.resolve('zod/package.json'))).version,'4.4.3',`Unexpected DSH Zod: ${p.name}`)
  for(const name of Object.keys({...p.dependencies,...p.peerDependencies})){
   if(!name.startsWith('@deepseek-ai/dsh')&&!name.startsWith('@deepseek-ai/cordis'))continue
   if(p.peerDependenciesMeta?.[name]?.optional){let target;try{target=req.resolve(name+'/package.json')}catch{continue}visit(target)}
   else visit(req.resolve(name+'/package.json'))
  }
 }
 visit(join(runtime,'package.json'));assert.ok(found.has('@deepseek-ai/dsh'),'Runtime does not load official DSH')
 report.runtime={host:values.host,dshPackages:found.size,cordis:cordisVersion,schemastery:schemaVersion,zod:zodVersion,noMixedDsh:true,noSplitCordis:true,noSplitSchemastery:true}
}
console.log(JSON.stringify(report,null,2))
