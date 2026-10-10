"""Stop only a recorded test Host, preserving the native identity output first."""
import argparse, datetime, json, os, pathlib, re, signal, subprocess, time

p = argparse.ArgumentParser()
p.add_argument('--form', choices=['npm', 'desktop'], required=True)
p.add_argument('--output', required=True)
a = p.parse_args()
root = pathlib.Path('/private/tmp/bkn-cli9-mac') / a.form
record = json.loads((root / 'process.json').read_text())
pid = record['pid']
port = 18420 if a.form == 'npm' else 18421

def run(argv):
    result = subprocess.run(argv, capture_output=True, text=True)
    return {'command': argv, 'exitCode': result.returncode,
            'stdout': result.stdout, 'stderr': result.stderr}

def scrub(text):
    return re.sub(r'(--(?:launch-)?token(?:=|\s+))\S+', r'\1[redacted]', text)

table = run(['ps', '-axo', 'pid=,ppid=,args='])
rows = {}
for line in table['stdout'].splitlines():
    parts = line.split(None, 2)
    if len(parts) == 3:
        rows[int(parts[0])] = (int(parts[1]), parts[2])
owned = {pid}
while True:
    enlarged = owned | {child for child, (parent, _) in rows.items() if parent in owned}
    if enlarged == owned: break
    owned = enlarged

processes = []
for child in sorted(owned):
    native = run(['ps', '-p', str(child), '-o', 'lstart=', '-o', 'comm=', '-o', 'args='])
    native['stdout'] = scrub(native['stdout'])
    processes.append({'pid': child, 'native': native})
creation = run(['ps', '-p', str(pid), '-o', 'lstart='])
exe = run(['ps', '-p', str(pid), '-o', 'comm='])
listener = run(['lsof', '-nP', '-t', '-iTCP:' + str(port), '-sTCP:LISTEN'])
listeners = {int(value) for value in listener['stdout'].split()}
verified = creation['stdout'].strip() == record['created'] and exe['stdout'].strip() == record['argv'][0]
verified = verified and bool(listeners) and listeners <= owned
if not verified: raise SystemExit('Refusing test Host creation/executable/listener mismatch')
os.kill(pid, signal.SIGTERM)
for _ in range(100):
    if subprocess.run(['ps', '-p', str(pid)], stdout=subprocess.DEVNULL,
                      stderr=subprocess.DEVNULL).returncode: break
    time.sleep(.1)
remaining = [child for child in sorted(owned) if subprocess.run(
    ['ps', '-p', str(child)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL).returncode == 0]
after_listener = run(['lsof', '-nP', '-iTCP:' + str(port), '-sTCP:LISTEN'])
out = {'at': datetime.datetime.now(datetime.timezone.utc).isoformat(),
       'form': a.form, 'record': record, 'ownedProcesses': processes,
       'creation': creation, 'executable': exe, 'listener': listener,
       'identityVerified': verified, 'stop': 'SIGTERM',
       'remainingOwnedPids': remaining, 'afterListener': after_listener}
pathlib.Path(a.output).write_text(json.dumps(out, indent=2) + '\n')
print(json.dumps({'form': a.form, 'identityVerified': verified,
                  'remainingOwnedPids': remaining, 'portClear': after_listener['stdout'] == ''}))
if remaining or after_listener['stdout']: raise SystemExit(1)
