from pathlib import Path
import os,json,hashlib,tarfile,gzip,shutil,re,subprocess
b=Path(__file__).resolve().parent;repo=b.parent.parent;sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();dump=lambda p,x:p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
rows=json.loads((b/'relocated-identities.json').read_text());artifacts=[];deltas=[]
for row in rows:
 root=Path(row['folder']);mcp=root/row['mcpPackagePath'];overlay=b/'overlays'/('openbkn-mcp-'+row['key']+'-same-origin-r1');overlay.mkdir(parents=True)
 for name in ['lib/index.js','package.json','MCP-SDK-LICENSE.txt','DSH-LICENSE.txt','LICENSES.md','HOST-BACKPORT.json']+[str(p.relative_to(mcp)) for p in (mcp/'lib/types').rglob('*.d.ts')]:
  dest=overlay/name;dest.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(mcp/name,dest)
 info=json.loads((overlay/'HOST-BACKPORT.json').read_text());info['distributionId']=overlay.name;info.pop('mcpPackagePath');info['kind']='local-development-package-overlay';dump(overlay/'HOST-BACKPORT.json',info)
 pkg=json.loads((overlay/'package.json').read_text());pkg['openbknSecurityBackport']['distributionId']=overlay.name;dump(overlay/'package.json',pkg)
 arc=b/'artifacts'/(overlay.name+'.tgz')
 with arc.open('wb') as raw:
  with gzip.GzipFile(fileobj=raw,mode='wb',filename='',mtime=0,compresslevel=9) as zipped:
   with tarfile.open(fileobj=zipped,mode='w|') as tar:
    def normalized(x):x.uid=x.gid=0;x.uname=x.gname='';x.mtime=0;x.pax_headers={};return x
    tar.add(overlay,arcname='package',filter=normalized)
 artifacts.append({'distributionId':row['distributionId'],'baseHostVersion':row['baseHostVersion'],'platform':'darwin-arm64','kind':'complete-npm-web-host','path':str(Path(row['archive']).relative_to(repo)),'bytes':row['archiveBytes'],'sha256':row['archiveSha256'],'fileListSha256':row['fileListSha256'],'filesOrLinks':row['fileCount'],'mcpEntrySha256':row['mcpEntrySha256'],'bundledNode':'24.19.0','bundledPnpm':'11.7.0' if row['key']=='old' else '11.28.5'})
 artifacts.append({'distributionId':overlay.name,'baseHostVersion':row['baseHostVersion'],'kind':'payload-only-package-overlay-not-standalone-host','path':str(arc.relative_to(repo)),'bytes':arc.stat().st_size,'sha256':sha(arc),'regularFiles':len([p for p in overlay.rglob('*') if p.is_file()]),'containsDependencies':False})
 # Compare every original non-symlink dependency code file against the new copy.
 src=repo/('release/local-51/npm-old-runtime' if row['key']=='old' else 'release/local-54/rc3-runtime');dest=root/'runtime';same=0;changed=[];removed=[]
 for parent,dirs,files in os.walk(src/'node_modules'):
  for name in files:
   p=Path(parent)/name
   if p.is_symlink():continue
   rel=str(p.relative_to(src));q=dest/rel
   if not q.exists():removed.append(rel)
   elif sha(p)!=sha(q):changed.append(rel)
   else:same+=1
 allowed=lambda p:'/dsh-mcp-client/' in p or '/@deepseek-ai+dsh-mcp-client@' in p or '/.bin/' in p
 unexpected=[p for p in changed if not allowed(p)];assert not unexpected,unexpected[:3]
 allowedRemoved=lambda p:p.endswith(('.modules.yaml','.pnpm-workspace-state-v1.json','.pnpm/lock.yaml','.package-lock.json')) or '/@openbkn+dsh-business-context@file+..+private-plugin-fixture+' in p
 assert not [p for p in removed if not allowedRemoved(p)]
 deltas.append({'baseHost':row['baseHostVersion'],'unchangedOriginalRegularDependencyFiles':same,'changedRegularFiles':changed,'removedOriginalFiles':removed,'unexpectedChangedOrRemoved':[],'rootManifestCurated':True,'newToolingLaunchersProvenanceAndNoticesDisclosed':True})
 # All original Desktop files outside the exact overlay payload stay byte-identical.
 runtime=b/'desktop-runtime'/row['key'];before=json.loads((b/'desktop-runtime'/(row['key']+'-stock-files-private.json')).read_text());desktopChanged=[p for p,h in before.items() if not (runtime/p).exists() or sha(runtime/p)!=h]
 assert all(p.startswith('node_modules/@deepseek-ai/dsh-mcp-client/') for p in desktopChanged)
 deltas[-1]['desktopOriginalFilesCompared']=len(before);deltas[-1]['desktopChangedOriginalFiles']=desktopChanged
dump(b/'artifact-receipt.json',{'kind':'local-development-preacceptance','ciRun':None,'formalAcceptanceEligible':False,'artifacts':artifacts});dump(b/'delivery-delta-private.json',deltas)
print(json.dumps({'artifacts':len(artifacts),'deltaAudits':len(deltas),'unexpectedDelta':0}))
