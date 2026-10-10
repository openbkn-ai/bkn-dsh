#!/usr/bin/python3
import os,pathlib,sys,time,json
r=pathlib.Path('/private/tmp/bkn-cli9-mac/npm')
args=sys.argv[1:]
if args and args[0]=="install":
 (r/"npm-install-invocations.jsonl").open("a").write(json.dumps({"at":time.time(),"pid":os.getpid(),"args":args})+"\n")
 mode=(r/"mode").read_text().strip()
 if mode in ["permission","network"]:
  sys.stderr.write("npm error "+("EACCES" if mode=="permission" else "ECONNRESET")+" SECRET_CANARY\n"); sys.exit(1)
 if mode=="delay": time.sleep(8)
os.execv('/Users/kalias/.nvm/versions/node/v24.19.0/bin/node', ['/Users/kalias/.nvm/versions/node/v24.19.0/bin/node','/Users/kalias/.nvm/versions/node/v24.19.0/lib/node_modules/npm/bin/npm-cli.js']+args)
