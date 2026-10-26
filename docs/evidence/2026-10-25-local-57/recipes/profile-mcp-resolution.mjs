import {createRequire} from 'node:module'
import {cpSync,existsSync,readFileSync,writeFileSync,realpathSync} from 'node:fs'
import {resolve,join} from 'node:path'
import {pathToFileURL} from 'node:url'
import {createHash} from 'node:crypto'
const key=process.argv[2]??'rc3',repo=process.cwd(),task=resolve('release/local-57'),item=JSON.parse(readFileSync(join(task,'assembly-identities.json'))).find(x=>x.key===key),runtime=join(item.folder,'runtime'),home=join(task,'profile-owner-copy-'+key)
if(!existsSync(home))cpSync(resolve('release/local-56/npm-home'),home,{recursive:true,dereference:false,verbatimSymlinks:true})
const profile=join(home,'profiles/web'),req=createRequire(join(runtime,'package.json')),anchor=req.resolve('@deepseek-ai/dsh/package.json'),hostReq=createRequire(anchor)
const {Context}=await import(pathToFileURL(req.resolve('@deepseek-ai/cordis')).href)
const {createRuntimeResolution,loadProfileDirectory,PluginPackages}=await import(pathToFileURL(hostReq.resolve('@deepseek-ai/dsh-app-boot')).href)
const loaded=loadProfileDirectory('dsh',profile,anchor,{userLayer:false}),resolution=await createRuntimeResolution({installAnchor:anchor,profile:loaded,home}),ctx=new Context(),fiber=await ctx.plugin(PluginPackages,{resolution})
try{const plugin=ctx.pluginPackages.packageOf('@openbkn/dsh-business-context',pathToFileURL(join(profile,'package.json')).href);if(!plugin)throw new Error('Frozen plugin not resolved');const mcp=ctx.pluginPackages.packageOf('@deepseek-ai/dsh-mcp-client',pathToFileURL(join(plugin.dir,'lib/index.js')).href);const file=join(mcp.dir,'lib/index.js'),nodeFile=createRequire(join(plugin.dir,'lib/index.js')).resolve('@deepseek-ai/dsh-mcp-client');const report={baseHost:item.baseHostVersion,pluginVersion:plugin.version,officialPackageApiMcpPath:file,nodeResolverMcpPath:nodeFile,sameSelectedFile:file===nodeFile,samePhysicalFile:realpathSync(file)===realpathSync(nodeFile),mcpEntrySha256:createHash('sha256').update(readFileSync(file)).digest('hex'),scope:'Read-only official resolution APIs on a new copied profile; no plugin mount, CLI auth or platform call'};writeFileSync(join(task,'profile-mcp-resolution-'+key+'.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report))}finally{await fiber.dispose()}
