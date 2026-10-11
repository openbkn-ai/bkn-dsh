#!/usr/bin/env python3
"""Check bilingual structure, annotation parity, assets, links and standalone HTML."""
from pathlib import Path
import json,re
R=Path(__file__).resolve().parent.parent
zh=json.loads((R/'content.zh.json').read_text());en=json.loads((R/'content.en.json').read_text())
assert len(zh)==len(en)==14
names=[]
for a,b in zip(zh,en):
 assert a['id']==b['id'] and len(a['steps'])==len(b['steps'])
 assert len(a['figures'])==len(b['figures'])
 for fa,fb in zip(a['figures'],b['figures']):
  assert fa[0]==fb[0] and [m[:3] for m in fa[2]]==[m[:3] for m in fb[2]]
  assert (R/'images'/fa[0]).is_file();names.append(fa[0])
assert len(names)==len(set(names))==19
for lang in ['zh','en']:
 md=(R/f'README.{lang}.md').read_text();page=(R/f'guide.{lang}.html').read_text()
 assert page.count('src="data:image/png;base64,')==19
 assert len(re.findall('<section id=',page))==14
 for target in re.findall(r'\]\(([^)]+)\)',md):
  if target.startswith('http'):continue
  if target.startswith('#'):assert target[1:] in [s['id'] for s in zh]
  else:assert (R/target).is_file(),target
 assert not re.search(r'(192\.168\.50\.28|/Users/kalias|code_challenge=|access_token|refresh_token|client_secret)',md+page)
assert (R/'bkn-dsh-9-user-guide.zh.pdf').stat().st_size>10000
print('PASS: 14 paired sections, 19 matching annotated images, complete local links and standalone HTML')
