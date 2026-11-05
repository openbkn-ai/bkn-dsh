import { useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import type { JsonValue } from '@deepseek-ai/dsh-util-values'
import { PlatformProvenanceDetail, createPlatformProvenanceAdapter } from '../index.js'
import fixtureValue from '../../../../tests/fixtures/provenance-parity/conversation.json' with {type:'json'}
const fixture = fixtureValue as unknown as {
  identity:{initialInteractionId:string}
  conversation:{conversation_id:string;agent_name:string;interaction_count:number;started_at:string;status:string}
  rounds: Array<{interaction_id:string;question_preview:string;round_number:number}>
  details:Record<string,JsonValue>
  explanations:Record<string,JsonValue>
  markdown:Record<string,string>
  history:Record<string,JsonValue>
}
const calls: Array<{kind:string;interactionId?:string}> = []
Object.assign(window,{__provenanceParity:{calls,fixtureKind:'controlled-synthetic',notLiveEvidence:true}})
function App() {
  const [anchor,setAnchor]=useState(new URLSearchParams(location.search).get('mode')==='managed'?'int-parity-068':fixture.identity.initialInteractionId)
  const [language,setLanguage]=useState('zh')
  const [notGenerated,setNotGenerated]=useState(false)
  const adapter=useMemo(()=>createPlatformProvenanceAdapter(async(request,signal,onAnalysis):Promise<JsonValue>=>{
    if(signal?.aborted)throw new DOMException('Aborted','AbortError')
    calls.push({kind:request.kind,interactionId:request.interactionId})
    const id=request.interactionId??anchor
    switch(request.kind) {
      case 'conversation':return {entries:[fixture.conversation],total:1}
      case 'rounds':{
        const rows=request.keyword?fixture.rounds.filter(row=>row.question_preview.includes(request.keyword!)):fixture.rounds
        const page=request.page??1,pageSize=request.pageSize??50
        return {entries:rows.slice((page-1)*pageSize,page*pageSize),total:rows.length,page,page_size:pageSize}
      }
      case 'detail':return fixture.details[id]??{interaction_id:id,interaction_question:'受控轮次原文',interaction_result:'受控回答',operations:[]}
      case 'explanation':return notGenerated?{schema_version:'1',interaction_id:id,status:'not_generated'}:fixture.explanations[id]??{schema_version:'1',interaction_id:id,status:'not_generated'}
      case 'generate':return fixture.explanations[id]??{schema_version:'1',interaction_id:id,status:'not_generated'}
      case 'markdown':return fixture.markdown[id]??'# Controlled fixture'
      case 'history':return fixture.history[id]??{entries:[]}
      case 'analyze':onAnalysis?.({event:'token',data:{content:'受控分析流（不调用平台或模型）'}});onAnalysis?.({event:'structured',data:{content:{conclusion:'受控样例结果',recommendations:[]}}});return null
    }
  },{
    async copyText(text){await navigator.clipboard.writeText(text)},
    downloadMarkdown(id,text){const link=document.createElement('a');const url=URL.createObjectURL(new Blob([text],{type:'text/markdown;charset=utf-8'}));link.href=url;link.download=id+'.md';link.click();URL.revokeObjectURL(url)},
  }),[anchor,notGenerated])
  const conversation={conversationId:fixture.conversation.conversation_id,agentName:fixture.conversation.agent_name,interactionCount:fixture.conversation.interaction_count,startedAt:fixture.conversation.started_at,status:fixture.conversation.status}
  return <>
    <nav id="parity-harness-controls" style={{position:'sticky',top:0,zIndex:100000,padding:'8px 12px',background:'#fffbe6',borderBottom:'1px solid #d6b656',display:'flex',alignItems:'center',gap:12,font:'13px system-ui',color:'#241a00'}}>
      <strong>受控界面验收 · synthetic fixture · 无平台/模型请求</strong>
      <button onClick={()=>setAnchor('int-parity-007')}>普通调用 / Retry</button>
      <button onClick={()=>setAnchor('int-parity-068')}>Managed function</button>
      <button onClick={()=>setLanguage(value=>value==='zh'?'en':'zh')}>中文 / English</button>
      <label><input type="checkbox" checked={notGenerated} onChange={event=>setNotGenerated(event.target.checked)}/>未生成说明</label>
    </nav>
    <div style={{display:'flex',alignItems:'stretch'}}>
      <aside id="host-css-sentinel" style={{width:130,flexShrink:0,padding:12,borderRight:'2px dashed #ce7b1b',background:'#222',color:'#eee',font:'13px Georgia'}}>Host 样式哨兵<br/><button>Host button</button><p>黑底与 serif 字体应保持。</p></aside>
      <div style={{minWidth:0,flex:1}}><PlatformProvenanceDetail key={`${anchor}:${notGenerated}`} conversation={conversation} initialInteractionId={anchor} adapter={adapter} language={language}/></div>
    </div>
  </>
}
createRoot(document.getElementById('root')!).render(<App/>)
