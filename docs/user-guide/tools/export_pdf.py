from pathlib import Path
import json,re,html
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.colors import HexColor,white
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from PIL import Image
import argparse,tempfile
from guide_content import validate_sections, figure_step_groups
GUIDE=Path(__file__).resolve().parent.parent
W,H=595.28,740;M=34;U=W-2*M;BOTTOM=42;TOP=H-51
S=ParagraphStyle('body',fontName='CN',fontSize=10.5,leading=16,wordWrap='CJK',textColor=HexColor('#243d46'))
SM=ParagraphStyle('small',parent=S,fontSize=9,leading=13)
HEAD=ParagraphStyle('head',parent=S,fontSize=18,leading=26,textColor=HexColor('#123f48'))
CAP=ParagraphStyle('cap',parent=S,fontSize=11,leading=16)
def clean(t):
 t=t.replace('<code>','').replace('</code>','').replace('<pre>','<br/><br/>').replace('</pre>','<br/>')
 return t

def pobj(t,st=S):
 p=Paragraph(clean(t),st);_,h=p.wrap(U,1000);return p,h

def pheight(t,st=S):return pobj(t,st)[1]+7

def render(previous_toc=()):
 c=canvas.Canvas(str(OUT),pagesize=(W,H));c.setTitle('bkn-dsh -9 图文使用手册 · 紧凑版');c.setAuthor('OpenBKN')
 page=0;y=0;toc=[];limits=[]
 def new(label='bkn-dsh -9 · 图文使用手册'):
  nonlocal page,y
  if page:c.showPage()
  page+=1;c.setFont('CN',8);c.setFillColor(HexColor('#466570'));c.drawString(M,H-24,label)
  c.setStrokeColor(HexColor('#dbe6e9'));c.line(M,H-32,W-M,H-32)
  c.setFont('CN',8);c.drawString(M,21,'DSH 0.2.0-rc.2 · OpenBKN 插件 -9');c.drawRightString(W-M,21,str(page));y=TOP
 def para(t,st=S):
  nonlocal y
  p,h=pobj(t,st)
  if y-h<BOTTOM:new()
  p.drawOn(c,M,y-h);y-=h+7;limits.append(y)
 def ensure(h,label):
  if y-h<BOTTOM:new(label)
 new();para('bkn-dsh -9 图文使用手册',ParagraphStyle('cover',parent=HEAD,fontSize=25,leading=33))
 para('安装配置 → 登录 → 供应链问答 → 执行溯源 / 业务图 / 证据链 → 诊断')
 para(f'{sum(len(s["figures"]) for s in sections)} 张实机截图与点击编号 · 中英文手册配套中文版 PDF',SM)
 para('适用：DSH 0.2.0-rc.2 · Plugin 0.2.0-rc.2-openbkn.0.2.0-9<br/>采集：2026-10-11 · macOS 桌面隔离环境',SM)
 para('阅读方法：每张图与对应步骤同页；红色编号对应图下说明。目录和 PDF 书签可跳转，放大截图可以查看界面细节。截图账号、平台地址、本机路径与执行标识已替换为示例。',SM)
 para('目录',HEAD)
 for label,num,key in previous_toc:
  p,h=pobj(html.escape(label),SM)
  if y-h-12<BOTTOM:new()
  p.drawOn(c,M,y-h);c.setFont('CN',9);c.drawRightString(W-M,y-h+1,str(num));c.linkRect('',key,(M,y-h-2,W-M,y+2),relative=0);y-=h+12
 for s in sections:
  figs=s['figures'];intro=s['intro'];note=s['note'];steps=s['steps']
  if not figs:
   rows=re.findall(r'<tr><td>(.*?)</td><td>(.*?)</td></tr>',intro)
   texts=([f'<b>{a}</b>：{b}' for a,b in rows] if rows else [intro])+[f'{i+1}. {v}' for i,v in enumerate(steps)]
   need=pheight(s['title'],HEAD)+sum(pheight(t,SM) for t in texts)
   ensure(min(need,TOP-BOTTOM),s['title']);toc.append([s['title'],page,s['id']]);c.bookmarkPage(s['id']);c.addOutlineEntry(s['title'],s['id'],0)
   para(s['title'],HEAD)
   for t in texts:para(t,SM)
   if note:para('提示：'+note,SM)
   continue
  assignment=figure_step_groups(s)
  for j,(name,caption,marks) in enumerate(figs):
   st=[f'{i+1}. {steps[i]}' for i in assignment[j]]
   title=s['title'] if j==0 else s['title']+'（续）'
   # Two-column legends avoid unnecessary vertical stacking.
   legend='　　'.join(f'<font color="#db3c34"><b>{n}</b></font> {html.escape(label)}' for n,x,y0,label in marks)
   iw,ih=Image.open(GUIDE/'images'/name).size;dh=U*ih/iw
   need=pheight(title,HEAD)+(pheight(intro) if j==0 else 0)+sum(pheight(t) for t in st)+pheight(caption,CAP)+dh+10+pheight(legend,SM)+(pheight('提示：'+note,SM) if note and j==len(figs)-1 else 0)
   ensure(need,s['title'])
   if j==0:
    toc.append([s['title'],page,s['id']]);c.bookmarkPage(s['id']);c.addOutlineEntry(s['title'],s['id'],0)
   para(title,HEAD)
   if j==0:para(intro)
   for t in st:para(t)
   para(caption,CAP)
   # Keep sufficient space for the image and its legend, with no detached screenshot page.
   tail=pheight(legend,SM)+(pheight('提示：'+note,SM) if note and j==len(figs)-1 else 0)
   if y-dh-tail<BOTTOM:
    dh=min(dh,y-tail-BOTTOM-10)
   dw=dh*iw/ih
   if dw<U*.82:raise ValueError('Image would be too small: '+name)
   c.drawImage(str(GUIDE/'images'/name),M+(U-dw)/2,y-dh,width=dw,height=dh);y-=dh+10
   para(legend,SM)
   if note and j==len(figs)-1:para('提示：'+note,SM)
 c.save();return page,limits,toc

def main():
 global GUIDE, sections, OUT
 parser=argparse.ArgumentParser()
 parser.add_argument('--font',required=True,help='TrueType font with Chinese glyphs')
 parser.add_argument('--guide-dir',type=Path,default=GUIDE)
 parser.add_argument('--output',type=Path)
 args=parser.parse_args()
 GUIDE=args.guide_dir
 sections=json.loads((GUIDE/'content.zh.json').read_text(encoding='utf-8'))
 validate_sections(sections)
 destination=args.output or GUIDE/'bkn-dsh-9-user-guide.zh.pdf'
 pdfmetrics.registerFont(TTFont('CN',args.font))
 # Keep intermediate passes private to this run and publish only a complete PDF.
 with tempfile.TemporaryDirectory() as work:
  OUT=Path(work)/'guide.pdf'
  toc=[]
  for _ in range(8):
   count,limits,current=render(toc)
   if current==toc:break
   toc=current
  else:raise ValueError('PDF contents pagination did not converge')
  destination.write_bytes(OUT.read_bytes())
 print('pages',count,'minimum bottom',round(min(limits),1),'images',sum(len(s['figures']) for s in sections))

if __name__=='__main__':main()

