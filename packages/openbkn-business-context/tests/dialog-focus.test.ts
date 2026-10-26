import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { act, create } from 'react-test-renderer'
import { useDialogFocus } from '../src/client/use-dialog-focus.ts'

function harness() {
  const listeners = new Set<(event: KeyboardEvent) => void>()
  const document = {
    activeElement: undefined as object | undefined,
    defaultView: {
      addEventListener: (_name: string, listener: (event: KeyboardEvent) => void) => listeners.add(listener),
      removeEventListener: (_name: string, listener: (event: KeyboardEvent) => void) => listeners.delete(listener),
    },
  }
  const control = (visible = true) => ({
    tabIndex: 0, isConnected: true,
    focus() { document.activeElement = this },
    getClientRects: () => visible ? [{}] : [],
  })
  const opener = control(), first = control(), last = control(), hidden = control(false)
  const panel = {
    ownerDocument: document,
    addEventListener: (_name: string, listener: (event: KeyboardEvent) => void) => listeners.add(listener),
    removeEventListener: (_name: string, listener: (event: KeyboardEvent) => void) => listeners.delete(listener),
    focus() { document.activeElement = this },
    contains: (node: object) => [panel, first, last, hidden].includes(node as never),
    querySelectorAll: () => [first, hidden, last],
  }
  opener.focus()
  const key = (key: string, shiftKey = false, flags: Partial<KeyboardEvent> = {}) => {
    let prevented = false
    const event = { key, shiftKey, ...flags, preventDefault() { prevented = true }, stopPropagation() {} } as KeyboardEvent
    act(() => { for (const listener of listeners) listener(event) })
    return prevented
  }
  function Dialog({ open, close }: { open: boolean; close(): void }) {
    const ref = useDialogFocus(open, close)
    return open ? createElement('section', { ref, tabIndex: -1 }) : null
  }
  return { Dialog, document, opener, panel, first, last, listeners, key }
}

test('an open dialog receives focus, wraps visible controls and restores its opener', () => {
  const ui = harness()
  let renderer!: ReturnType<typeof create>
  act(() => { renderer = create(createElement(ui.Dialog, { open: true, close() {} }), { createNodeMock: () => ui.panel }) })
  try {
    assert.equal(ui.document.activeElement, ui.panel)
    assert.equal(ui.key('Tab'), true); assert.equal(ui.document.activeElement, ui.first)
    assert.equal(ui.key('Tab', true), true); assert.equal(ui.document.activeElement, ui.last)
    assert.equal(ui.key('Tab'), true); assert.equal(ui.document.activeElement, ui.first)
    act(() => renderer.update(createElement(ui.Dialog, { open: false, close() {} })))
    assert.equal(ui.document.activeElement, ui.opener)
    assert.equal(ui.listeners.size, 0)
  } finally { act(() => renderer.unmount()) }
})

test('content updates retain focus and Escape uses the latest close action without leaking listeners', () => {
  const ui = harness()
  let firstCalls = 0, currentCalls = 0
  let renderer!: ReturnType<typeof create>
  act(() => { renderer = create(createElement(ui.Dialog, { open: true, close() { firstCalls++ } }), { createNodeMock: () => ui.panel }) })
  try {
    ui.first.focus()
    act(() => renderer.update(createElement(ui.Dialog, { open: true, close() { currentCalls++ } })))
    assert.equal(ui.document.activeElement, ui.first)
    assert.equal(ui.listeners.size, 1)
    assert.equal(ui.key('Escape'), true)
    assert.equal(firstCalls, 0); assert.equal(currentCalls, 1)
  } finally { act(() => renderer.unmount()) }
  assert.equal(ui.listeners.size, 0)
  assert.equal(ui.document.activeElement, ui.opener)
})


test('owned keyboard handling yields to consumed, composing and modified gestures', () => {
  const ui=harness(); let calls=0,renderer!:ReturnType<typeof create>
  act(()=>{renderer=create(createElement(ui.Dialog,{open:true,close(){calls++}}),{createNodeMock:()=>ui.panel})})
  try {
    for(const flags of [{defaultPrevented:true},{isComposing:true},{ctrlKey:true},{altKey:true},{metaKey:true}])assert.equal(ui.key('Escape',false,flags),false)
    assert.equal(ui.key('Escape',true),false);assert.equal(calls,0)
    assert.equal(ui.key('Escape',false,{repeat:true}),true);assert.equal(calls,0)
    assert.equal(ui.key('Escape'),true);assert.equal(calls,1)
  } finally {act(()=>renderer.unmount())}
})
