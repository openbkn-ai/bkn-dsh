from pathlib import Path
import os,json,subprocess,hashlib
root=Path('/tmp/bkn-firstuse8-network-case');repo=Path('/Users/kalias/Documents/project/app/openBKN/bkn-dsh-unified-7');out=repo/'docs/evidence/first-use8-20261008/mac-network-api'
env=os.environ.copy();env.update(DSH_HOME=str(root/'home'),BKN_CONFIG_DIR=str(root/'bkn-config'),BKN_FIRSTUSE8_TEST_ROOT=str(root),BKN_FIRSTUSE8_TEST_PORT='18324');env['PATH']='/Users/kalias/.nvm/versions/node/v24.19.0/bin:'+env['PATH']
def execute(name,args):
 r=subprocess.run(args,env=env,capture_output=True,text=True);(out/(name+'-native.txt')).write_text(r.stdout+r.stderr);(out/(name+'-exit.json')).write_text(json.dumps({'argv':args,'exitCode':r.returncode})+'\n')
 if r.returncode: raise SystemExit(name+' failed; output captured')
 return r.stdout
execute('configure-2',['python3','/tmp/bkn-firstuse8-host-api.py','openbknConfiguration/saveConfiguration',json.dumps({'input':{'baseUrl':'https://127.0.0.1:19324','cliPath':str(root/'controlled-cli.py')}})])
execute('network-status',['python3','/tmp/bkn-firstuse8-host-api.py','openbknBusinessContext/status'])
execute('network-list',['python3','/tmp/bkn-firstuse8-host-api.py','openbknBusinessContext/listNetworks'])
execute('network-report',['python3','/tmp/bkn-firstuse8-host-api.py','openbknDiagnostics/getReport'])
execute('stop',['python3','/tmp/bkn-firstuse8-host-control.py','stop','npm'])
patch=root/'home/profiles/web/cordis.patch.yml';healthy=patch.read_bytes()
# Isolated persisted malformed input, separate from UI form validation.
patch.write_text('- id: openbkn-business-context\n  name: "@openbkn/dsh-business-context/business"\n  config:\n    baseUrl: "ht!tp://not a valid url with spaces"\n    cliPath: '+str(root/'controlled-cli.py')+'\n')
execute('invalid-start',['python3','/tmp/bkn-firstuse8-host-control.py','start','npm','no-open'])
execute('invalid-report',['python3','/tmp/bkn-firstuse8-host-api.py','openbknDiagnostics/getReport'])
execute('invalid-stop',['python3','/tmp/bkn-firstuse8-host-control.py','stop','npm'])
patch.write_bytes(healthy)
record={'evidenceLevel':'Actual official npm Host API, controlled CLI status/token input; no real-login or UI claim','candidateSource':'23ac2daa6d3538235f33a9627a8178a48f3e1ebf','tgzSHA256':hashlib.sha256(Path('/tmp/bkn-firstuse8-ci-37725960498/openbkn-dsh-business-context-0.2.0-rc.2-openbkn.0.2.0-8.tgz').read_bytes()).hexdigest(),'platform':'https://127.0.0.1:19324','portVerifiedClosedBeforeRequest':True,'storeFileCount':len([p for p in (root/'bkn-config').rglob('*') if p.is_file()]),'fixture':'Public invalid token only; no real OpenBKN token exposed or reused','helperAttempt1':'Used nonexistent update method, returned HTTP404 before configuration; retained; corrected to declared saveConfiguration(input) method','healthyPatchRestoredAfterStop':patch.read_bytes()==healthy}
(out/'case.json').write_text(json.dumps(record,indent=2)+'\n')
for name in ['network-report','invalid-report']:
 report=json.loads((out/(name+'-native.txt')).read_text())['result']['value'];print(json.dumps({'case':name,'reportId':report['reportId'],'checks':report.get('checks')}))
print(json.dumps(record))
