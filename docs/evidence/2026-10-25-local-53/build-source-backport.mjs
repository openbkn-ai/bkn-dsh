import {createRequire} from 'node:module'
import {cpSync,readFileSync,writeFileSync,symlinkSync,mkdirSync,realpathSync,readdirSync,copyFileSync,existsSync} from 'node:fs'
import {dirname,join,resolve} from 'node:path'
import {pathToFileURL} from 'node:url'
import {spawnSync} from 'node:child_process'
import {createHash} from 'node:crypto'
const repo=resolve(process.argv[2]??process.cwd()),task=join(repo,'release/local-53')
const buildTool=createRequire(join(repo,'../bkn-dsh-local49-ui/package.json'))
const {build}=await import(pathToFileURL(buildTool.resolve('tsdown')).href)
const records=[]
for(const [host,sourceRoot,runtime] of [['old','release/deepseek-harness','release/local-51/npm-old-runtime'],['rc3','release/local-53/upstreams/dsh-rc3','release/local-53/rc3-runtime']]) {
 const root=join(task,'source-build',host),folder=join(root,'packages/mcp/mcp-client')
 if(!existsSync(folder)) {
 mkdirSync(root,{recursive:true})
 const commit=host==='old'?'639ed015397290b3745d163aafe02ffee4aa3f84':'1f81c047fc48fa190a683e469daa699857e9afe8'
 const archive=join(task,`source-${host}.tar`)
 for(const [command,args] of [['git',['-C',join(repo,sourceRoot),'archive',commit,'-o',archive]],['tar',['-xf',archive,'-C',root]]]) {
  const result=spawnSync(command,args,{encoding:'utf8'})
  if(result.status!==0)throw new Error(result.stderr)
 }
 for(const args of [['init','-q'],['apply',join(task,`backport/${host}-same-origin-backport.patch`)]]) {
  const result=spawnSync('git',['-C',root,...args],{encoding:'utf8'})
  if(result.status!==0)throw new Error(result.stderr)
 }
 const req=createRequire(join(repo,runtime,'package.json'))
 const original=dirname(realpathSync(req.resolve('@deepseek-ai/dsh-mcp-client/package.json')))
 symlinkSync(dirname(dirname(original)),join(folder,'node_modules'),'dir')
 } else {
  if(readFileSync(join(folder,'src/fetch-within-origin.ts'),'utf8')!==readFileSync(join(task,'backport/fetch-within-origin.ts'),'utf8'))throw new Error('Prepared source differs from reviewed helper')
 }
 await build({config:false,cwd:folder,entry:['src/index.ts'],outDir:'lib',dts:false,tsconfig:false,platform:'node',format:'esm',outExtensions:()=>({js:'.js'}),clean:true,external:id=>!id.startsWith('.')&&!id.startsWith('/')})
 const entry=join(folder,'lib/index.js'),text=readFileSync(entry,'utf8')
 if(!text.includes('fetchWithinOrigin')||!text.includes('redirect: "manual"'))throw new Error('Built helper is missing')
 const packageJson=JSON.parse(readFileSync(join(folder,'package.json')))
 if(!packageJson.files.includes('MCP-SDK-LICENSE.txt'))throw new Error('License not declared for packaging')
 records.push({host,originalVersion:packageJson.version,sourceArchiveCopyPatched:true,sourceCommit:host==='old'?'639ed015397290b3745d163aafe02ffee4aa3f84':'1f81c047fc48fa190a683e469daa699857e9afe8',entrySha256:createHash('sha256').update(text).digest('hex'),compilerVersion:JSON.parse(readFileSync(join(dirname(dirname(buildTool.resolve('tsdown'))),'package.json'))).version,compiledHelperBundled:true,licenseDeclared:true,folder,fullHostBuilt:false,officialArtifact:false})
}
writeFileSync(join(task,'source-build-identity.json'),JSON.stringify(records,null,2)+'\n')
console.log(JSON.stringify(records))
