import {readFileSync,writeFileSync,readdirSync,lstatSync,readlinkSync,mkdirSync,symlinkSync,rmSync} from 'node:fs'
import {join,resolve,relative} from 'node:path'
import {createHash} from 'node:crypto'
import {spawnSync} from 'node:child_process'
import assert from 'node:assert/strict'
import {assertPortableBundle} from '../../runtime/bundle-portability.mjs'
const task=resolve('release/local-57'),rows=JSON.parse(readFileSync(join(task,'assembly-identities.json'))),sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex'),out=[]
const testRoot=join(task,'delivery-helper-tests');mkdirSync(testRoot)
for(const row of rows){
 const root=row.folder,node=join(root,'tooling/node/bin/node'),script=join(root,'scripts/init-home.mjs'),test=join(testRoot,row.key);mkdirSync(test)
 const readme=join(root,'README.md');writeFileSync(readme,readFileSync(readme,'utf8').replace('new-home web --host','new-home --profile web --host'))
 const source=join(test,'original-home');mkdirSync(join(source,'sessions'),{recursive:true});mkdirSync(join(source,'node_modules'));writeFileSync(join(source,'sessions','synthetic.json'),'synthetic-session-preserved\n');writeFileSync(join(source,'node_modules','excluded'),'synthetic-dependency')
 const before=sha(join(source,'sessions','synthetic.json')),dest=join(test,'copy-home')
 const run=args=>spawnSync(node,[script,...args],{encoding:'utf8'})
 assert.equal(run([dest,source]).status,0);assert.equal(sha(join(dest,'sessions','synthetic.json')),before);assert.equal(sha(join(source,'sessions','synthetic.json')),before)
 assert.equal(run([dest,source]).status,1);assert(!readdirSync(dest).includes('node_modules'))
 symlinkSync(join(source,'sessions','synthetic.json'),join(source,'outside-link'));assert.equal(run([join(test,'rejected-symlink'),source]).status,1);rmSync(join(source,'outside-link'))
 const inv={};function walk(dir){for(const name of readdirSync(dir)){const p=join(dir,name),rel=relative(root,p),st=lstatSync(p);if(st.isSymbolicLink())inv[rel]={kind:'symlink',target:readlinkSync(p)};else if(st.isDirectory())walk(p);else if(rel!=='FILE-LIST.json')inv[rel]={kind:'file',sha256:sha(p)}}}walk(root);writeFileSync(join(root,'FILE-LIST.json'),JSON.stringify(inv,null,2)+'\n')
 assertPortableBundle({directory:root,home:process.env.HOME})
 const verify=()=>spawnSync(node,[join(root,'scripts/verify-bundle.mjs')],{encoding:'utf8'})
 assert.equal(verify().status,0);const marker=join(root,'unexpected-integrity-test');writeFileSync(marker,'synthetic');assert.equal(verify().status,1);rmSync(marker);assert.equal(verify().status,0)
 row.fileListSha256=sha(join(root,'FILE-LIST.json'));out.push({host:row.baseHostVersion,copyBytesPreserved:true,originalUnchanged:true,dependenciesExcluded:true,existingDestinationRefused:true,homeSymlinkRefused:true,extraBundleFileDetected:true,portability:'PASS',fileListSha256:row.fileListSha256,result:'PASS'})
}
writeFileSync(join(task,'assembly-identities.json'),JSON.stringify(rows,null,2)+'\n');writeFileSync(join(task,'delivery-helper-validation.json'),JSON.stringify(out,null,2)+'\n');console.log(JSON.stringify({cases:out.length,result:'PASS'}))
