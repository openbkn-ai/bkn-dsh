// Only a selected task profile. Back up before writing; never touch a personal or platform configuration.
import assert from 'node:assert/strict'
import {readFileSync,writeFileSync} from 'node:fs'
import {createRequire} from 'node:module'
import {join,resolve} from 'node:path'
import {parseArgs} from 'node:util'
const {values:v}=parseArgs({options:{runtime:{type:'string'},profile:{type:'string'},server:{type:'string'},backup:{type:'string'}}})
for(const name of ['runtime','profile','server','backup'])assert.ok(v[name],`--${name} required`)
const yaml=createRequire(join(resolve(v.runtime),'package.json'))('js-yaml'),server=JSON.parse(readFileSync(v.server))
assert.equal(new URL(server.baseURL).hostname,'127.0.0.1');assert.equal(server.sandboxAllowed,false)
const path=join(resolve(v.profile),'cordis.patch.yml'),raw=readFileSync(path),entries=yaml.load(raw.toString())
assert.ok(Array.isArray(entries),'Profile patch must be an array')
writeFileSync(v.backup,raw,{flag:'wx',mode:0o600})
let llm=entries.find(x=>x.id==='llm-pi-ai');if(!llm){llm={id:'llm-pi-ai',config:{}};entries.push(llm)}
llm.config??={};llm.config.providers??={}
assert.ok(!llm.config.providers['local30-b1'],'Refuse to overwrite a prior fixture configuration')
llm.config.providers['local30-b1']={api:'openai-completions',apiKeyEnv:'BKN_B1_LOCAL_PROTOCOL_KEY',baseURL:server.baseURL,models:[{id:server.model,name:'Local30 read-only protocol (not G6)',contextWindow:1000000,maxTokens:4096}]}
writeFileSync(path,yaml.dump(entries,{lineWidth:-1,noRefs:true}),{mode:0o600})
console.log(JSON.stringify({taskProfileConfigured:true,backupWritten:true,realModel:false,platformChanged:false}))
