from pathlib import Path
import json,hashlib,subprocess,os,datetime,tarfile
r=Path.cwd();b=r/'release/local-58';e=r/'docs/evidence/2026-10-25-local-58';sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();git=lambda *a:subprocess.check_output(['git',*a],text=True)
before=json.loads((b/'preservation-before-private.json').read_text());allow={'CLAUDE.md',*[f'docs/plans/0.2.1/{x}.md' for x in ['README','ACCEPTANCE-CONTRACT','DSH-COMPATIBILITY','NATIVE-CONTRACT','ISSUE-WORKFLOW']]};changed=[p for p,h in before['files'].items() if not (r/p).exists() or sha(r/p)!=h];assert not set(changed)-allow
current=set(git('ls-files','--cached','--others','--exclude-standard','-z').split('\0'))-{''};new=current-set(before['files']);assert all(x.startswith('docs/evidence/2026-10-25-local-58/') for x in new)
index=Path(git('rev-parse','--git-path','index').strip());index=index if index.is_absolute() else r/index;assert sha(index)==before['index'];assert git('rev-parse','HEAD').strip()==before['head'];assert git('worktree','list','--porcelain')==before['worktrees']
protected={};groups=json.loads((r/'release/local-54/preservation-before-private.json').read_text())['extra']
for name,x in groups.items():
 root=Path(x['root']);assert all((root/p).exists() and sha(root/p)==h for p,h in x['files'].items());protected[name]={'filesMatched':len(x['files']),'mismatches':0}
homes=json.loads((b/'source-homes-before-private.json').read_text());homeCounts={}
for root,files in homes.items():assert all(sha(Path(root)/p)==h for p,h in files.items());homeCounts['source-npm' if root.endswith('npm-home') else 'source-desktop']=len(files)
cli=json.loads((b/'cli-original-before-private.json').read_text());assert all(sha(Path(cli['root'])/p)==h for p,h in cli['files'].items())
prior=json.loads((r/'docs/evidence/2026-10-25-local-57/PRESERVATION.json').read_text());frozen={}
for rel,h in prior['frozenInputs'].items():
 p=r/rel if rel.startswith('release/') else Path(groups['handoff']['root'])/rel;assert sha(p)==h;frozen[rel]=h
apps={'old':r/'release/local-32/desktop/0.2.0-rc.2/DeepSeek Harness.app/Contents/Resources/app.asar','new-rc2':r/'release/local-32/desktop/0.2.1-rc.2/DeepSeek Harness.app/Contents/Resources/app.asar','new-rc3':r/'release/local-56/desktop/DeepSeek Harness.app/Contents/Resources/app.asar'};asars={}
for name,p in apps.items():asars[name]=sha(p);assert asars[name]==prior['originalDesktopAsarHashes'][name]
inventory=lambda root:{str(p.relative_to(root)):('link',os.readlink(p)) if p.is_symlink() else ('file',sha(p)) for p in root.rglob('*') if p.is_symlink() or p.is_file()}
artifacts=json.loads((r/'release/local-57/artifact-receipt.json').read_text())['artifacts']
for a in artifacts:assert sha(r/a['path'])==a['sha256']
rows=json.loads((b/'identities-private.json').read_text());runtimeChecks=[]
for row in rows:
 if row['id'].endswith('-retry'):continue
 root=Path(row['hostRoot'])
 if row['profile']=='web':
  for label,directory in [('new-copy',root),('original-r1',next(Path(x['folder']) for x in json.loads((r/'release/local-57/relocated-identities.json').read_text()) if x['key']==row['key']))]:
   z=subprocess.run([str(directory/'tooling/node/bin/node'),str(directory/'scripts/verify-bundle.mjs')],capture_output=True,text=True);assert z.returncode==0,z.stderr
  runtimeChecks.append({'id':row['id'],'newAndOriginalR1BundleIntegrity':'PASS'})
 else:
  baseline=r/'release/local-57/desktop-runtime'/row['key'];actual=inventory(root);assert actual==inventory(baseline);runtimeChecks.append({'id':row['id'],'originalCodeFilesOrLinksMatched':len(actual),'scope':'new full backend runtime vs retained r1 source copy'})
with tarfile.open(r/'release/local-54/final-candidate/openbkn-dsh-business-context-0.2.0-rc.2-openbkn.0.2.0-32.tgz') as tar:wanted={m.name.removeprefix('package/'):hashlib.sha256(tar.extractfile(m).read()).hexdigest() for m in tar.getmembers() if m.isfile()}
for row in rows:
 installed=Path(row['installed']);assert len(wanted)==82 and all(sha(installed/p)==h for p,h in wanted.items())
clean=json.loads((b/'cleanup-collected.json').read_text());assert all(x['exited'] and x['portsReleased'] and not x['pidStillPresent'] for x in clean);assert not json.loads((b/'process-sweep-summary.json').read_text())['taskPathProcessesRemaining']
assert not (b/'admin-login-private.json').exists()
out={'checkedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'head':before['head'],'headIndexAndWorktreeRefsUnchanged':True,'existingMainFilesCompared':len(before['files']),'allowedChangedExistingFiles':changed,'unexpectedExistingOrNewFiles':[],'protectedGroups':protected,'sourceHomeExistingFilesMatched':homeCounts,'personalCliOriginalFilesMatched':len(cli['files']),'personalCliRenewedByThisRun':False,'originalAsarHashes':asars,'frozenInputs':frozen,'originalR1ArtifactArchiveHashesUnchanged':True,'newRuntimeCodeIntegrity':runtimeChecks,'installedFrozen32FilesMatchedPerCopy':82,'ownedHostsExitedIncludingPreparationAttempt':len(clean),'taskPathProcessesRemaining':[],'portsReleased':sorted({p for x in clean for p in x['ports']}),'additionalTemporaryPasswordFileRemoved':True,'credentialWrites':'Only the new isolated CLI stores and DSH vaults; renewed states retained. Normal browser/platform authentication state changes occurred. No credential rollback.','platformReplacedOrConfigChangedByAgent':False,'newBusinessToolOrInteractionRequestedByHarness':False,'platformDatabaseOrSandboxAggregateReaudited':False,'sourceTestsOrCandidateBuildRepeated':False,'pushCIOrRemoteIssueWrite':False,'scope':'Recorded existing files, protected inputs, source homes/CLI, ASAR and runtime code identity; not a whole-machine or database audit.'}
(e/'PRESERVATION.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'main':len(before['files']),'allowedChanged':len(changed),'protectedFiles':sum(x['filesMatched'] for x in protected.values()),'sourceHomeFiles':sum(homeCounts.values()),'personalCliFiles':len(cli['files']),'frozen32PerCopy':82,'unexpected':0}))
