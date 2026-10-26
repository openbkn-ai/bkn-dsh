from pathlib import Path
import os,json,shutil,hashlib,subprocess,tarfile,yaml
r=Path.cwd();b=r/'release/local-58';sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();dump=lambda p,x:p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
candidate=r/'release/local-54/final-candidate/openbkn-dsh-business-context-0.2.0-rc.2-openbkn.0.2.0-32.tgz';assert sha(candidate)=='46626510825fe9146aef12c27a1724acbb455aeac22aa600358add0fc8e1c9f8'
wanted={}
with tarfile.open(candidate) as t:
 for m in t.getmembers():
  if m.isfile():wanted[m.name.removeprefix('package/')]=hashlib.sha256(t.extractfile(m).read()).hexdigest()
assert len(wanted)==82
rows=[];sources={}
for x in json.loads((r/'release/local-57/relocated-identities.json').read_text()):
 root=b/'hosts'/('npm-'+x['key']);assert not root.exists();shutil.copytree(Path(x['folder']),root,symlinks=True)
 rows.append(dict(id='npm-'+x['key'],key=x['key'],form='npm/web',baseHostVersion=x['baseHostVersion'],hostRoot=str(root),runtime=str(root/'runtime'),executable=str(root/'bin/dsh'),node=str(root/'tooling/node/bin/node'),profile='web',distributionId=x['distributionId']))
for x in json.loads((r/'release/local-57/desktop-identities.json').read_text()):
 root=b/'hosts'/('desktop-'+x['key']);assert not root.exists();shutil.copytree(Path(x['folder']),root,symlinks=True)
 rows.append(dict(id='desktop-'+x['key'],key=x['key'],form='Desktop backend only',baseHostVersion=x['baseHostVersion'],hostRoot=str(root),runtime=str(root),executable=x['electron'],node=x['electron'],profile='desktop',hostEntry=str(root/'node_modules/@deepseek-ai/dsh-desktop-host/lib/index.js'),primaryRuntime=x['primaryRuntime'],distributionId='openbkn-desktop-backend-'+x['key']+'-same-origin-r1-mac-arm64'))
for row in rows:
 run=b/'runs'/row['id'];run.mkdir(parents=True);src=r/('release/local-56/npm-home' if row['profile']=='web' else 'release/local-56/home');home=run/'home';cli=run/'cli-config';sourceFiles={}
 for parent,ds,fs in os.walk(src):
  ds[:]=[n for n in ds if n!='node_modules']
  for n in fs:
   p=Path(parent)/n;assert not p.is_symlink();sourceFiles[str(p.relative_to(src))]=sha(p)
 sources[str(src)]=sourceFiles
 # Dependencies are copied only for the actual selected installed profile.
 shutil.copytree(src,home,ignore=shutil.ignore_patterns('node_modules'),symlinks=True)
 profile=home/'profiles'/row['profile'];shutil.copytree(src/'profiles'/row['profile']/'node_modules',profile/'node_modules',symlinks=True)
 installed=profile/'node_modules/@openbkn/dsh-business-context';assert all(sha(installed/rel)==h for rel,h in wanted.items())
 actual=[str(p.relative_to(installed)) for p in installed.rglob('*') if p.is_file()];assert set(actual)==set(wanted)
 shutil.copytree(Path.home()/'.bkn',cli,symlinks=False)
 # Only this new profile receives the verification entry. Product settings stay intact.
 patch=profile/'cordis.patch.yml';entries=yaml.safe_load(patch.read_text());entries.append({'insert':[{'id':'local58-actual-plugin-auth-proof','name':str(b/'actual-auth-probe.mjs')}]});patch.write_text(yaml.safe_dump(entries,allow_unicode=True,sort_keys=False))
 if row['profile']=='web':dump(home/'OPENBKN-HOST-ISOLATION.json',{'distributionId':row['distributionId'],'baseHostVersion':row['baseHostVersion'],'createdFor':'new local58 copy; originals preserved'})
 row.update(run=str(run),home=str(home),cliConfig=str(cli),profileDir=str(profile),installed=str(installed),candidateFilesMatched=82)
dump(b/'identities-private.json',rows);dump(b/'source-homes-before-private.json',sources);print(json.dumps({'newHosts':len(rows),'candidateFilesMatchedPerHost':82,'sourceHomes':len(sources)}))
