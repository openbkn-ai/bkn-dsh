import {createRequire} from 'node:module'
import {readdirSync,readFileSync,realpathSync,writeFileSync} from 'node:fs'
import {resolve,join,dirname,relative} from 'node:path'
const tool=createRequire(resolve('packages/openbkn-business-context/package.json')),ts=tool('typescript'),rows=[]
function files(dir){return readdirSync(dir,{withFileTypes:true}).flatMap(x=>x.isDirectory()?files(join(dir,x.name)):[join(dir,x.name)]).filter(x=>x.endsWith('.d.ts'))}
function tokens(file){const s=ts.createScanner(ts.ScriptTarget.Latest,true,ts.LanguageVariant.Standard,readFileSync(file,'utf8')),t=[];for(let k;(k=s.scan())!==ts.SyntaxKind.EndOfFileToken;)t.push([k,s.getTokenText()]);return JSON.stringify(t)}
for(const [host,rt] of [['old','release/local-51/npm-old-runtime'],['rc3','release/local-54/rc3-runtime']]){const req=createRequire(resolve(rt,'package.json'));const original=join(dirname(realpathSync(req.resolve('@deepseek-ai/dsh-mcp-client/package.json'))),'lib/types'),built=resolve('release/local-57/package-build',host,'lib/types');const existing=files(original),mismatch=existing.map(p=>relative(original,p)).filter(p=>tokens(join(original,p))!==tokens(join(built,p)));rows.push({host,existingDeclarationCount:existing.length,tokenMismatches:mismatch,added:files(built).map(p=>relative(built,p)).filter(p=>!existing.some(q=>relative(original,q)===p))});}
writeFileSync(resolve('release/local-57/declaration-api-comparison.json'),JSON.stringify(rows,null,2)+'\n');console.log(JSON.stringify(rows));
