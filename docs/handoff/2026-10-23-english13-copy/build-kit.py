"""Freeze the copy-only Windows kit from a verified CI artifact; never publish."""
from pathlib import Path
import argparse,base64,hashlib,json,shutil,tarfile,zipfile
p=argparse.ArgumentParser();p.add_argument('--candidate',required=True);p.add_argument('--ci-run',type=int,required=True);p.add_argument('--source',required=True);p.add_argument('--output',required=True);a=p.parse_args()
r=Path(__file__).resolve().parents[3];src=Path(__file__).resolve().parent
old=r/'docs/handoff/2026-10-22-english12-windows/kit';out=Path(a.output).resolve();out.mkdir(parents=True,exist_ok=False)
version='0.2.0-rc.2-openbkn.0.2.0-13';artifact=Path(a.candidate).resolve();raw=artifact.read_bytes()
with tarfile.open(artifact,'r:gz') as t:
    members={m.name.removeprefix('package/'):t.extractfile(m).read() for m in t if m.isfile()}
pkg=json.loads(members['package.json']);assert pkg['version']==version and len(members)==74
for name in ['common.ps1','verify.mjs','Start-Host.ps1','Start-PrivateWebConsole.ps1','Collect-Receipt.ps1','Stop-Host.ps1']:
    s=(old/name).read_text().replace('0.2.0-rc.2-openbkn.0.2.0-12',version).replace('english12-state.json','english13-state.json')
    if name=='common.ps1':
        s=s.replace('function Read-TestState([string]$TestRoot) {','function Read-TestState([string]$TestRoot, $CandidateState = $null) {')
        s=s.replace("$state = Get-Content -LiteralPath (Join-Path $root 'english13-state.json') -Raw | ConvertFrom-Json", "$state = if ($null -ne $CandidateState) { $CandidateState } else { Get-Content -LiteralPath (Join-Path $root 'english13-state.json') -Raw | ConvertFrom-Json }")
        s=s.replace('candidate -12 package','candidate -13 package')
    (out/name).write_text(s,encoding='utf-8')
shutil.copy2(src/'Upgrade-From12.ps1',out/'Upgrade-From12.ps1')
shutil.copy2(src/'WINDOWS-COPY-HANDOFF.zh.md',out/'WINDOWS-COPY-HANDOFF.zh.md')
shutil.copy2(src/'COPY-RESULTS.template.zh.md',out/'COPY-RESULTS.template.zh.md')
(out/'artifacts').mkdir();shutil.copy2(artifact,out/'artifacts'/artifact.name)
pin={'schema':1,'kitVersion':out.name,'plugin':{'name':pkg['name'],'version':version,'file':'artifacts/'+artifact.name,'sha256':hashlib.sha256(raw).hexdigest(),'integrity':'sha512-'+base64.b64encode(hashlib.sha512(raw).digest()).decode(),'sourceCommit':a.source,'ciRun':a.ci_run,'ciUrl':f'https://github.com/openbkn-ai/bkn-dsh/actions/runs/{a.ci_run}','files':len(members),'npmPublished':False},'dsh':{'version':'0.2.0-rc.2','sourceCommit':'639ed015397290b3745d163aafe02ffee4aa3f84'},'scope':'copy-only; reuse existing isolated -12 roots; do not run full acceptance','npmTags':'HOLD rc=-11/latest=-10'}
(out/'pins.json').write_text(json.dumps(pin,indent=2)+'\n')
(out/'package-files.json').write_text(json.dumps({'files':[{'path':n,'sha256':hashlib.sha256(b).hexdigest(),'bytes':len(b)} for n,b in sorted(members.items())]},indent=2)+'\n')
manifest={'files':[{'path':f.relative_to(out).as_posix(),'sha256':hashlib.sha256(f.read_bytes()).hexdigest(),'bytes':f.stat().st_size} for f in sorted(out.rglob('*')) if f.is_file()]}
(out/'kit-files.json').write_text(json.dumps(manifest,indent=2)+'\n')
zpath=out.with_suffix('.zip')
with zipfile.ZipFile(zpath,'x',zipfile.ZIP_DEFLATED) as z:
    for f in sorted(out.rglob('*')):
        if f.is_file():z.write(f,out.name+'/'+f.relative_to(out).as_posix())
digest=hashlib.sha256(zpath.read_bytes()).hexdigest()
zpath.with_suffix('.zip.sha256').write_text(digest+'  '+zpath.name+'\n')
print(json.dumps({'zip':str(zpath),'sha256':digest,'files':len(manifest['files'])+1,'candidateSha256':pin['plugin']['sha256']},indent=2))
