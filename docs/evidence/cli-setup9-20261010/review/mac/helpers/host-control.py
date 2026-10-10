import argparse, datetime, hashlib, json, os, pathlib, signal, subprocess, time
p=argparse.ArgumentParser()
p.add_argument('action', choices=['prepare','start','stop'])
p.add_argument('--form', choices=['npm','desktop'], required=True)
p.add_argument('--package')
p.add_argument('--prefix-name', default='sdk-prefix-review')
p.add_argument('--fixture-only', action='store_true')
a=p.parse_args()
if a.prefix_name not in ['sdk-prefix','sdk-prefix-final','sdk-prefix-review']: raise SystemExit('Unknown isolated prefix')
root=pathlib.Path('/private/tmp/bkn-cli9-mac')/a.form
root.mkdir(parents=True,exist_ok=True)
node=pathlib.Path('/Users/kalias/.nvm/versions/node/v24.19.0/bin/node')
npmcli=pathlib.Path('/Users/kalias/.nvm/versions/node/v24.19.0/lib/node_modules/npm/bin/npm-cli.js')
pnpmcli=pathlib.Path('/Users/kalias/.nvm/versions/node/v24.19.0/lib/node_modules/pnpm/bin/pnpm.cjs')
# Resolve pnpm's actual shipped entry; this is a test bin, not a user PATH edit.
if not pnpmcli.exists(): pnpmcli=pathlib.Path('/Users/kalias/.nvm/versions/node/v24.19.0/lib/node_modules/pnpm/bin/pnpm.mjs')
dsh='/Users/kalias/Documents/project/app/openBKN/dsh-npm-020/node_modules/@deepseek-ai/dsh/lib/bin.js'
app='/Applications/DeepSeek Harness.app/Contents/MacOS/DeepSeek Harness'
controlled_path=str(root/'bin')+':/usr/bin:/bin:/usr/sbin:/sbin'
env=os.environ.copy()
env.update(DSH_HOME=str(root/'home'),BKN_CONFIG_DIR=str(root/'bkn-config'),npm_config_prefix=str(root/a.prefix_name),npm_config_cache=str(root/'npm-cache'),PATH=controlled_path,ZDOTDIR=str(root/'zsh'))
for name in ['BKN_TOKEN','BKN_BASE_URL']: env.pop(name,None)
if a.action=='prepare':
 for directory in ['bin','zsh','bkn-config','sdk-prefix','npm-cache','electron-data']: (root/directory).mkdir(exist_ok=True)
 for name,target in [('node',node),('pnpm',pnpmcli)]:
  out=root/'bin'/name
  if out.exists() or out.is_symlink(): out.unlink()
  if name=='node': out.symlink_to(target)
  else: out.write_text('#!/bin/sh\nexec '+str(node)+' '+str(target)+' "$@"\n'); out.chmod(0o755)
 (root/'mode').write_text('normal')
 (root/'zsh'/'.zprofile').write_text('export PATH="'+controlled_path+'"\n')
 (root/'zsh'/'.zshrc').write_text('export PATH="'+controlled_path+'"\n')
 npmwrapper=root/'bin'/'npm'
 npmwrapper.write_text('#!/usr/bin/python3\nimport os,pathlib,sys,time,json\nr=pathlib.Path('+repr(str(root))+')\nargs=sys.argv[1:]\nif args and args[0]=="install":\n (r/"npm-install-invocations.jsonl").open("a").write(json.dumps({"at":time.time(),"pid":os.getpid(),"args":args})+"\\n")\n mode=(r/"mode").read_text().strip()\n if mode in ["permission","network"]:\n  sys.stderr.write("npm error "+("EACCES" if mode=="permission" else "ECONNRESET")+" SECRET_CANARY\\n"); sys.exit(1)\n if mode=="delay": time.sleep(8)\nos.execv('+repr(str(node))+', ['+repr(str(node))+','+repr(str(npmcli))+']+args)\n')
 npmwrapper.chmod(0o755)
 if a.fixture_only:
  print(json.dumps({'form':a.form,'root':str(root),'prefix':str(root/a.prefix_name),'fixtureOnly':True})); raise SystemExit(0)
 if not a.package: raise SystemExit('--package is required for prepare')
 command=[str(node),dsh,'plugin','install','--profile','web' if a.form=='npm' else 'desktop',str(pathlib.Path(a.package).resolve())]
 started=datetime.datetime.now(datetime.timezone.utc).isoformat()
 with (root/'plugin-install.txt').open('wb') as output: result=subprocess.run(command,env=env,cwd=root,stdout=output,stderr=subprocess.STDOUT)
 (root/'plugin-install-exit.json').write_text(json.dumps({'startedAt':started,'command':command,'exitCode':result.returncode},indent=2)+'\n')
 if result.returncode: raise SystemExit(result.returncode)
 print(json.dumps({'form':a.form,'root':str(root),'profile':'web' if a.form=='npm' else 'desktop','exitCode':0}))
elif a.action=='start':
 args=[str(node),dsh,'web','--port','18420','--no-open'] if a.form=='npm' else [app,'--user-data-dir='+str(root/'electron-data')]
 log=(root/'host-private.log').open('ab')
 process=subprocess.Popen(args,env=env,cwd=root,stdout=log,stderr=log,start_new_session=True)
 time.sleep(1)
 created=subprocess.check_output(['ps','-p',str(process.pid),'-o','lstart='],text=True).strip()
 record={'pid':process.pid,'created':created,'argv':args,'form':a.form,'root':str(root),'port':18420 if a.form=='npm' else None,'startedAt':datetime.datetime.now(datetime.timezone.utc).isoformat()}
 (root/'process.json').write_text(json.dumps(record,indent=2)+'\n')
 (root/'process-history.jsonl').open('a').write(json.dumps(record)+'\n')
 print(json.dumps(record))
else:
 record=json.loads((root/'process.json').read_text()); pid=record['pid']
 proc=subprocess.run(['ps','-p',str(pid),'-o','lstart=','-o','args='],capture_output=True,text=True)
 if proc.returncode: print('Already stopped owned pid='+str(pid)); raise SystemExit(0)
 if record['created'] not in proc.stdout or record['argv'][0] not in proc.stdout: raise SystemExit('Refusing PID creation/command mismatch')
 if record['port'] is not None:
  listening=subprocess.check_output(['lsof','-t','-iTCP:'+str(record['port']),'-sTCP:LISTEN'],text=True).split()
  if str(pid) not in listening: raise SystemExit('Refusing listener mismatch')
 os.kill(pid,signal.SIGTERM)
 for _ in range(80):
  time.sleep(.1)
  if subprocess.run(['ps','-p',str(pid)],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL).returncode: break
 else: raise SystemExit('Owned process did not stop')
 result={'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'pid':pid,'creationVerified':True,'commandVerified':True,'listenerVerified':record['port'] is not None,'stop':'SIGTERM','gone':True}
 (root/'owned-stop.jsonl').open('a').write(json.dumps(result)+'\n')
 print(json.dumps(result))
