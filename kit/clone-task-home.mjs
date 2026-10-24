// Copy an offline task-owned home without dependency links. Never operate on a daily profile.
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {existsSync,readFileSync,readdirSync,lstatSync,realpathSync,mkdirSync,copyFileSync,writeFileSync} from 'node:fs'
import {resolve,join,relative,dirname,basename,sep} from 'node:path'
import {parseArgs} from 'node:util'

const {values:v}=parseArgs({options:{source:{type:'string'},destination:{type:'string'},receipt:{type:'string'},'task-owned':{type:'boolean'}}})
assert.ok(v.source&&v.destination&&v.receipt&&v['task-owned'],'Required: --source --destination --receipt --task-owned; fully quit the task Desktop first')
const source=realpathSync(v.source),destination=resolve(v.destination),receipt=resolve(v.receipt)
assert.ok(!existsSync(destination)&&!existsSync(receipt),'Destination and receipt must be new; no overwriting or recovery deletion')
assert.equal(realpathSync(dirname(destination)),dirname(destination),'Destination parent must exist and have no symlink aliases')
assert.equal(realpathSync(dirname(receipt)),dirname(receipt),'Receipt parent must exist and have no symlink aliases')
const outside=(root,file)=>{const r=relative(root,file);return r==='..'||r.startsWith('..'+sep)}
assert.ok(outside(source,destination)&&outside(destination,source),'Homes must be separate, non-nested paths')
assert.ok(outside(source,receipt)&&outside(destination,receipt),'Keep the private receipt outside both homes')
const manifest=JSON.parse(readFileSync(join(source,'profiles','desktop','package.json')))
assert.ok(manifest.dsh?.profile,'Source must contain an initialized Desktop profile')
const plugin=JSON.parse(readFileSync(join(source,'profiles','desktop','node_modules','@openbkn','dsh-business-context','package.json')))
assert.equal(plugin.version,'0.2.0-rc.2-openbkn.0.2.0-30','Only clone the frozen task -30 home')
const sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex'),files={}
function scan(dir){for(const entry of readdirSync(dir,{withFileTypes:true})){
 if(entry.name==='node_modules')continue
 const p=join(dir,entry.name),s=lstatSync(p)
 assert.ok(!s.isSymbolicLink(),'Unexpected non-dependency link; stop rather than follow it')
 if(s.isDirectory())scan(p)
 else {assert.ok(s.isFile(),'Unexpected special file; stop rather than copy it');files[relative(source,p)]=sha(p)}
}}
scan(source)
// All validation precedes destination creation. Failure thereafter retains the partial task copy for inspection.
mkdirSync(destination)
for(const [name,hash] of Object.entries(files)){
 const from=join(source,name),to=join(destination,name)
 assert.equal(sha(from),hash,'Source changed during offline copy')
 mkdirSync(dirname(to),{recursive:true});copyFileSync(from,to)
 assert.equal(sha(to),hash,'Copy digest differs')
}
for(const [name,hash] of Object.entries(files))assert.equal(sha(join(source,name)),hash,'Source changed; retain evidence and stop')
writeFileSync(receipt,JSON.stringify({kind:'private-task-home-copy',source,destination,dependencyDirectoriesCopied:false,files,matched:Object.keys(files).length},null,2)+'\n',{flag:'wx'})
console.log(JSON.stringify({copiedFiles:Object.keys(files).length,dependencyDirectoriesCopied:false,originalDataUnchanged:true,receiptContainsPrivatePaths:true}))
