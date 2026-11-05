import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
import {createServer} from 'node:http'
import {execFileSync} from 'node:child_process'
import {createHash} from 'node:crypto'
import {mkdir, readFile, writeFile} from 'node:fs/promises'
import {dirname, join, resolve} from 'node:path'
import {fileURLToPath, pathToFileURL} from 'node:url'

// Run explicitly; this probe is not part of the Node/JSDOM test glob.
// SOURCE_TEXT_PLAYWRIGHT_PATH may point to an external playwright-core install.
// SOURCE_TEXT_BROWSER_PATH selects an installed Chromium executable; the probe
// starts a fresh temporary browser context and never opens a daily profile.
const here = dirname(fileURLToPath(import.meta.url))
const packageRoot = resolve(here,'../..')
const root = resolve(packageRoot,'../..')
const packageRequire = createRequire(join(packageRoot,'package.json'))
const esbuild = createRequire(packageRequire.resolve('tsx'))('esbuild')
const playwright = process.env.SOURCE_TEXT_PLAYWRIGHT_PATH
  ? await import(pathToFileURL(resolve(process.env.SOURCE_TEXT_PLAYWRIGHT_PATH)).href)
  : await import('playwright-core')
const output = resolve(process.env.SOURCE_TEXT_POINTER_OUTPUT ?? join(root,'release/source-text-pointer'))
await mkdir(output,{recursive:true})
const bundlePath = join(output,'harness.js')
const sceneRelative = 'packages/openbkn-business-context/src/client/platform-provenance/business-provenance/BusinessProvenanceScene.tsx'
const baselineCommit = process.env.SOURCE_TEXT_BASELINE_COMMIT
if (baselineCommit && !/^[a-f0-9]{7,40}$/i.test(baselineCommit)) throw new Error('Baseline commit must be a Git hexadecimal commit ID')
const sceneSource = baselineCommit ? execFileSync('git',['show',`${baselineCommit}:${sceneRelative}`],{cwd:root,encoding:'utf8'}) : await readFile(join(root,sceneRelative),'utf8')
await esbuild.build({entryPoints:[join(here,'source-text-pointer-harness.tsx')],bundle:true,
  platform:'browser',format:'iife',outfile:bundlePath,jsx:'automatic',define:{'process.env.NODE_ENV':'"development"'},logLevel:'silent',
  plugins:baselineCommit ? [{name:'frozen-scene-baseline',setup(build) {build.onLoad({filter:/BusinessProvenanceScene\.tsx$/},() => ({contents:sceneSource,loader:'tsx',resolveDir:dirname(join(root,sceneRelative))}))}}] : []})
const bundle = await readFile(bundlePath)
const server = createServer((request,response) => {
  if (request.url === '/harness.js') {response.setHeader('content-type','text/javascript');response.end(bundle)}
  else {response.setHeader('content-type','text/html');response.end('<!doctype html><meta charset="utf-8"><style>body{margin:0;font-family:Arial,sans-serif}*{box-sizing:border-box}</style><div id="root"></div><script src="/harness.js"></script>')}
})
await new Promise(resolve => server.listen(0,'127.0.0.1',resolve))
const url = `http://127.0.0.1:${server.address().port}/`
let browser
try {
browser = await playwright.chromium.launch({headless:true,...(process.env.SOURCE_TEXT_BROWSER_PATH ? {executablePath:process.env.SOURCE_TEXT_BROWSER_PATH}: {})})
const page = await browser.newPage({viewport:{width:Number(process.env.SOURCE_TEXT_VIEWPORT_WIDTH ?? 1920),height:Number(process.env.SOURCE_TEXT_VIEWPORT_HEIGHT ?? 800)}})
const events = []
const errors = []
const refusedRequests = []
await page.route('**/*',route => {
  if (route.request().url().startsWith(url)) return route.continue()
  refusedRequests.push(route.request().url())
  return route.abort()
})
page.on('pageerror',error => errors.push(String(error)))
await page.exposeFunction('recordSourceTextEvent',entry => events.push(entry))
await page.addInitScript(() => {
  const describe = node => node instanceof Element ? `${node.tagName.toLowerCase()}${node.id ? '#'+node.id:''}${node.className && typeof node.className==='string' ? '.'+node.className.trim().replace(/\s+/g,'.'):''}` : String(node)
  for (const type of ['pointerover','pointerout','mouseover','mouseout','mouseenter','mouseleave','mousedown','click','keydown','focusin','focusout']) {
    document.addEventListener(type,event => {
      if (type==='keydown' && event.key!=='Escape' && event.key!=='Enter' && event.key!==' ') return
      window.recordSourceTextEvent({at:performance.now(),type,key:event.key,target:describe(event.target),relatedTarget:describe(event.relatedTarget),active:describe(document.activeElement),x:event.clientX,y:event.clientY})
    },true)
  }
})
const visibleLayer = page.locator('section[class*="sourceTextPopoverContent"]:visible')
async function state() {
  return page.evaluate(() => {
    function visible(element) {
      const rect=element.getBoundingClientRect()
      if (rect.width<=0 || rect.height<=0 || !element.getClientRects().length) return false
      for (let current=element;current;current=current.parentElement) {
        const style=getComputedStyle(current)
        if (style.display==='none' || style.visibility==='hidden' || Number(style.opacity)===0) return false
      }
      return true
    }
    const layers=[...document.querySelectorAll('section[class*="sourceTextPopoverContent"]')]
    const active=document.activeElement
    return {visibleLayerCount:layers.filter(visible).length,layers:layers.map(element=>({label:element.getAttribute('aria-label'),rect:element.getBoundingClientRect().toJSON(),visible:visible(element),opacity:getComputedStyle(element.closest('.ant-popover')??element).opacity})),
      parentOpen:!!document.querySelector('[role="dialog"][aria-modal="true"]'),
      active:{tag:active?.tagName,className:active?.className,label:active?.getAttribute('aria-label'),placeholder:active?.getAttribute('placeholder')},
      calls:window.sourceTextPointerProbe.calls.slice()}
  })
}
async function reset() {
  await page.goto(url)
  await page.locator('#open-provenance').click()
  await page.getByRole('heading',{name:'本轮业务执行过程',exact:true}).waitFor()
  await page.getByRole('button',{name:'交给 BKN Agent 分析',exact:true}).waitFor()
  await page.getByPlaceholder('搜索问题或业务对象').click()
  await page.mouse.move(20,20)
}
const cases=[]
const boundaries=[]
const paddingOnly=process.argv.includes('--padding-only')
  for (const field of paddingOnly ? [] : ['output','input']) for (const sequence of ['hover-click','hover','keyboard']) {
    const id=`${field}-${sequence}`
    const eventStart=events.length
    await reset()
    const trigger=page.getByRole('button',{name:field==='input'?'查看完整本轮输入':'查看完整本轮输出',exact:true})
    const rect=await trigger.boundingBox()
    const point={x:rect.x+rect.width*.2,y:rect.y+rect.height*.75}
    const before=await state()
    if (sequence==='keyboard') {
      // Reach the trigger through the actual tab order, without scripted focus.
      for (let index=0;index<30;index++) {
        if (await trigger.evaluate(element=>document.activeElement===element)) break
        await page.keyboard.press('Tab')
      }
      assert.equal(await trigger.evaluate(element=>document.activeElement===element),true,`${id}: tab reaches trigger`)
      await page.keyboard.press(field==='input'?'Enter':'Space')
    } else {
      await page.mouse.move(point.x,point.y)
    }
    await visibleLayer.waitFor({timeout:5000})
    await page.waitForTimeout(350)
    const hover=await state()
    const hit=await page.evaluate(point=>{const e=document.elementFromPoint(point.x,point.y);return {tag:e?.tagName,className:e?.className,inPopup:!!e?.closest('section[class*="sourceTextPopoverContent"]'),inTrigger:!!e?.closest('button[class*="sourceTextPreview"]')}},point)
    if (sequence==='hover-click') {await page.mouse.click(point.x,point.y);await page.waitForTimeout(500)}
    const preEscape=await state()
    const entry={id,point,triggerRect:rect,before,hover,hit,preEscape,escapeSent:preEscape.visibleLayerCount>0,samples:[]}
    if (entry.escapeSent) {
      const start=Date.now()
      await page.keyboard.press('Escape')
      for (const delay of [0,150,500,1500]) {
        const left=delay-(Date.now()-start)
        if (left>0) await page.waitForTimeout(left)
        entry.samples.push({ms:Date.now()-start,...await state()})
      }
      await page.screenshot({path:join(output,`${id}-after.png`)})
    }
    if (sequence==='keyboard') {
      // No mouse had entered the trigger before this keyboard-owned Escape.
      // Its first genuine hover must not require a redundant leave/re-enter.
      await page.mouse.move(point.x,point.y)
      await page.waitForTimeout(500)
      entry.firstHoverAfterKeyboardEscape=await state()
    }
    entry.events=events.slice(eventStart)
    cases.push(entry)
    console.log(JSON.stringify({id,hit,preEscape:preEscape.active,opened:entry.escapeSent,after:entry.samples.map(({ms,visibleLayerCount,parentOpen,active})=>({ms,visibleLayerCount,parentOpen,active}))}))
  }
  // The following sequences start from a genuine mouse click inside the
  // overlapping output popup. They test guard release without direct focus or
  // synthetic mouseleave dispatches.
  async function dismissedOutput() {
    await reset()
    const trigger=page.getByRole('button',{name:'查看完整本轮输出',exact:true})
    const rect=await trigger.boundingBox()
    const point={x:rect.x+rect.width*.2,y:rect.y+rect.height*.75}
    await page.mouse.move(point.x,point.y)
    await visibleLayer.waitFor()
    await page.waitForTimeout(350)
    await page.mouse.click(point.x,point.y)
    await page.waitForTimeout(100)
    await page.keyboard.press('Escape')
    await page.waitForTimeout(500)
    return {trigger,point,afterEscape:await state()}
  }
  if (!paddingOnly) {
  {
    const eventStart=events.length
    const {point,afterEscape}=await dismissedOutput()
    await page.mouse.move(20,20)
    await page.waitForTimeout(200)
    const afterLeave=await state()
    await page.mouse.move(point.x,point.y)
    await page.waitForTimeout(500)
    boundaries.push({id:'leave-combined-area-then-hover',afterEscape,afterLeave,afterReenter:await state(),events:events.slice(eventStart)})
  }
  {
    const eventStart=events.length
    const {point,afterEscape}=await dismissedOutput()
    // Explicitly activate the revealed trigger at the same stationary point.
    await page.mouse.click(point.x,point.y)
    await page.waitForTimeout(500)
    boundaries.push({id:'explicit-click-after-owned-escape',afterEscape,afterActivate:await state(),events:events.slice(eventStart)})
  }
  {
    const eventStart=events.length
    const {trigger,afterEscape}=await dismissedOutput()
    // The naturally restored search field, rather than a script, supplies the
    // starting focus for keyboard reactivation while the pointer stays put.
    for (let index=0;index<30;index++) {
      if (await trigger.evaluate(element=>document.activeElement===element)) break
      await page.keyboard.press('Tab')
    }
    await page.keyboard.press('Enter')
    await page.waitForTimeout(500)
    const afterActivate=await state()
    await page.keyboard.press('Escape')
    await page.waitForTimeout(500)
    const afterChildEscape=await state()
    await page.keyboard.press('Escape')
    await page.waitForTimeout(200)
    boundaries.push({id:'explicit-keyboard-and-parent-escape',afterEscape,afterActivate,afterChildEscape,afterParentEscape:await state(),events:events.slice(eventStart)})
  }
  {
    const eventStart=events.length
    await dismissedOutput()
    // Close/unmount the parent with its actual close control, then reopen a
    // fresh scene and prove a different field has no dismissed-hover residue.
    await page.getByRole('button',{name:'关闭',exact:true}).click()
    await page.locator('#open-provenance').click()
    await page.getByRole('heading',{name:'本轮业务执行过程',exact:true}).waitFor()
    await page.getByPlaceholder('搜索问题或业务对象').click()
    const trigger=page.getByRole('button',{name:'查看完整本轮输入',exact:true})
    const rect=await trigger.boundingBox()
    await page.mouse.move(rect.x+rect.width*.2,rect.y+rect.height*.75)
    await page.waitForTimeout(500)
    boundaries.push({id:'unmount-reopen-and-other-source',afterReopen:await state(),events:events.slice(eventStart)})
  }
  }
  {
    const eventStart=events.length
    await reset()
    const trigger=page.getByRole('button',{name:'查看完整本轮输出',exact:true})
    const triggerRect=await trigger.boundingBox()
    const point={x:triggerRect.x+triggerRect.width*.2,y:triggerRect.y+triggerRect.height*.75}
    await page.mouse.move(point.x,point.y)
    await visibleLayer.waitFor()
    await page.waitForTimeout(350)
    await page.mouse.click(point.x,point.y)
    const padding=await page.evaluate(triggerRect => {
      const section=document.querySelector('section[class*="sourceTextPopoverContent"]')
      const rect=section.getBoundingClientRect()
      const candidates=[
        {x:rect.left-6,y:triggerRect.y+triggerRect.height*.75},
        {x:rect.right+6,y:triggerRect.y+triggerRect.height*.75},
      ]
      for (const point of candidates) {
        const element=document.elementFromPoint(point.x,point.y)
        if (point.x>=triggerRect.x && point.x<=triggerRect.x+triggerRect.width && point.y>=triggerRect.y && point.y<=triggerRect.y+triggerRect.height && element?.closest('.ant-popover') && !element.closest('section[class*="sourceTextPopoverContent"]')) {
          return {point,hit:{tag:element.tagName,className:element.className}}
        }
      }
      return null
    },triggerRect)
    const entry={id:'popup-padding-overlapping-trigger',executable:!!padding,coverage:padding?'EXECUTABLE_PENDING_ASSERTION':'SKIP',...(padding?{}:{skipReason:'No real popup padding overlaps the trigger in this viewport; no layout is changed to force coverage'}),padding,triggerRect,samples:[]}
    if (padding) {
      await page.mouse.move(padding.point.x,padding.point.y)
      await page.waitForTimeout(100)
      entry.preEscape=await state()
      await page.keyboard.press('Escape')
      await page.waitForTimeout(500)
      entry.samples.push({ms:500,...await state()})
      await page.waitForTimeout(1000)
      entry.samples.push({ms:1500,...await state()})
      await page.screenshot({path:join(output,'popup-padding-after.png')})
    }
    entry.events=events.slice(eventStart)
    boundaries.push(entry)
  }
  const observedCalls=[]
  function collectSnapshotCalls(value) {
    if (Array.isArray(value)) {for (const entry of value) collectSnapshotCalls(entry)}
    else if (value && typeof value==='object') {
      if (Array.isArray(value.calls)) observedCalls.push(...value.calls)
      for (const nested of Object.values(value)) collectSnapshotCalls(nested)
    }
  }
  collectSnapshotCalls({cases,boundaries})
  const result={kind:'controlled-real-browser-source-text-pointer',recordedAt:new Date().toISOString(),notWindowsAcceptance:true,node:process.version,baselineSceneCommit:baselineCommit??null,baselineScope:baselineCommit?'only BusinessProvenanceScene.tsx is frozen; other modules use the current working tree':'current working tree',sceneSourceSha256:createHash('sha256').update(sceneSource).digest('hex'),browser:browser.version(),viewport:page.viewportSize(),cases,boundaries,errors,refusedRequests,observedTransportKinds:[...new Set(observedCalls)],newPlatformRequests:0,newModelRequests:0}
  await writeFile(join(output,'RESULTS.json'),JSON.stringify(result,null,2)+'\n')
  assert.deepEqual(errors,[])
  assert.deepEqual(refusedRequests,[],'the controlled probe must not attempt any non-loopback platform/model request')
  assert.equal(observedCalls.some(kind=>kind==='generate'||kind==='analyze'),false,'all case and boundary snapshots remain free of generation/analysis dispatch')
  if (!process.argv.includes('--record-baseline')) {
    if (!paddingOnly) {
    assert.equal(cases.find(row=>row.id==='output-hover-click').hit.inPopup,true,'output coordinates must actually hit the overlapping popup')
    for (const id of ['output-hover-click','input-keyboard','output-keyboard']) {
      const row=cases.find(entry=>entry.id===id)
      assert.ok(row,`${id}: required owned-Escape case is recorded`)
      assert.equal(row.preEscape.visibleLayerCount,1,`${id}: source is visibly open before Escape`)
      assert.equal(row.escapeSent,true,`${id}: owned Escape was actually sent`)
      assert.ok(row.samples.filter(sample=>sample.ms>=500).length>=2,`${id}: post-animation samples exist`)
    }
    for (const row of cases.filter(row=>row.escapeSent && row.id!=='input-hover' && row.id!=='output-hover')) {
      for (const sample of row.samples.filter(sample=>sample.ms>=500)) {
        assert.equal(sample.visibleLayerCount,0,`${row.id}: source layer remains dismissed with stationary pointer`)
        assert.equal(sample.parentOpen,true,`${row.id}: owned Escape preserves parent`)
      }
    }
    for (const row of cases.filter(row=>row.id.endsWith('-hover'))) {
      assert.equal(row.preEscape.active.placeholder,'搜索问题或业务对象',`${row.id}: pure hover keeps natural parent focus`)
      assert.equal(row.samples.at(-1).parentOpen,false,`${row.id}: parent owns external-focus Escape`)
    }
    assert.equal(cases.find(row=>row.id==='input-hover-click').escapeSent,false,'click on an already hovered input trigger closes before Escape')
    for (const row of cases.filter(row=>row.id.endsWith('-keyboard'))) {
      assert.equal(row.firstHoverAfterKeyboardEscape.visibleLayerCount,1,`${row.id}: first genuine hover after keyboard Escape opens normally`)
    }
    for (const row of boundaries) {
      if (row.id==='popup-padding-overlapping-trigger') continue
      if (row.afterEscape) assert.equal(row.afterEscape.visibleLayerCount,0,`${row.id}: starting dismissed layer stays closed`)
      const openState=row.afterReenter??row.afterActivate??row.afterReopen
      assert.equal(openState.visibleLayerCount,1,`${row.id}: fresh activation can open source`)
      assert.equal(openState.parentOpen,true,`${row.id}: fresh activation keeps parent`)
      if (row.afterChildEscape) {
        assert.equal(row.afterChildEscape.visibleLayerCount,0,`${row.id}: second owned Escape closes child`)
        assert.equal(row.afterChildEscape.parentOpen,true,`${row.id}: second owned Escape preserves parent`)
      }
      if (row.afterParentEscape) assert.equal(row.afterParentEscape.parentOpen,false,`${row.id}: following Escape closes parent`)
    }
    }
    const padding=boundaries.find(row=>row.id==='popup-padding-overlapping-trigger')
    if (padding.executable) {
      assert.equal(padding.executable,true,'padding coverage requires a real executable overlap')
      assert.equal(padding.preEscape.visibleLayerCount,1,'padding Escape starts with the popup visibly open')
      assert.equal(padding.samples.length,2,'padding coverage contains both delayed samples')
      for (const sample of padding.samples) {
        assert.equal(sample.visibleLayerCount,0,'popup padding overlapping trigger remains dismissed')
        assert.equal(sample.parentOpen,true,'popup padding Escape preserves parent')
      }
      padding.coverage='PASS'
      result.validationStatus='PASS'
    } else {
      padding.coverage='SKIP'
      result.validationStatus='PARTIAL_PADDING_SKIPPED'
      console.log('SKIP: popup padding overlap is not executable in this viewport; no padding PASS is claimed')
    }
  } else result.validationStatus='BASELINE_RECORD_ONLY'
  await writeFile(join(output,'RESULTS.json'),JSON.stringify(result,null,2)+'\n')
} finally {
  try { await browser?.close() }
  finally { await new Promise(resolve=>server.close(resolve)) }
}
