// Read-only delivery verification. This does not start a Host or contact the platform.
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {readFileSync,readdirSync} from 'node:fs'
import {dirname,join,relative,resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
import {execFileSync} from 'node:child_process'
const kit=dirname(fileURLToPath(import.meta.url)),sha=b=>createHash('sha256').update(b).digest('hex')
const read=p=>JSON.parse(readFileSync(p)),inventory=read(join(kit,'KIT-FILES.json')),actual=[]
function walk(dir){for(const entry of readdirSync(dir,{withFileTypes:true})){
 const p=join(dir,entry.name)
 if(entry.isDirectory())walk(p)
 else {assert.ok(entry.isFile(),'No delivery links or special files');const name=relative(kit,p).split('\\').join('/');if(p!==join(kit,'KIT-FILES.json'))actual.push(name)}
}}
walk(kit);assert.deepEqual(actual.sort(),Object.keys(inventory).sort(),'Keep results outside the frozen kit')
for(const [name,digest] of Object.entries(inventory))assert.equal(sha(readFileSync(join(kit,name))),digest,`Delivery mismatch: ${name}`)
const pins=read(join(kit,'DELIVERY.json'))
assert.equal(sha(readFileSync(join(kit,'lifecycle30/KIT-FILES.json'))),pins.frozenR3KitSha256)
const reports={}
for(const role of ['lifecycle30','ui31']){
 const raw=execFileSync(process.execPath,[join(kit,role,'verify-kit.mjs')],{encoding:'utf8',maxBuffer:1024*1024})
 reports[role]=JSON.parse(raw)
 assert.equal(reports[role].candidate.version,pins[role].version)
}
const old=read(join(kit,'lifecycle30/candidate-files.json')),next=read(join(kit,'ui31/candidate-files.json'))
assert.deepEqual(Object.keys(old).sort(),Object.keys(next).sort(),'Candidate file list differs')
const delta=Object.keys(old).filter(n=>old[n]!==next[n]).sort()
assert.deepEqual(delta,['lib/client.js','lib/types/client/locales.d.ts','package.json'])
for(const name of ['start-owned-desktop.ps1','stop-owned-host.ps1','verify-kit.mjs','profile-closure.mjs','portable-tar.mjs','openbkn-local-ca.pem','dsh-hosts.json','sdk-manifest.json','candidate/openbkn-bkn-sdk-0.2.0.tgz']){
 assert.equal(sha(readFileSync(join(kit,'lifecycle30',name))),sha(readFileSync(join(kit,'ui31',name))),`Changed frozen support input: ${name}`)
}
console.log(JSON.stringify({kind:'local-development-preacceptance',ciRun:null,formalAcceptanceEligible:false,deliveryFiles:Object.keys(inventory).length,frozenR3KitMatched:true,candidateDelta:delta,reports},null,2))
