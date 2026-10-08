import subprocess,os,json,time,sys,signal
from pathlib import Path
FORM=sys.argv[2]
ROOT=Path(os.environ.get('BKN_FIRSTUSE8_TEST_ROOT','/tmp/bkn-firstuse8-mac-'+FORM))
ROOT.mkdir(exist_ok=True)
PORT=int(os.environ.get('BKN_FIRSTUSE8_TEST_PORT','18320')) if FORM=='npm' else None
APP='/Applications/DeepSeek Harness.app/Contents/MacOS/DeepSeek Harness'
NPM='/Users/kalias/Documents/project/app/openBKN/dsh-npm-020/node_modules/.bin/dsh'
CA='/Users/kalias/Documents/project/app/openBKN/bkn-dsh-unified-7/docs/handoff/2026-10-07-authentication-recovery/windows-kit/certificates/openbkn-dev-ca.pem'
if sys.argv[1]=='start':
 env=os.environ.copy(); env.update(DSH_HOME=str(ROOT/'home'),BKN_CONFIG_DIR=str(ROOT/'bkn-config'),NODE_EXTRA_CA_CERTS=CA)
 if 'no-ca' in sys.argv: env.pop('NODE_EXTRA_CA_CERTS',None)
 for key in ('NO_PROXY','no_proxy'):
  entries=[part.strip() for part in env.get(key,'').split(',') if part.strip()]
  for address in ('localhost','127.0.0.1','::1','192.168.50.28'):
   if address not in entries: entries.append(address)
  env[key]=','.join(entries)
 env['PATH']='/Users/kalias/.nvm/versions/node/v24.19.0/bin:'+env['PATH']
 (ROOT/'bkn-config').mkdir(exist_ok=True)
 args=[NPM,'web','--port',str(PORT),*(['--no-open'] if 'no-open' in sys.argv else [])] if FORM=='npm' else [APP]
 log=open(ROOT/'host-private.log','ab')
 process=subprocess.Popen(args,env=env,stdout=log,stderr=log,start_new_session=True)
 time.sleep(1)
 created=subprocess.check_output(['ps','-p',str(process.pid),'-o','lstart='],text=True).strip()
 record={'pid':process.pid,'created':created,'argv':args,'root':str(ROOT),'port':PORT,'form':FORM}
 (ROOT/'process.json').write_text(json.dumps(record,indent=2)+'\n')
 (ROOT/'process-history.jsonl').open('a').write(json.dumps(record)+'\n')
 print(json.dumps(record))
else:
 record=json.loads((ROOT/'process.json').read_text());pid=record['pid']
 proc=subprocess.run(['ps','-p',str(pid),'-o','lstart=','-o','args='],capture_output=True,text=True)
 if proc.returncode: print('Already stopped: '+str(pid));sys.exit(0)
 if record['created'] not in proc.stdout or record['argv'][0] not in proc.stdout: raise SystemExit('Refusing PID identity mismatch')
 if record['port'] is not None:
  listen=subprocess.run(['lsof','-t','-iTCP:'+str(record['port']),'-sTCP:LISTEN'],capture_output=True,text=True)
  if str(pid) not in listen.stdout.split(): raise SystemExit('Refusing listener identity mismatch')
 os.kill(pid,signal.SIGTERM)
 for _ in range(40):
  time.sleep(.1)
  if subprocess.run(['ps','-p',str(pid)],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL).returncode: break
 else: raise SystemExit('SIGTERM did not finish')
 line='Stopped owned '+FORM+' pid='+str(pid)+'; creation/argv'+('/listener' if record['port'] else '')+' verified'
 (ROOT/'owned-stop.log').open('a').write(line+'\n');print(line)
