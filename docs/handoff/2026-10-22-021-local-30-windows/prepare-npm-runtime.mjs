// Write a new task manifest from the verified exact-version dependency snapshot.
// Does not install packages, start a Host, read credentials or alter a prior root.
import assert from 'node:assert/strict'
import {existsSync,mkdirSync,readFileSync,readdirSync,writeFileSync} from 'node:fs'
import {dirname,join,resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
import {parseArgs} from 'node:util'
const kit=dirname(fileURLToPath(import.meta.url))
const {values}=parseArgs({options:{host:{type:'string'},runtime:{type:'string'},tarball:{type:'string'}}})
assert.ok(['0.2.0-rc.2','0.2.1-rc.2'].includes(values.host),'Exact --host required')
assert.ok(values.runtime,'--runtime required')
const root=resolve(values.runtime)
assert.ok(!existsSync(root)||readdirSync(root).length===0,'Use a new empty task runtime directory')
const candidate=JSON.parse(readFileSync(join(kit,'candidate-manifest.json'),'utf8'))
const tarball=resolve(values.tarball??join(kit,candidate.file))
assert.ok(existsSync(tarball),'Candidate tarball missing; run verify-kit first')
const template=JSON.parse(readFileSync(join(kit,`npm-runtime-${values.host}.json`),'utf8'))
assert.equal(template.dependencies['@deepseek-ai/dsh'],values.host)
assert.equal(template.dependencies.zod,'4.4.3')
template.dependencies['@openbkn/dsh-business-context']='file:'+tarball.replaceAll('\\','/')
mkdirSync(root,{recursive:true})
writeFileSync(join(root,'package.json'),JSON.stringify(template,null,2)+'\n',{flag:'wx'})
console.log(JSON.stringify({host:values.host,runtime:root,manifestWritten:true,packagesInstalled:false,credentialsRead:false}))
