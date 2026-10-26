import { useState, type ReactNode } from 'react'
import { useOpenBknTranslation } from './locale.tsx'

/** Page before rendering children. All records remain in the DTO and reachable through controls. */
interface RecordListProps<T> {
  items:readonly T[];label:string;listId:string;contextKey:string;pageSize?:number;focusKey?:string;focusIndex?:number;grid?:boolean
  renderItem:(item:T,index:number)=>ReactNode
}
export function NativeRecordList<T>(props:RecordListProps<T>) {
  return <RecordPage key={JSON.stringify([props.contextKey,props.listId])} {...props} />
}
function RecordPage<T>({items,label,pageSize=20,focusKey,focusIndex=-1,grid=false,renderItem}:RecordListProps<T>) {
  const t=useOpenBknTranslation()
  const lastPage=Math.max(0,Math.ceil(items.length/pageSize)-1)
  const focusPage=focusIndex<0 ? undefined : Math.min(lastPage,Math.floor(focusIndex/pageSize))
  const [position,setPosition]=useState({focusKey,page:focusPage ?? 0})
  const requestedPage=position.focusKey!==focusKey ? focusPage ?? position.page : position.page
  const page=Math.min(lastPage,requestedPage),start=page*pageSize
  // Store the new focus before commit so A → B → A cannot reuse A's old manual page.
  if(position.focusKey!==focusKey || position.page!==page)setPosition({focusKey,page})
  const move=(next:number)=>setPosition({focusKey,page:Math.max(0,Math.min(lastPage,next))})
  return <section aria-label={label} data-native-list={label}>
    {items.length>pageSize ? <div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}>
      <span>{t('nativePageRange',{start:start+1,end:Math.min(start+pageSize,items.length),total:items.length})}</span>
      <button type="button" aria-label={t('nativePreviousPage',{label})} disabled={page===0} onClick={()=>move(page-1)}>{t('nativePrevious')}</button>
      <button type="button" aria-label={t('nativeNextPage',{label})} disabled={page===lastPage} onClick={()=>move(page+1)}>{t('nativeNext')}</button>
    </div> : null}
    <div style={grid ? {display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(min(220px, 100%), 1fr))',gap:10} : {display:'grid',gap:7}}>
      {items.slice(start,start+pageSize).map((item,index)=>renderItem(item,start+index))}
    </div>
  </section>
}
