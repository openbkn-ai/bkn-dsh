import assert from 'node:assert/strict'
import test from 'node:test'
import {mkdtempSync,mkdirSync,writeFileSync,rmSync,realpathSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {createRequire} from 'node:module'
import {auditDependencyClosure} from '../scripts/profile-closure.mjs'

for(const [host,hostSchema] of [['0.2.0-rc.2','3.18.4'],['0.2.1-rc.3','3.18.5']])test(`${host}: a passing Host-root graph cannot hide a private profile Schemastery`,()=>{
 const dir=mkdtempSync(join(tmpdir(),'bkn-profile-closure-'))
 const manifest=(path,value)=>{mkdirSync(path,{recursive:true});const file=join(path,'package.json');writeFileSync(file,JSON.stringify(value));return file}
 try {
  const runtime=manifest(dir,{name:'@deepseek-ai/dsh',version:host,dependencies:{'@deepseek-ai/schemastery':hostSchema}})
  const schema=manifest(join(dir,'node_modules/@deepseek-ai/schemastery'),{name:'@deepseek-ai/schemastery',version:hostSchema})
  const plugin=manifest(join(dir,'home/profiles/web/node_modules/@openbkn/dsh-business-context'),{name:'@openbkn/dsh-business-context',version:'fixture',dependencies:{'@deepseek-ai/schemastery':'^3.18.4'}})
  manifest(join(dir,'home/profiles/web/node_modules/@deepseek-ai/schemastery'),{name:'@deepseek-ai/schemastery',version:'3.18.5'})
  const opts={host,expected:{'@deepseek-ai/schemastery':realpathSync(schema)},resolveManifest:(name,parent)=>createRequire(parent).resolve(name+'/package.json')}
  assert.equal(auditDependencyClosure({...opts,anchors:[runtime]}).length,1)
  assert.throws(()=>auditDependencyClosure({...opts,anchors:[runtime,plugin]}),/Split @deepseek-ai\/schemastery: @openbkn/)
 } finally {rmSync(dir,{recursive:true,force:true})}
})

test('the official Host Zod range and exact plugin Zod pin are separate requirements',()=>{
 const dir=mkdtempSync(join(tmpdir(),'bkn-zod-scope-'))
 const write=(path,value)=>{mkdirSync(path,{recursive:true});const file=join(path,'package.json');writeFileSync(file,JSON.stringify(value));return file}
 try {
  const host=write(dir,{name:'@deepseek-ai/dsh',version:'0.2.0-rc.2',dependencies:{zod:'^4.4.3'}})
  write(join(dir,'node_modules/zod'),{name:'zod',version:'4.6.5'})
  const plugin=write(join(dir,'home/profiles/web/node_modules/@openbkn/dsh-business-context'),{name:'@openbkn/dsh-business-context',dependencies:{zod:'4.4.3'}})
  const opts={host:'0.2.0-rc.2',expected:{},resolveManifest:(name,parent)=>createRequire(parent).resolve(name+'/package.json'),validateHostZod:(version,range)=>{assert.equal(version,'4.6.5');assert.equal(range,'^4.4.3');return true}}
  assert.equal(auditDependencyClosure({...opts,anchors:[host]})[0].zodVersion,'4.6.5')
  assert.throws(()=>auditDependencyClosure({...opts,anchors:[plugin]}),/Unexpected plugin Zod/)
 } finally {rmSync(dir,{recursive:true,force:true})}
})
