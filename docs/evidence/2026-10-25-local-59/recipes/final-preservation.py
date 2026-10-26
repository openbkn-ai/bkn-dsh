from pathlib import Path
import json,hashlib,subprocess,datetime
r=Path.cwd();b=r/'release/local-59';e=r/'docs/evidence/2026-10-25-local-59';sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();git=lambda *a:subprocess.check_output(['git',*a],text=True)
before=json.loads((b/'preservation-before-private.json').read_text());allow={'CLAUDE.md',*[f'docs/plans/0.2.1/{x}.md' for x in ['README','ACCEPTANCE-CONTRACT','DSH-COMPATIBILITY','NATIVE-CONTRACT','ISSUE-WORKFLOW']]};changed=[p for p,h in before['files'].items() if not (r/p).exists() or sha(r/p)!=h];assert not set(changed)-allow
new=set(git('ls-files','--cached','--others','--exclude-standard','-z').split('\0'))-{''}-set(before['files']);assert all(x.startswith(('docs/evidence/2026-10-25-local-59/','docs/handoff/2026-10-25-021-host-backport-windows-r1/')) for x in new)
index=Path(git('rev-parse','--git-path','index').strip());index=index if index.is_absolute() else r/index;assert sha(index)==before['index'];assert git('rev-parse','HEAD').strip()==before['head'];assert git('worktree','list','--porcelain')==before['worktrees']
groups=json.loads((r/'release/local-54/preservation-before-private.json').read_text())['extra'];protected={}
for name,x in groups.items():
 root=Path(x['root']);assert all((root/p).exists() and sha(root/p)==h for p,h in x['files'].items());protected[name]={'filesMatched':len(x['files']),'mismatches':0}
homes=json.loads((r/'release/local-58/source-homes-before-private.json').read_text());homeCount=0
for root,files in homes.items():assert all(sha(Path(root)/p)==h for p,h in files.items());homeCount+=len(files)
cli=json.loads((r/'release/local-58/cli-original-before-private.json').read_text());assert all(sha(Path(cli['root'])/p)==h for p,h in cli['files'].items())
prior=json.loads((r/'docs/evidence/2026-10-25-local-58/PRESERVATION.json').read_text());frozen={}
for rel,h in prior['frozenInputs'].items():
 p=r/rel if rel.startswith('release/') else Path(groups['handoff']['root'])/rel;assert sha(p)==h;frozen[rel]=h
apps={'old':r/'release/local-32/desktop/0.2.0-rc.2/DeepSeek Harness.app/Contents/Resources/app.asar','new-rc2':r/'release/local-32/desktop/0.2.1-rc.2/DeepSeek Harness.app/Contents/Resources/app.asar','new-rc3':r/'release/local-56/desktop/DeepSeek Harness.app/Contents/Resources/app.asar'};asars={}
for name,p in apps.items():asars[name]=sha(p);assert asars[name]==prior['originalAsarHashes'][name]
for a in json.loads((r/'release/local-57/artifact-receipt.json').read_text())['artifacts']:assert sha(r/a['path'])==a['sha256']
src=json.loads((e/'SOURCE-REVIEW.json').read_text());roots={'old':r/'release/local-53/source-build/old','rc3':r/'release/local-53/upstreams/dsh-rc3'}
for row in src:assert sha(roots[row['base']]/row['path'])==row['sha256']
handoff=r/'docs/handoff/2026-10-25-021-host-backport-windows-r1';manifest=json.loads((handoff/'HANDOFF-FILES.json').read_text());assert all(sha(handoff/p)==h for p,h in manifest.items())
out={'checkedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'head':before['head'],'headIndexAndWorktreeRefsUnchanged':True,'mainExistingFilesCompared':len(before['files']),'allowedChangedExistingFiles':changed,'unexpectedExistingOrNewFiles':[],'protectedGroups':protected,'sourceHomeFilesMatched':homeCount,'personalCliFilesMatched':len(cli['files']),'originalAsarHashes':asars,'frozenInputs':frozen,'retainedR1ArchiveHashesUnchanged':True,'reviewedSourceFilesMatched':len(src),'handoffManifestEntriesMatched':len(manifest),'sourceGuiImplementationChanged':False,'hostOrGuiStarted':False,'cliLoginModelOrBusinessToolCalled':False,'signedOrNotarized':False,'globalProtocolOrCliRegistrationPerformed':False,'certificateTrustChanged':False,'platformServiceOrDataConfigChanged':False,'platformDatabaseReaudited':False,'pushCIOrRemoteIssueWrite':False,'scope':'Recorded original files/homes/CLI/ASAR, frozen inputs and reviewed source; not a full-machine or database audit.'}
(e/'PRESERVATION.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'existingMainFiles':len(before['files']),'allowedChanged':len(changed),'protectedFiles':sum(x['filesMatched'] for x in protected.values()),'sourceHomes':homeCount,'personalCli':len(cli['files']),'reviewedSourceFiles':len(src),'unexpected':0}))
