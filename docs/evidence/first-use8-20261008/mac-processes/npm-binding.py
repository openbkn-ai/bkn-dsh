import json,re,uuid,urllib.request,http.cookiejar,hashlib
from pathlib import Path
root=Path('/tmp/bkn-firstuse8-mac-npm'); port=18320
launch=re.findall(rf'http://127\.0\.0\.1:{port}/\?token=[^\s]+',(root/'host-private.log').read_text())[-1]
jar=http.cookiejar.CookieJar();opener=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar));opener.open(launch).read()
def rpc(method,args):
 body=json.dumps({'type':'client-request','rpcId':str(uuid.uuid4()),'method':method,'payload':{'args':args}}).encode()
 r=json.loads(opener.open(urllib.request.Request(f'http://127.0.0.1:{port}/api/'+method,data=body,headers={'Content-Type':'application/json','Origin':f'http://127.0.0.1:{port}'}),timeout=40).read())['result']
 if r.get('ok') is not True: raise RuntimeError('RPC refused '+method+' code='+r.get('error',{}).get('code','unknown'))
 return r['value']
workspace=root/'workspace-supply';workspace.mkdir(exist_ok=True)
(workspace/'user-canary.txt').write_text('first-use8 user workspace preservation\n')
association=rpc('openbknBusinessContext/bindNetworkWorkspace',{'networkId':'supply_ontology_hand','workspacePath':str(workspace)})
session=rpc('session/create',{'request':{'cwd':str(workspace),'agentPreset':'standard'}})
sid=session['sessionId']
binding=rpc('openbknBusinessContext/bindNetwork',{'sessionId':sid,'networkId':'supply_ontology_hand'})
record={'evidenceLevel':'Official npm Host production RPC, not directory picker UI','workspace':str(workspace),'networkId':association['id'],'sessionId':sid,'binding':binding,'workspaceCanarySha256':hashlib.sha256((workspace/'user-canary.txt').read_bytes()).hexdigest()}
out=Path('/Users/kalias/Documents/project/app/openBKN/bkn-dsh-unified-7/docs/evidence/first-use8-20261008/mac-ui/npm-real-binding-api.json');out.write_text(json.dumps(record,indent=2)+'\n')
print(json.dumps(record))
