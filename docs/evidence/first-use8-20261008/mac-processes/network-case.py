from pathlib import Path
import os,json,subprocess,socket,time,hashlib
root=Path('/tmp/bkn-firstuse8-network-case');root.mkdir(exist_ok=True);(root/'bkn-config').mkdir(exist_ok=True)
repo=Path('/Users/kalias/Documents/project/app/openBKN/bkn-dsh-unified-7');out=repo/'docs/evidence/first-use8-20261008/mac-network-api';out.mkdir(exist_ok=True)
env=os.environ.copy();env.update(DSH_HOME=str(root/'home'),BKN_CONFIG_DIR=str(root/'bkn-config'),BKN_FIRSTUSE8_TEST_ROOT=str(root),BKN_FIRSTUSE8_TEST_PORT='18324');env['PATH']='/Users/kalias/.nvm/versions/node/v24.19.0/bin:'+env['PATH']
cli='/Users/kalias/Documents/project/app/openBKN/dsh-npm-020/node_modules/.bin/dsh';tgz='/tmp/bkn-firstuse8-ci-37725960498/openbkn-dsh-business-context-0.2.0-rc.2-openbkn.0.2.0-8.tgz'
def execute(name,args):
 r=subprocess.run(args,env=env,capture_output=True,text=True);(out/(name+'-native.txt')).write_text(r.stdout+r.stderr);(out/(name+'-exit.json')).write_text(json.dumps({'argv':args,'exitCode':r.returncode})+'\n')
 if r.returncode: raise SystemExit(name+' failed; output captured')
 return r.stdout
execute('install',[cli,'plugin','--profile','web','install',tgz])
shim=root/'controlled-cli.py';shim.write_text('''#!/usr/bin/env python3
import sys,json
args=sys.argv[1:]
if args[:2]==['auth','status']: print(json.dumps({'baseUrl':'https://127.0.0.1:19324','hasToken':True,'expired':False}))
elif args[:2]==['auth','token']: print('first-use8-public-invalid-token')
else: sys.exit(2)
''');shim.chmod(0o700)
probe=socket.socket();assert probe.connect_ex(('127.0.0.1',19324))!=0;probe.close()
execute('start',['python3','/tmp/bkn-firstuse8-host-control.py','start','npm','no-open'])
for _ in range(40):
 p=socket.socket();ok=p.connect_ex(('127.0.0.1',18324))==0;p.close()
 if ok: break
 time.sleep(.25)
execute('configure',['python3','/tmp/bkn-firstuse8-host-api.py','openbknConfiguration/update',json.dumps({'request':{'baseUrl':'https://127.0.0.1:19324','cliPath':str(shim)}})])
status=execute('network-status',['python3','/tmp/bkn-firstuse8-host-api.py','openbknBusinessContext/status'])
# Attempt actual network listing; retain the sanitized product Remote envelope.
listing=execute('network-list',['python3','/tmp/bkn-firstuse8-host-api.py','openbknBusinessContext/listNetworks'])
report=execute('network-report',['python3','/tmp/bkn-firstuse8-host-api.py','openbknDiagnostics/getReport'])
execute('stop',['python3','/tmp/bkn-firstuse8-host-control.py','stop','npm'])
record={'evidenceLevel':'Actual official npm Host API, controlled CLI status/token input; no real-login or UI claim','candidateSource':'23ac2daa6d3538235f33a9627a8178a48f3e1ebf','tgzSHA256':hashlib.sha256(Path(tgz).read_bytes()).hexdigest(),'platform':'https://127.0.0.1:19324','portVerifiedClosedBeforeRequest':True,'storeFileCount':len([p for p in (root/'bkn-config').rglob('*') if p.is_file()]),'fixture':'Public invalid token only; no real OpenBKN token exposed or reused','shimSHA256':hashlib.sha256(shim.read_bytes()).hexdigest()}
(out/'case.json').write_text(json.dumps(record,indent=2)+'\n');print(json.dumps(record))
