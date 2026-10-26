from pathlib import Path
import json,sys,hashlib,os,shutil
b=Path(__file__).resolve().parent;key=sys.argv[1]
row=next(x for x in json.loads((b/'assembly-identities.json').read_text()) if x['key']==key)
src=Path(row['folder'])/row['mcpPackagePath'];runtime=b/'desktop-runtime'/key;dest=runtime/'node_modules/@deepseek-ai/dsh-mcp-client'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
assert sha(dest/'lib/index.js')=='758d8fc473b700b5d351158d06ce9f9e92c16e8b25497b08bb7bd2122a87f5dd','Only the frozen original may be overlaid'
assert dest.resolve().is_relative_to(runtime.resolve())
files=['lib/index.js','package.json','MCP-SDK-LICENSE.txt','DSH-LICENSE.txt','LICENSES.md','HOST-BACKPORT.json']+[str(p.relative_to(src)) for p in (src/'lib/types').rglob('*.d.ts')]
# Copy payload only; exclude npm/pnpm package-local node_modules and bin wrappers.
for rel in files:
 target=dest/rel;target.parent.mkdir(parents=True,exist_ok=True);tmp=target.with_name(target.name+'.local57-new');shutil.copyfile(src/rel,tmp);os.replace(tmp,target)
meta=json.loads((dest/'HOST-BACKPORT.json').read_text());meta.update(distributionId='openbkn-desktop-backend-'+key+'-same-origin-r1-mac-arm64',kind='local-development-backend-preacceptance',scope='Extracted official Desktop backend copy only; original signed app and GUI unmodified')
(dest/'HOST-BACKPORT.json').write_text(json.dumps(meta,indent=2)+'\n')
pkg=json.loads((dest/'package.json').read_text());pkg['openbknSecurityBackport']['distributionId']=meta['distributionId'];(dest/'package.json').write_text(json.dumps(pkg,indent=2)+'\n')
result={'baseHost':row['baseHostVersion'],'key':key,'distributionId':meta['distributionId'],'filesApplied':{rel:sha(dest/rel) for rel in files},'existingSignedAppChanged':False,'atomicPayloadReplacement':True,'dependencyDirectoriesCopied':False}
(b/('desktop-overlay-'+key+'.json')).write_text(json.dumps(result,indent=2)+'\n');print(json.dumps({'key':key,'files':len(files),'mcpSha256':sha(dest/'lib/index.js')}))
