from pathlib import Path
from datetime import datetime,timezone
import json,hashlib,sys
form,phase=sys.argv[1:3];root=Path('/tmp/bkn-firstuse8-mac-'+form);profile='web' if form=='npm' else 'desktop'
base=Path('/Users/kalias/Documents/project/app/openBKN/bkn-dsh-unified-7/docs/evidence/first-use8-20261008/mac-ui')
beforepath=base/(form+'-f8-before.json')
if phase=='before':
 paths=[root/'home/profiles'/profile/'cordis.patch.yml']
 paths += [p for p in (root/'home/openbkn').rglob('*') if p.is_file()]
 paths += [root/'home/storages/openbkn_workspace_bindings.json',root/'workspace-supply/user-canary.txt']
 paths += [p for p in (root/'bkn-config').rglob('*') if p.is_file()]
else: paths=[Path(x['path']) for x in json.loads(beforepath.read_text())['files']]
records=[dict(path=str(p),exists=p.is_file(),bytes=p.stat().st_size if p.is_file() else None,sha256=hashlib.sha256(p.read_bytes()).hexdigest() if p.is_file() else None) for p in sorted(set(paths))]
manifest=json.loads((root/'home/profiles'/profile/'package.json').read_text());pkgroot=root/'home/profiles'/profile/'node_modules/@openbkn/dsh-business-context'
record=dict(form=form,phase=phase,recordedAt=datetime.now(timezone.utc).isoformat(),scope='Same selected plugin configuration, session/workspace binding, workspace canary and isolated CLI-store files; no full-home claim',files=records,packageExists=pkgroot.exists(),dependency=manifest.get('dependencies',{}).get('@openbkn/dsh-business-context'))
if phase!='before': record['sameSelectedBytes']=records==json.loads(beforepath.read_text())['files']
(base/(form+'-f8-'+phase+'.json')).write_text(json.dumps(record,indent=2)+'\n')
print(json.dumps({k:v for k,v in record.items() if k!='files'}));print('selected files:',len(records))
