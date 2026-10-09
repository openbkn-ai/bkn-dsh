import json,re,sys,uuid,urllib.request,http.cookiejar,os
from pathlib import Path
root=Path(os.environ.get('BKN_FIRSTUSE8_TEST_ROOT','/tmp/bkn-firstuse8-mac-npm'))
port=int(os.environ.get('BKN_FIRSTUSE8_TEST_PORT','18320'))
text=(root/'host-private.log').read_text()
launch=re.findall(rf'http://127\.0\.0\.1:{port}/\?token=[^\s]+',text)[-1]
(root/'launch-private.url').write_text(launch);(root/'launch-private.url').chmod(0o600)
jar=http.cookiejar.CookieJar();opener=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))
opener.open(launch,timeout=10).read()
method=sys.argv[1]
args=json.loads(sys.argv[2]) if len(sys.argv)>2 else {}
body=json.dumps({'type':'client-request','rpcId':str(uuid.uuid4()),'method':method,'payload':{'args':args}}).encode()
request=urllib.request.Request(f'http://127.0.0.1:{port}/api/'+method,data=body,headers={'Content-Type':'application/json','Origin':f'http://127.0.0.1:{port}'})
result=json.loads(opener.open(request,timeout=40).read())
print(json.dumps(result,ensure_ascii=False,indent=2))
