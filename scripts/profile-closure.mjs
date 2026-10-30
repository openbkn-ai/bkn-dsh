// Read-only closure checks. Run in a dedicated Node process: the official Host owns its resolver.
import assert from 'node:assert/strict'
import {readFileSync,realpathSync} from 'node:fs'
import {createRequire} from 'node:module'
import {join,resolve} from 'node:path'
import {pathToFileURL} from 'node:url'

const pluginName='@openbkn/dsh-business-context'
const identities=['@deepseek-ai/cordis','@deepseek-ai/schemastery']
const read=file=>JSON.parse(readFileSync(file,'utf8'))

/** Traverse every loader-visible DSH/Cordis/plugin dependency and peer from all supplied anchors. */
export function auditDependencyClosure({anchors,host,expected,resolveManifest,validateHostZod}) {
 assert.ok(typeof host==='string'&&host.length>0,'Actual Host version required')
 const seen=new Set(),packages=[]
 function visit(input) {
  const file=realpathSync(input)
  if(seen.has(file))return
  seen.add(file)
  const p=read(file),deps={...p.dependencies,...p.peerDependencies}
  if(p.name==='@deepseek-ai/dsh'||p.name?.startsWith('@deepseek-ai/dsh-'))assert.equal(p.version,host,`Mixed DSH: ${p.name}`)
  for(const name of identities)if(deps[name]) {
   const selected=realpathSync(resolveManifest(name,file))
   assert.equal(selected,expected[name],`Split ${name}: ${p.name}`)
  }
  let zodVersion
  if(deps.zod) {
   zodVersion=read(resolveManifest('zod',file)).version
   if(p.name===pluginName)assert.equal(zodVersion,'4.4.3',`Unexpected plugin Zod: ${p.name}`)
   else assert.ok(validateHostZod?.(zodVersion,deps.zod),`Host Zod violates its declared range: ${p.name}`)
  }
  packages.push({name:p.name,version:p.version,...(zodVersion?{zodVersion,zodRange:deps.zod}:{})})
  for(const name of Object.keys(deps)) {
   if(name!==pluginName&&!name.startsWith('@deepseek-ai/dsh')&&!name.startsWith('@deepseek-ai/cordis'))continue
   let target
   try {target=resolveManifest(name,file)} catch(error) {
    if(p.peerDependenciesMeta?.[name]?.optional)continue
    throw error
   }
   visit(target)
  }
 }
 for(const anchor of anchors)visit(anchor)
 return packages.sort((a,b)=>a.name.localeCompare(b.name))
}

/** Include the actual installed profile via the public, unchanged Host resolution API. No plugins are mounted. */
export async function inspectProfileClosure({runtime,host,profile,installed}) {
 runtime=resolve(runtime)
 const runtimeManifest=join(runtime,'package.json'),req=createRequire(runtimeManifest)
 const expected=Object.fromEntries(identities.map(name=>[name,realpathSync(req.resolve(name+'/package.json'))]))
 const nativeResolve=(name,parent)=>createRequire(parent).resolve(name+'/package.json')
 const semver=req('semver'),validateHostZod=(version,range)=>semver.satisfies(version,range)
 const hostCordis=read(expected[identities[0]]).version,hostSchema=read(expected[identities[1]]).version
 const rootPackages=auditDependencyClosure({anchors:[runtimeManifest],host,expected,resolveManifest:nativeResolve,validateHostZod})
 assert.ok(rootPackages.some(p=>p.name==='@deepseek-ai/dsh'&&p.version===host),'Actual official DSH version is missing or mismatched')
 const report={host,scope:'installation-only',profileCoverage:'not-run',rootPackages,cordis:hostCordis,schemastery:hostSchema}
 if(!profile)return report
 profile=realpathSync(resolve(profile))
 const anchor=req.resolve('@deepseek-ai/dsh/package.json')
 const installRequire=createRequire(anchor)
 const [{Context},{createRuntimeResolution,loadProfileDirectory,PluginPackages}]=await Promise.all([
  import(pathToFileURL(req.resolve('@deepseek-ai/cordis')).href),
  import(pathToFileURL(installRequire.resolve('@deepseek-ai/dsh-app-boot')).href),
 ])
 const loaded=loadProfileDirectory('dsh',profile,anchor,{userLayer:false})
 assert.deepEqual(loaded.skippedBundles,[],'Profile contains skipped bundles')
 const resolution=await createRuntimeResolution({installAnchor:anchor,profile:loaded,home:resolve(profile,'../..')})
 const ctx=new Context(),fiber=await ctx.plugin(PluginPackages,{resolution})
 try {
  const owner=pathToFileURL(join(profile,'package.json')).href
  const plugin=ctx.pluginPackages.packageOf(pluginName,owner)
  assert.ok(plugin,'Actual profile does not resolve the candidate plugin')
  const profilePrefix=profile+((process.platform==='win32')?'\\':'/')
  assert.ok(realpathSync(plugin.dir).startsWith(profilePrefix),'Candidate must be installed in the selected profile')
  if(installed)assert.equal(realpathSync(resolve(installed)),realpathSync(plugin.dir),'--installed is not the active profile plugin')
  const selected=[]
  const pluginManifest=read(plugin.manifestPath)
  // Audit the installed artifact's native admission contract; remain portable
  // when this helper is copied into a handoff without the source repository.
  const ranges=pluginManifest.engines?.dsh!==undefined?[pluginManifest.engines.dsh]:[...new Set(Object.entries(pluginManifest.peerDependencies??{}).filter(([name])=>name==='@deepseek-ai/dsh'||name.startsWith('@deepseek-ai/dsh-')).map(([,range])=>range))]
  assert.ok(ranges.length>0&&ranges.every(range=>typeof range==='string'&&semver.satisfies(host,range,{includePrerelease:true})),'Host does not satisfy the installed plugin loading declaration')
  const loadRange=ranges.join(' && ')
  const resolveManifest=(name,parent)=>{
   const found=ctx.pluginPackages.packageOf(name,pathToFileURL(parent).href)
   assert.ok(found,`Unresolved package: ${name}`)
   return found.manifestPath
  }
  for(const name of identities) {
   const file=realpathSync(resolveManifest(name,join(plugin.dir,'lib/index.js')))
   const version=read(file).version,range=pluginManifest.peerDependencies?.[name]
   assert.ok(typeof range==='string'&&semver.satisfies(version,range,{includePrerelease:true}),`Host ${name} does not satisfy the plugin's declared peer contract`)
   selected.push({name,version,samePhysicalPackage:file===expected[name]})
  }
  const profilePackages=auditDependencyClosure({anchors:[plugin.manifestPath],host,expected,resolveManifest,validateHostZod})
  assert.ok(profilePackages.some(p=>p.name===pluginName),'Profile traversal omitted the plugin')
  // Check Node's actual CommonJS resolver as well as the Host package API while interception is active.
  for(const name of identities)assert.equal(realpathSync(nativeResolve(name,join(plugin.dir,'lib/index.js'))),expected[name],`Node resolver split: ${name}`)
  return {...report,loadRange,scope:'installation-and-profile',profileCoverage:'pass',profilePackages,pluginVersion:plugin.version,selected,noMixedDsh:true,noSplitCordis:true,noSplitSchemastery:true}
 } finally {await fiber.dispose()}
}
