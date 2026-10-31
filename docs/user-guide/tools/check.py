#!/usr/bin/env python3
"""Check bilingual structure, annotation parity, assets, links and standalone HTML."""
from pathlib import Path
import json,re,argparse
from guide_content import validate_sections,figure_step_groups
R=Path(__file__).resolve().parent.parent
def main():
 global R
 parser=argparse.ArgumentParser()
 parser.add_argument('--guide-dir',type=Path,default=R)
 R=parser.parse_args().guide_dir
 zh=json.loads((R/'content.zh.json').read_text(encoding='utf-8'));en=json.loads((R/'content.en.json').read_text(encoding='utf-8'))
 validate_sections(zh);validate_sections(en)
 assert len(zh)==len(en)
 names=[]
 for a,b in zip(zh,en):
  assert a['id']==b['id'] and len(a['steps'])==len(b['steps'])
  assert figure_step_groups(a)==figure_step_groups(b)
  assert len(a['figures'])==len(b['figures'])
  for fa,fb in zip(a['figures'],b['figures']):
   assert fa[0]==fb[0] and [m[:3] for m in fa[2]]==[m[:3] for m in fb[2]]
   assert (R/'images'/fa[0]).is_file();names.append(fa[0])
 assert len(names)==len(set(names))
 for lang in ['zh','en']:
  md=(R/f'README.{lang}.md').read_text(encoding='utf-8');page=(R/f'guide.{lang}.html').read_text(encoding='utf-8')
  assert page.count('src="data:image/png;base64,')==len(names)
  assert len(re.findall('<section id=',page))==len(zh)
  for target in re.findall(r'\]\(([^)]+)\)',md):
   if target.startswith('http'):continue
   if target.startswith('#'):assert target[1:] in [s['id'] for s in zh]
   else:assert (R/target).is_file(),target
  assert not re.search(r'(192\.168\.50\.28|/Users/kalias|code_challenge=|access_token|refresh_token|client_secret)',md+page)
 assert (R/'bkn-dsh-9-user-guide.zh.pdf').stat().st_size>10000
 print(f'PASS: {len(zh)} paired sections, {len(names)} matching annotated images, complete local links and standalone HTML')

if __name__=="__main__":main()
