from pathlib import Path
import tarfile,gzip,json,hashlib,os
b=Path(__file__).resolve().parent;out=b/'artifacts';out.mkdir();relocated=b/'relocated'/'path with spaces';relocated.mkdir(parents=True);rows=[]
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
for item in json.loads((b/'assembly-identities.json').read_text()):
 root=Path(item['folder']);archive=out/(root.name+'.tar.gz')
 def normalized(info):
  info.uid=info.gid=0;info.uname=info.gname='';info.mtime=0;info.pax_headers={};return info
 with archive.open('wb') as raw:
  with gzip.GzipFile(fileobj=raw,mode='wb',filename='',mtime=0,compresslevel=1) as zipped:
   with tarfile.open(fileobj=zipped,mode='w|',format=tarfile.PAX_FORMAT) as tar:tar.add(root,arcname=root.name,filter=normalized)
 # Trusted local artifact; reject links escaping the root before extraction.
 with tarfile.open(archive,'r:gz') as tar:
  for mem in tar.getmembers():
   p=Path(mem.name);assert not p.is_absolute() and '..' not in p.parts
   if mem.issym():assert not Path(mem.linkname).is_absolute() and (relocated/p.parent/mem.linkname).resolve().is_relative_to(relocated/root.name)
   assert not mem.islnk(),'Unexpected hardlink'
  tar.extractall(relocated,filter='fully_trusted')
 rows.append({**item,'folder':str(relocated/root.name),'archive':str(archive),'archiveSha256':sha(archive),'archiveBytes':archive.stat().st_size,'extractedAtPathWithSpaces':True})
 print(json.dumps({'key':item['key'],'bytes':archive.stat().st_size,'sha256':rows[-1]['archiveSha256']}),flush=True)
(b/'relocated-identities.json').write_text(json.dumps(rows,indent=2)+'\n')
