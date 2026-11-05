import assert from 'node:assert/strict'
import { test } from 'node:test'
import { writePlatformTextToClipboard } from './clipboard.js'

async function withClipboardEnvironment(action:(environment:{container:HTMLElement;log:string[];textarea:{value:string}})=>Promise<void>, options:{native?:'success'|'reject';command?:boolean;connected?:boolean}={}) {
  const names=['document','navigator','HTMLElement'] as const
  const originals=names.map(name=>Object.getOwnPropertyDescriptor(globalThis,name))
  const log:string[]=[]
  class Element {isConnected=true;focus(){log.push('restoreFocus')}}
  const active=new Element()
  const ranges=[{name:'range1'},{name:'range2'}]
  const textarea={value:'',style:{},setAttribute(){},focus(){log.push('textareaFocus')},select(){log.push('select')},setSelectionRange(){log.push('setSelectionRange')},remove(){log.push('remove')}}
  const container={isConnected:options.connected??true,appendChild(node:unknown){assert.equal(node,textarea);log.push('ownedAppend')}} as unknown as HTMLElement
  const document={activeElement:active,createElement(name:string){assert.equal(name,'textarea');return textarea},getSelection(){return {rangeCount:ranges.length,getRangeAt(index:number){return ranges[index]},removeAllRanges(){log.push('clearRanges')},addRange(range:unknown){log.push('restore:'+String((range as {name:string}).name))}}},execCommand(command:string){assert.equal(command,'copy');log.push('execCopy');return options.command??true}}
  const navigator=options.native?{clipboard:{async writeText(text:string){log.push('native:'+text);if(options.native==='reject')throw new Error('permission denied')}}}:{}
  Object.defineProperty(globalThis,'document',{value:document,configurable:true})
  Object.defineProperty(globalThis,'navigator',{value:navigator,configurable:true})
  Object.defineProperty(globalThis,'HTMLElement',{value:Element,configurable:true})
  try {await action({container,log,textarea})}
  finally {names.forEach((name,index)=>{const descriptor=originals[index];if(descriptor)Object.defineProperty(globalThis,name,descriptor);else Reflect.deleteProperty(globalThis,name)})}
}

test('platform clipboard uses native API verbatim without creating fallback controls',async()=>{
  await withClipboardEnvironment(async({log})=>{await writePlatformTextToClipboard('原始 Markdown\n');assert.deepEqual(log,['native:原始 Markdown\n'])},{native:'success'})
})
test('platform clipboard fallback stays in owned container and restores focus and selections',async()=>{
  await withClipboardEnvironment(async({container,log,textarea})=>{await writePlatformTextToClipboard('平台原文',container);assert.equal(textarea.value,'平台原文');assert.deepEqual(log,['ownedAppend','textareaFocus','select','setSelectionRange','execCopy','remove','clearRanges','restore:range1','restore:range2','restoreFocus'])})
})
test('denied native clipboard falls back; rejected copy still cleans up and restores focus',async()=>{
  await withClipboardEnvironment(async({container,log})=>{await assert.rejects(writePlatformTextToClipboard('unchanged',container),/Copy command was rejected/);assert.equal(log[0],'native:unchanged');assert.ok(log.includes('ownedAppend'));assert.ok(log.includes('remove'));assert.equal(log.at(-1),'restoreFocus')},{native:'reject',command:false})
})
test('clipboard fallback does not append outside an owned connected viewer',async()=>{
  await withClipboardEnvironment(async({container,log})=>{await assert.rejects(writePlatformTextToClipboard('text'),/Owned clipboard container is unavailable/);await assert.rejects(writePlatformTextToClipboard('text',container),/Owned clipboard container is unavailable/);assert.deepEqual(log,[])},{connected:false})
})
