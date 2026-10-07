// Prepare a standalone controlled probe without changing the installed Host/profile.
import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
import {createHash} from 'node:crypto'
import {mkdirSync,readFileSync,copyFileSync,symlinkSync} from 'node:fs'
import {resolve,dirname,join,relative,isAbsolute} from 'node:path'
import {parseArgs} from 'node:util'
const {values}=parseArgs({options:Object.fromEntries(['runtime','plugin','work','files'].map(k=>[k,{type:'string'}]))})
for(const k of ['runtime','plugin','work','files']) assert.ok(values[k],`--${k} is required`)
const runtime=resolve(values.runtime), source=resolve(values.plugin), work=resolve(values.work)
const official=JSON.parse(readFileSync(join(runtime,'package.json'),'utf8'))
assert.equal(official.name,'@deepseek-ai/dsh');assert.equal(official.version,'0.2.0-rc.2')
const req=createRequire(join(runtime,'package.json'))
const files=JSON.parse(readFileSync(values.files,'utf8')).files
const digest=file=>createHash('sha256').update(readFileSync(file)).digest('hex')
// Refuse reuse: symlinks and copies only live inside this new probe directory.
mkdirSync(work)
const target=join(work,'package');mkdirSync(target)
for(const file of files){
 assert.ok(file.path.startsWith('package/'))
 const name=file.path.slice('package/'.length), from=resolve(source,name), to=resolve(target,name)
 for(const [root,path] of [[source,from],[target,to]]) {
  const rel=relative(root,path);assert.ok(rel && !rel.startsWith('..') && !isAbsolute(rel),'File escapes package')
 }
 assert.equal(digest(from),file.sha256,'Installed candidate file differs: '+name)
 mkdirSync(dirname(to),{recursive:true});copyFileSync(from,to);assert.equal(digest(to),file.sha256)
}
const pkg=JSON.parse(readFileSync(join(target,'package.json'),'utf8'));assert.equal(pkg.version,'0.2.0-rc.2-openbkn.0.2.0-7')
const peers=[]
for(const [name,expected] of Object.entries({...pkg.dependencies,...pkg.peerDependencies})){
 const actualDir=dirname(req.resolve(name+'/package.json'))
 const actual=JSON.parse(readFileSync(join(actualDir,'package.json'),'utf8'))
 assert.equal(actual.name,name)
 // Test the supported exact baseline even where the manifest permits a range.
 if(name in pkg.peerDependencies){
  const baseline=name==='@deepseek-ai/cordis'?'4.0.4':'0.2.0-rc.2'
  assert.equal(actual.version,baseline,'Peer differs from the tested baseline: '+name)
 }
 const link=join(target,'node_modules',name);mkdirSync(dirname(link),{recursive:true})
 symlinkSync(actualDir,link,process.platform==='win32'?'junction':'dir')
 peers.push({name,version:actual.version})
}
console.log(JSON.stringify({evidence:'Standalone peer bridge for a controlled fixture probe, not live Desktop/model acceptance',verifiedCandidateFiles:files.length,officialNpmDshVersion:official.version,peers,probePackage:target}))
