#!/usr/bin/env python3
"""Build GitHub Markdown and standalone HTML from bilingual guide content."""
from pathlib import Path
import json,base64,html,re
ROOT=Path(__file__).resolve().parent.parent
CSS='''*{box-sizing:border-box}body{margin:0;background:#f3f6f8;color:#17313b;font:17px/1.8 -apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif}header{padding:44px 6%;background:#123f48;color:#fff}h1{font-size:36px;margin:12px 0}header a{color:#b6eadc}.layout{display:grid;grid-template-columns:235px minmax(0,1050px);gap:28px;max-width:1380px;margin:auto;padding:30px 20px}nav{position:sticky;top:20px;max-height:95vh;overflow:auto}nav a{display:block;color:#365d66;text-decoration:none;font-size:14px;padding:8px 10px}nav a:hover{background:#dfeeea}section{background:#fff;border-radius:12px;padding:28px;margin-bottom:22px;scroll-margin-top:20px}h2{font-size:27px;line-height:1.4;margin:0 0 12px}li{margin:7px 0}figure{margin:22px 0}figure img{width:100%;display:block;border:1px solid #d5e1e6;border-radius:8px;cursor:zoom-in}figcaption{font-size:14px;color:#536c76;margin-top:8px}.legend{display:flex;gap:8px 20px;flex-wrap:wrap}.legend b{display:inline-grid;place-items:center;background:#db3c34;color:white;border-radius:50%;width:22px;height:22px;margin-right:5px}aside{background:#fff7e8;border-left:4px solid #d4a64e;padding:14px 18px;font-size:15px}pre{background:#edf4f5;padding:15px;white-space:pre-wrap;font-size:15px}code{overflow-wrap:anywhere}table{border-collapse:collapse;width:100%;font-size:15px}td,th{border:1px solid #dbe6e9;padding:10px;text-align:left}button{border:0;border-radius:7px;padding:10px 14px;background:#d3eee7;cursor:pointer}dialog{border:0;padding:10px;max-width:96vw;max-height:96vh}dialog img{max-width:92vw;max-height:87vh}dialog::backdrop{background:#10232ddd}footer{padding:20px;color:#607883;font-size:13px}@media(max-width:850px){.layout{display:block;padding:12px}nav{position:static;max-height:none;display:flex;flex-wrap:wrap}section{padding:20px}h1{font-size:30px}}@media print{@page{size:A4;margin:12mm}nav,button,dialog{display:none}body{background:white;font-size:11pt}.layout{display:block;padding:0}header{background:white;color:#123f48;padding:0}header a{color:inherit}section{padding:0;border-radius:0;break-inside:auto}figure{break-inside:avoid}h2{break-after:avoid}aside{font-size:10pt}}'''
def mdtext(t):
 t=re.sub(r'<pre>(.*?)</pre>',lambda m:'\n\n```text\n'+html.unescape(re.sub('<[^>]+>','',m[1]))+'\n```\n',t,flags=re.S)
 t=re.sub(r'<a href="([^"]+)">(.*?)</a>',r'[\2](\1)',t)
 t=t.replace('<code>','`').replace('</code>','`')
 if '<table>' in t:
  rows=re.findall(r'<tr>(.*?)</tr>',t); cells=[re.findall(r'<t[hd]>(.*?)</t[hd]>',r) for r in rows]
  t='\n'.join(['| '+' | '.join(cells[0])+' |','| --- | --- |']+['| '+' | '.join(r)+' |' for r in cells[1:]])
 return t
for lang in ['zh','en']:
 ss=json.loads((ROOT/f'content.{lang}.json').read_text());iszh=lang=='zh'
 title='bkn-dsh -9 图文使用手册' if iszh else 'bkn-dsh -9 Illustrated User Guide'
 other='en' if iszh else 'zh';otherlabel='English' if iszh else '中文'
 subtitle='安装 · 登录 · 供应链问答 · 溯源 · 诊断' if iszh else 'Install · Sign in · Supply-chain Q&A · Provenance · Diagnostics'
 meta='DSH 0.2.0-rc.2 · Plugin 0.2.0-rc.2-openbkn.0.2.0-9 · 2026-10-11'
 explanation='截图来自中文界面；红色数字与图下说明对应。账号名、平台地址、本机路径和执行标识的展示已替换为示例，不改变操作控件或业务结果。' if iszh else 'Screenshots use the Chinese UI. Match the red numbers to the legends. Account labels, platform addresses, local paths and execution identifiers use examples; controls and business results are unchanged.'
 md=f'# {title}\n\n[{otherlabel}](README.{other}.md) · [HTML](guide.{lang}.html)'+(' · [PDF](bkn-dsh-9-user-guide.zh.pdf)' if iszh else ' · [Chinese PDF](bkn-dsh-9-user-guide.zh.pdf)')+f'\n\n{meta}\n\n{subtitle}\n\n{explanation}\n\n'
 md+='## '+('目录' if iszh else 'Contents')+'\n\n'+'\n'.join(f'- [{s["title"]}](#{s["id"]})' for s in ss)+'\n\n'
 body=''
 for s in ss:
  md+=f'<a id="{s["id"]}"></a>\n\n## {s["title"]}\n\n{mdtext(s["intro"])}\n\n'
  body+=f'<section id="{s["id"]}"><h2>{html.escape(s["title"])}</h2><p>{s["intro"]}</p><ol>'
  for i,v in enumerate(s['steps'],1):md+=f'{i}. {mdtext(v)}\n';body+='<li>'+v+'</li>'
  md+='\n';body+='</ol>'
  for name,cap,marks in s['figures']:
   image=ROOT/'images'/name
   if not image.exists():raise FileNotFoundError(image)
   md+=f'![{cap}](images/{name})\n\n*{cap}*\n\n'+' · '.join(f'**{n}** {label}' for n,x,y,label in marks)+'\n\n'
   data=base64.b64encode(image.read_bytes()).decode()
   body+=f'<figure><img src="data:image/png;base64,{data}" alt="{html.escape(cap)}"><figcaption>{html.escape(cap)}<div class="legend">'+''.join(f'<span><b>{n}</b>{html.escape(label)}</span>' for n,x,y,label in marks)+'</div></figcaption></figure>'
  if s['note']:md+='> '+mdtext(s['note'])+'\n\n';body+='<aside>'+s['note']+'</aside>'
  body+='</section>'
 (ROOT/f'README.{lang}.md').write_text(md.rstrip()+'\n')
 nav=''.join(f'<a href="#{s["id"]}">{html.escape(s["title"])}</a>' for s in ss)
 printlabel='打印 / 保存 PDF' if iszh else 'Print / Save PDF';closelabel='关闭' if iszh else 'Close'
 page=f'''<!doctype html><html lang="{lang}"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{title}</title><style>{CSS}</style><header><a href="guide.{other}.html">{otherlabel}</a><h1>{title}</h1><p>{subtitle}<br>{meta}</p><p>{explanation}</p><button onclick="window.print()">{printlabel}</button></header><div class="layout"><nav>{nav}</nav><main>{body}<footer>OpenBKN · Illustrated user guide · 19 annotated screenshots</footer></main></div><dialog id="zoom"><button onclick="this.parentElement.close()">{closelabel}</button><div></div></dialog><script>document.querySelectorAll('figure img').forEach(e=>e.onclick=()=>{{let d=document.querySelector('#zoom');d.querySelector('div').innerHTML=e.outerHTML;d.showModal()}});document.querySelector('#zoom').onclick=e=>{{if(e.target.id==='zoom')e.target.close()}};</script></html>'''
 (ROOT/f'guide.{lang}.html').write_text(page)
 print(lang,len(ss),'sections',len(page),'HTML characters')
