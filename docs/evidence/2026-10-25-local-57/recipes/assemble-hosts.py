from pathlib import Path
import os,json,shutil,hashlib,stat,tarfile,gzip,subprocess
r=Path.cwd();b=r/'release/local-57';sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def dump(p,x):p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
def inventory(root):
 out={}
 for parent,dirs,files in os.walk(root):
  for name in dirs+files:
   p=Path(parent)/name;rel=str(p.relative_to(root))
   if p.is_symlink():
    target=os.readlink(p);assert not os.path.isabs(target) and p.resolve().is_relative_to(root) and p.exists(),rel
    out[rel]={'kind':'symlink','target':target}
   elif p.is_file() and rel!='FILE-LIST.json':out[rel]={'kind':'file','sha256':sha(p)}
 return out
rows=[]
for key,version,source,pnpmv,commit in [('old','0.2.0-rc.2','release/local-51/npm-old-runtime','11.7.0','639ed015397290b3745d163aafe02ffee4aa3f84'),('rc3','0.2.1-rc.3','release/local-54/rc3-runtime','11.28.5','1f81c047fc48fa190a683e469daa699857e9afe8')]:
 ident='openbkn-host-'+key+'-same-origin-r1-mac-arm64';dest=b/'assembled'/ident;assert not dest.exists();runtime=dest/'runtime';runtime.mkdir(parents=True)
 src=r/source;shutil.copytree(src/'node_modules',runtime/'node_modules',symlinks=True)
 rootmeta=json.loads((src/'package.json').read_text());rootmeta.update({'name':ident,'version':'0.0.0-local57.r1','private':True,'packageManager':'pnpm@'+pnpmv});rootmeta['dependencies']={k:v for k,v in rootmeta['dependencies'].items() if not k.startswith('@openbkn/')};dump(runtime/'package.json',rootmeta)
 if (src/'pnpm-workspace.yaml').exists():shutil.copy2(src/'pnpm-workspace.yaml',runtime/'pnpm-workspace.yaml')
 removed=[]
 for rel in ['node_modules/.modules.yaml','node_modules/.pnpm-workspace-state-v1.json','node_modules/.pnpm/lock.yaml','node_modules/.package-lock.json']:
  p=runtime/rel
  if p.exists():p.unlink();removed.append(rel)
 private=[]
 for parent,dirs,files in os.walk(runtime/'node_modules'):
  if 'package.json' in files:
   p=Path(parent)/'package.json'
   try:meta=json.loads(p.read_text())
   except (UnicodeDecodeError,json.JSONDecodeError):continue
   if meta.get('name','').startswith('@openbkn/'):private.append(Path(parent))
 for root in private:
  # Retire only unused private fixture packages from this new runtime copy.
  for parent,dirs,files in os.walk(runtime/'node_modules'):
   for name in dirs+files:
    p=Path(parent)/name
    if p.is_symlink() and p.resolve().is_relative_to(root):p.unlink();removed.append(str(p.relative_to(runtime)))
  pkg=root
  if root.parent.name=='@openbkn' and root.parent.parent.name=='node_modules' and root.parent.parent.parent.parent.name=='.pnpm':pkg=root.parent.parent.parent
  shutil.rmtree(pkg);removed.append(str(pkg.relative_to(runtime)))
 rewritten=[]
 for parent,dirs,files in os.walk(runtime/'node_modules'):
  if Path(parent).name!='.bin':continue
  for name in files:
   p=Path(parent)/name
   if p.is_symlink() or p.stat().st_size>100000:continue
   raw=p.read_bytes()
   prefixes=[str(src),str(r/'release/local-53/rc3-runtime')] if key=='rc3' else [str(src)]
   if not any(prefix.encode() in raw for prefix in prefixes):continue
   text=raw.decode();assert text.startswith('#!/bin/sh\n'),str(p)
   rel=os.path.relpath(runtime,p.parent)
   
   for prefix in prefixes:text=text.replace(prefix,'$task_runtime_root')
   text=text.replace('\n','\ntask_runtime_root=$(CDPATH= cd -- "$(dirname -- "$0")/'+rel+'" && pwd -P)\n',1);p.write_text(text);rewritten.append(str(p.relative_to(runtime)))
 # Resolve the one modified package in the copied physical layout.
 mcp=(runtime/'node_modules/@deepseek-ai/dsh-mcp-client').resolve();assert mcp.is_relative_to(runtime)
 sourceMcp=r/'release/local-53/source-build'/key/'packages/mcp/mcp-client';assert sha(sourceMcp/'lib/index.js')=='b3cd7156c0b8639656ce117530fec4d006b74cafdc9a78ac426fec084e62972c'
 shutil.copy2(sourceMcp/'lib/index.js',mcp/'lib/index.js');shutil.rmtree(mcp/'lib/types');shutil.copytree(b/'package-build'/key/'lib/types',mcp/'lib/types')
 shutil.copy2(sourceMcp/'MCP-SDK-LICENSE.txt',mcp/'MCP-SDK-LICENSE.txt');shutil.copy2(r/'release/local-53/source-build'/key/'LICENSE',mcp/'DSH-LICENSE.txt')
 (mcp/'LICENSES.md').write_text('This is a locally modified DSH MCP package. Original DSH code retains its original MIT license in DSH-LICENSE.txt. The copied MCP redirect helper retains the complete pinned upstream licensing-transition notice and license text in MCP-SDK-LICENSE.txt; it is not relicensed as MIT. See HOST-BACKPORT.json for the fixed source commits and changes.\n')
 meta=json.loads((mcp/'package.json').read_text());assert meta['version']==version;meta['license']='SEE LICENSE IN LICENSES.md';meta['files']=sorted(set(meta.get('files',[])+['MCP-SDK-LICENSE.txt','DSH-LICENSE.txt','LICENSES.md','HOST-BACKPORT.json']));meta['openbknSecurityBackport']={'distributionId':ident,'baseVersion':version,'sdkUnchanged':meta['dependencies']['@modelcontextprotocol/client']};dump(mcp/'package.json',meta)
 info={'distributionId':ident,'kind':'local-development-preacceptance','officialUnmodifiedArtifact':False,'formalAcceptanceEligible':False,'ciRun':None,'baseHostVersion':version,'baseHostCommit':commit,'target':{'platform':'darwin','arch':'arm64'},'sdkVersionUnchanged':meta['dependencies']['@modelcontextprotocol/client'],'mcpEntrySha256':sha(mcp/'lib/index.js'),'mcpPackagePath':str(mcp.relative_to(dest)),'mcpFixSourceCommit':'433eb413dc305ebeb93b8ebcde0095a8fc0d5fa0','sourcePatchSha256':sha(r/'docs/evidence/2026-10-25-local-53/backport'/('old-same-origin-backport.patch' if key=='old' else 'rc3-same-origin-backport.patch')),'declarations':'Generated against matching published dependency types. Five existing declarations token-identical; one internal helper declaration added.','scope':'DSH Streamable HTTP factory only; SDK OAuth and other SDK callers are not declared repaired.','nodeVersion':'24.19.0','pnpmVersion':pnpmv}
 dump(mcp/'HOST-BACKPORT.json',info);dump(dest/'HOST-BACKPORT.json',info)
 tooling=dest/'tooling';(tooling/'node/bin').mkdir(parents=True);shutil.copy2(b/'tools/node-v24.19.0-darwin-arm64/bin/node',tooling/'node/bin/node');shutil.copy2(b/'tools/node-v24.19.0-darwin-arm64/LICENSE',tooling/'node/LICENSE');shutil.copytree(b/'tools'/('pnpm-'+pnpmv)/'package',tooling/'pnpm',symlinks=True)
 (dest/'bin').mkdir();(dest/'scripts').mkdir();os.symlink('../tooling/node/bin/node',dest/'bin/node')
 (dest/'bin/pnpm').write_text('#!/bin/sh\nset -eu\ntask_bundle_root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd -P)\nexec "$task_bundle_root/tooling/node/bin/node" "$task_bundle_root/tooling/pnpm/bin/pnpm.cjs" "$@"\n');(dest/'bin/pnpm').chmod(0o755)
 cli=json.loads((runtime/'node_modules/@deepseek-ai/dsh/package.json').read_text())['bin'];entry=cli['dsh'] if isinstance(cli,dict) else cli
 launcher='''#!/bin/sh
set -eu
task_bundle_root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd -P)
if [ "$#" -lt 2 ] || [ "$1" != "--home" ]; then
  echo 'Usage: bin/dsh --home NEW_ISOLATED_HOME [official dsh arguments]' >&2
  exit 64
fi
task_host_home=$2
shift 2
case "$task_host_home" in /*) ;; *) echo 'An absolute isolated home is required' >&2; exit 64 ;; esac
"$task_bundle_root/tooling/node/bin/node" "$task_bundle_root/scripts/verify-bundle.mjs" "$task_host_home"
export DSH_HOME="$task_host_home"
export PATH="$task_bundle_root/bin:$PATH"
echo 'OpenBKN local Host security backport; base DSH VERSION; not an unmodified official distribution.' >&2
exec "$task_bundle_root/tooling/node/bin/node" "$task_bundle_root/runtime/node_modules/@deepseek-ai/dsh/ENTRY" "$@"
'''.replace('VERSION',version).replace('ENTRY',entry)
 (dest/'bin/dsh').write_text(launcher);(dest/'bin/dsh').chmod(0o755)
 (dest/'scripts/verify-bundle.mjs').write_text('''import {readFileSync,readdirSync,lstatSync,readlinkSync,realpathSync} from 'node:fs'
import {resolve,join,relative,dirname,isAbsolute} from 'node:path'
import {fileURLToPath} from 'node:url'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),meta=JSON.parse(readFileSync(join(root,'HOST-BACKPORT.json'))),wanted=JSON.parse(readFileSync(join(root,'FILE-LIST.json')))
assert.equal(process.platform,meta.target.platform,'Wrong platform');assert.equal(process.arch,meta.target.arch,'Wrong architecture')
const found={};function walk(dir){for(const name of readdirSync(dir)){const file=join(dir,name),rel=relative(root,file),st=lstatSync(file);if(st.isSymbolicLink()){const target=readlinkSync(file);assert(!isAbsolute(target),'Absolute link');assert(!relative(root,realpathSync(file)).startsWith('..'),'Escaping link');found[rel]={kind:'symlink',target}}else if(st.isDirectory())walk(file);else if(rel!=='FILE-LIST.json')found[rel]={kind:'file',sha256:createHash('sha256').update(readFileSync(file)).digest('hex')}}}
walk(root);assert.deepEqual(found,wanted,'Host bundle files differ from the fixed manifest')
if(process.argv[2]){const home=resolve(process.argv[2]);assert(!relative(root,home).startsWith('..')?false:true,'Home must be outside the immutable Host bundle');const marker=JSON.parse(readFileSync(join(home,'OPENBKN-HOST-ISOLATION.json')));assert.equal(marker.distributionId,meta.distributionId,'Use a home created for this isolated distribution')}
console.log(JSON.stringify({distributionId:meta.distributionId,filesMatched:Object.keys(wanted).length}))
''')
 (dest/'scripts/init-home.mjs').write_text('''import {existsSync,mkdirSync,writeFileSync,cpSync,readdirSync,lstatSync,readFileSync} from 'node:fs'
import {resolve,join,dirname,relative,isAbsolute} from 'node:path'
import {fileURLToPath} from 'node:url'
import assert from 'node:assert/strict'
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),meta=JSON.parse(readFileSync(join(root,'HOST-BACKPORT.json'))),arg=process.argv[2];assert(arg&&isAbsolute(arg),'Pass an absolute new destination home');const dest=resolve(arg);assert(!existsSync(dest),'Destination already exists; preserve it');assert(relative(root,dest).startsWith('..'),'Home must be outside bundle');const src=process.argv[3]&&resolve(process.argv[3]);if(src){assert(existsSync(src),'Copy source does not exist');assert(relative(src,dest).startsWith('..'),'Destination cannot be inside source');function preflight(dir){assert(!lstatSync(dir).isSymbolicLink(),'Copy source symlinks require separate review');for(const name of readdirSync(dir)){if(name==='node_modules')continue;const file=join(dir,name),st=lstatSync(file);assert(!st.isSymbolicLink(),'Home symlinks require separate review');if(st.isDirectory())preflight(file)}}preflight(src);cpSync(src,dest,{recursive:true,dereference:false,filter:(p)=>!relative(src,p).split('/').includes('node_modules')})}else mkdirSync(dest,{recursive:true});writeFileSync(join(dest,'OPENBKN-HOST-ISOLATION.json'),JSON.stringify({distributionId:meta.distributionId,baseHostVersion:meta.baseHostVersion,createdFor:'explicit isolated copy; original home not modified'},null,2)+'\\n');console.log(JSON.stringify({distributionId:meta.distributionId,homeCreated:true,copied:!!src}))
''')
 (dest/'README.md').write_text('''# Local Host security backport

This is an isolated Mac arm64 development distribution with the recorded original DSH/SDK versions, not an official unmodified DeepSeek artifact or a formal CI candidate. It contains no user home, credentials, frozen bkn-dsh plugin candidate or business records. Do not use it to overwrite an installed Host.

Create an empty home with `tooling/node/bin/node scripts/init-home.mjs /absolute/new-home`; an optional second argument copies an existing home without node_modules and never overwrites the source or an existing destination. Profile dependency installation, if needed after a copy, is a separate explicit operation. Run `bin/dsh --home /absolute/new-home --profile web --host 127.0.0.1 --port YOUR_PORT --no-open`. Verify the archive hash from the trusted receipt before extraction; FILE-LIST.json checks integrity and is not a digital signature.

Rollback is a launch-path switch back to the preserved original Host and original home. Do not restore stale snapshots over new sessions, records or credential renewals. Keep the new home and all failure evidence. Existing platform services are unrelated and must not be replaced.

See HOST-BACKPORT.json and package-level LICENSES.md for patch scope and attribution. Original per-package licenses, the complete Node license and pnpm license are retained. The copied MCP helper is not claimed to be MIT-only. SDK OAuth providers and all other SDK consumers remain outside this transport-only mitigation.
''')
 # Fixed reviewed source inputs, with no local build paths.
 prov=dest/'provenance';prov.mkdir();shutil.copy2(r/'docs/evidence/2026-10-25-local-53/backport'/('old-same-origin-backport.patch' if key=='old' else 'rc3-same-origin-backport.patch'),prov/'same-origin-backport.patch');shutil.copytree(sourceMcp/'src',prov/'mcp-source');dump(prov/'build-inputs.json',{'baseHostVersion':version,'baseHostCommit':commit,'compiler':'TypeScript 5.9.3','jsBuilder':'tsdown 0.22.14','jsReusedFromReviewedSourceBuild':True,'mcpEntrySha256':info['mcpEntrySha256'],'sourceScope':'Exact patched MCP package source; all other Host modules retained from previously verified matching installed artifacts','node':json.loads((b/'node-identity.json').read_text()),'pnpm':next(x for x in json.loads((b/'pnpm-identities.json').read_text()) if x['version']==pnpmv)})
 # Reject accidental user-root prefixes or file: dependencies in structured manifests.
 bad=[]
 for parent,dirs,files in os.walk(dest):
  for name in files:
   p=Path(parent)/name
   if p.is_symlink() or p.stat().st_size>2000000:continue
   raw=p.read_bytes()
   if str(r.parent).encode() in raw:bad.append(str(p.relative_to(dest)))
 assert not bad,{"count":len(bad),"first":bad[:3]}
 inv=inventory(dest);dump(dest/'FILE-LIST.json',inv)
 row={'distributionId':ident,'key':key,'baseHostVersion':version,'folder':str(dest),'mcpPackagePath':str(mcp.relative_to(dest)),'fileCount':len(inv),'sourceRuntimeCodeOnly':True,'excludedOriginalHomesAndLogs':True,'unusedPrivateFixturePruned':removed,'generatedShellWrappersMadeRelative':rewritten,'mcpEntrySha256':info['mcpEntrySha256'],'fileListSha256':sha(dest/'FILE-LIST.json')};rows.append(row)
 print(json.dumps({'distributionId':ident,'files':len(inv),'pruned':len(removed),'relativeWrappers':len(rewritten)}))
dump(b/'assembly-identities.json',rows)
