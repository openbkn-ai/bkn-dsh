import json,re,uuid,urllib.request,http.cookiejar,os,hashlib,datetime,sys
from pathlib import Path
root=Path(os.environ['BKN_FIRSTUSE8_TEST_ROOT']);port=int(os.environ['BKN_FIRSTUSE8_TEST_PORT']);scenario=os.environ['BKN_FIRSTUSE8_SCENARIO'];out=Path('/tmp/bkn-firstuse8-isolation-results')
log=(root/'host-private.log').read_text();launch=re.findall(rf'http://127\.0\.0\.1:{port}/\?token=[^\s]+',log)[-1]
jar=http.cookiejar.CookieJar();opener=urllib.request.build_opener(urllib.request.ProxyHandler({}),urllib.request.HTTPCookieProcessor(jar))
html=opener.open(launch,timeout=10).read().decode('utf-8')
match=re.search(r'(?:globalThis|window)(?:\["__DSH_BOOT__"\]|\.__DSH_BOOT__)\s*=\s*',html)
if not match:
 raise SystemExit('Boot assignment was not recognized; HTML deliberately not printed or exported')
graph,used=json.JSONDecoder().raw_decode(html[match.end():]);entries=[e for e in graph['entries'] if e['id']=='@openbkn/dsh-business-context']
assert len(entries)==1,'Expected one OpenBKN boot entry'
entry=entries[0];url=urllib.parse.urljoin(f'http://127.0.0.1:{port}/',entry['url']);response=opener.open(url,timeout=10);body=response.read()
record={'scenario':scenario,'observedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'hostPort':port,'bootEntry':entry,'bootGraphRevision':graph.get('rev'),'clientBundle':{'status':response.status,'contentType':response.headers.get('Content-Type'),'bytes':len(body),'sha256':hashlib.sha256(body).hexdigest(),'packageRegistrationPresent':b'@openbkn/dsh-business-context' in body},'evidenceBoundary':'Authenticated Host HTTP boot graph and supplied JavaScript only; no browser module execution or UI acceptance claimed'}
assert record['clientBundle']['status']==200 and record['clientBundle']['packageRegistrationPresent']
(out/(scenario.lower()+'-host-supply.json')).write_text(json.dumps(record,indent=2)+'\n');print(json.dumps(record))
