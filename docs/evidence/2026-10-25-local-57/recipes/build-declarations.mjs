import {createRequire} from 'node:module'
import {readFileSync,writeFileSync,mkdirSync,cpSync,symlinkSync,realpathSync} from 'node:fs'
import {resolve,join,dirname} from 'node:path'
import {spawnSync} from 'node:child_process'
const repo=process.cwd(),task=resolve('release/local-57'),req=createRequire(resolve('packages/openbkn-business-context/package.json')),ts=req('typescript'),rows=[]
for(const [host,runtime] of [['old','release/local-51/npm-old-runtime'],['rc3','release/local-54/rc3-runtime']]) {
 const original=resolve('release/local-53/source-build',host,'packages/mcp/mcp-client'),dest=join(task,'package-build',host)
 mkdirSync(dest,{recursive:true})
 cpSync(join(original,'src'),join(dest,'src'),{recursive:true});cpSync(join(original,'package.json'),join(dest,'package.json'));cpSync(join(original,'MCP-SDK-LICENSE.txt'),join(dest,'MCP-SDK-LICENSE.txt'))
 const runtimeRequire=createRequire(resolve(runtime,'package.json'));const installed=dirname(realpathSync(runtimeRequire.resolve('@deepseek-ai/dsh-mcp-client/package.json')))
 symlinkSync(dirname(dirname(installed)),join(dest,'node_modules'),'dir')
 const read=ts.readConfigFile(resolve('release/local-53/source-build',host,'tsconfig.base.json'),ts.sys.readFile);if(read.error)throw new Error('Cannot read original TS config')
 const options={...read.config.compilerOptions,paths:{},composite:false,incremental:false,declaration:true,declarationMap:false,emitDeclarationOnly:true,rootDir:'src',outDir:'lib/types',typeRoots:[resolve('packages/openbkn-business-context/node_modules/@types')]}
 writeFileSync(join(dest,'tsconfig.declarations.json'),JSON.stringify({compilerOptions:options,include:['src/**/*.ts']},null,2)+'\n')
 const result=spawnSync(resolve('../.test-tools/node_modules/node/bin/node'),[req.resolve('typescript/lib/tsc.js'),'-p',join(dest,'tsconfig.declarations.json')],{cwd:repo,encoding:'utf8'})
 writeFileSync(join(task,`declarations-${host}.log`),result.stdout+result.stderr)
 rows.push({host,exit:result.status,dependencyRuntime:runtime,kind:'single modified package declaration build against exact published Host dependency types; not a whole-upstream workspace rebuild'})
}
writeFileSync(join(task,'declaration-build.json'),JSON.stringify(rows,null,2)+'\n');console.log(JSON.stringify(rows));if(rows.some(x=>x.exit!==0))process.exitCode=1
