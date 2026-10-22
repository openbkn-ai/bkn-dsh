import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement, useSyncExternalStore } from 'react'
import { act, create } from 'react-test-renderer'
import type { LocaleRuntime } from '@deepseek-ai/dsh-client-locale/client'
import { localized, useOpenBknTranslation } from '../src/client/locale.tsx'
import { en, zh, type OpenBknMessageKey } from '../src/client/locales.ts'
import { renderUiMessage, translateMessage } from '../src/client/messages.ts'
import { OpenBknUiController, type OpenBknUiPort } from '../src/client/openbkn-ui-controller.ts'
import { OpenBknOverlay } from '../src/client/OpenBknOverlay.tsx'
import { ProvenanceOverlay, ProvenanceOverlayController } from '../src/client/ProvenanceOverlay.tsx'
import { diagnosticAction } from '../src/client/diagnostics-copy.ts'
import { sessionSuggestionText } from '../src/client/SuggestionDock.tsx'
import type { ProvenanceView } from '../src/types.ts'

function localeHarness() {
  let snapshot = { active: 'zh', revision: 0, locales: [] }
  const listeners = new Set<() => void>()
  const locale = {
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener) } },
    getSnapshot() { return snapshot },
    bind() { return (key: OpenBknMessageKey, params?: Record<string, unknown>) => translateMessage(snapshot.active, key, params) },
  } as unknown as LocaleRuntime
  return { locale, set(active: string) {
    snapshot = { ...snapshot, active, revision: snapshot.revision + 1 }
    for (const listener of listeners) listener()
  } }
}

function port(overrides: Partial<OpenBknUiPort> = {}): OpenBknUiPort {
  return {
    status: async () => ({ kind: 'authenticated', baseUrl: 'https://platform.invalid' }),
    beginLogin: async () => [], configureToken: async () => [], listNetworks: async () => [],
    bindNetworkWorkspace: async () => ({ id: 'n', displayName: '原始网络' }),
    bindNetwork: async () => ({ platformBaseUrl: 'https://platform.invalid', knowledgeNetworkId: 'n', displayName: '原始网络' }),
    ...overrides,
  }
}

const previousWindow = Object.getOwnPropertyDescriptor(globalThis, 'window')
test.before(() => Object.defineProperty(globalThis, 'window', {
  configurable: true, value: { addEventListener() {}, removeEventListener() {} },
}))
test.after(() => {
  if (previousWindow === undefined) Reflect.deleteProperty(globalThis, 'window')
  else Object.defineProperty(globalThis, 'window', previousWindow)
})

test('English and Chinese cover every owned message with identical interpolation parameters', () => {
  assert.deepEqual(Object.keys(en).sort(), Object.keys(zh).sort())
  for (const key of Object.keys(zh) as OpenBknMessageKey[]) {
    const parameters = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map(match => match[1]).sort()
    assert.deepEqual(parameters(en[key]), parameters(zh[key]), key)
    assert.ok(en[key].trim(), key)
    assert.doesNotMatch(en[key], /\p{Script=Han}/u, key)
  }
  assert.equal(translateMessage('en', '__unknown__' as OpenBknMessageKey), 'Text unavailable')
})

test('an already displayed connection error switches zh/en/zh without new credential or platform reads', async () => {
  let reads = 0
  const controller = new OpenBknUiController(port({ status: async () => {
    reads++
    throw Object.assign(new Error('private-cli-output'), { code: 'openbkn/cli-unavailable' })
  } }), async () => 's')
  controller.open()
  await controller.refresh()
  const state = controller.getSnapshot()
  const harness = localeHarness()
  function Failure() {
    const current = useSyncExternalStore(listener => controller.subscribe(listener), () => controller.getSnapshot())
    return createElement('p', null, renderUiMessage(current.message, useOpenBknTranslation()))
  }
  const Component = localized(Failure, harness.locale)
  let renderer!: ReturnType<typeof create>
  act(() => { renderer = create(createElement(Component)) })
  assert.match(JSON.stringify(renderer.toJSON()), /当前 DSH/)
  act(() => harness.set('en'))
  assert.match(JSON.stringify(renderer.toJSON()), /This DSH Host cannot use OpenBKN CLI/)
  act(() => harness.set('zh'))
  assert.match(JSON.stringify(renderer.toJSON()), /当前 DSH/)
  assert.equal(controller.getSnapshot(), state)
  assert.equal(reads, 1)
  assert.doesNotMatch(JSON.stringify(renderer.toJSON()), /private-cli-output/)
  act(() => renderer.unmount())
})

test('nested authentication messages switch language while preserving the Latest recovery classification', async () => {
  const controller = new OpenBknUiController(port({ status: async () => {
    throw { code: 'openbkn/authentication-required', details: { baseUrl: 'https://platform.invalid', httpStatus: 401 } }
  } }), async () => 's')
  controller.open()
  await controller.refresh()
  assert.equal(controller.snapshot().phase, 'authentication-required')
  const english = renderUiMessage(controller.snapshot().message, (key, params) => translateMessage('en', key, params))
  assert.match(english, /OpenBKN platform.*HTTP 401.*Sign in again/)
  assert.doesNotMatch(english, /\p{Script=Han}/u)
})

test('switching an open configuration form preserves unsaved URL, CLI path and advanced disclosure', () => {
  const harness = localeHarness()
  const Component = localized(OpenBknOverlay, harness.locale)
  const state = { open: true, phase: 'configuration' as const, networks: [], configuration: {
    configured: true, editable: true, baseUrl: 'https://platform.invalid', cliPath: 'openbkn',
  } }
  const noop = () => {}
  const asyncNoop = async () => {}
  const props = {
    useUi: (select: (value: typeof state) => unknown) => select(state), close: noop, refresh: asyncNoop,
    beginLogin: asyncNoop, showSettings: asyncNoop, saveConfiguration: asyncNoop,
    cliSetup: { checkCli: async () => ({ state: 'ready' as const, canInstall: false }), installCli: async () => ({ state: 'ready' as const, canInstall: false }) },
    openNetwork: asyncNoop, openDiagnostics: noop,
  }
  let renderer!: ReturnType<typeof create>
  act(() => { renderer = create(createElement(Component, props as never)) })
  act(() => renderer.root.findByProps({ 'aria-label': 'OpenBKN 平台地址' }).props.onChange({ target: { value: 'https://unsaved.invalid' } }))
  act(() => renderer.root.findByType('details').props.onToggle({ currentTarget: { open: true } }))
  act(() => renderer.root.findByProps({ 'aria-label': 'OpenBKN CLI 执行路径' }).props.onChange({ target: { value: '/unsaved/openbkn' } }))
  act(() => harness.set('en'))
  assert.equal(renderer.root.findByProps({ 'aria-label': 'OpenBKN platform URL' }).props.value, 'https://unsaved.invalid')
  assert.equal(renderer.root.findByProps({ 'aria-label': 'OpenBKN CLI executable path' }).props.value, '/unsaved/openbkn')
  assert.equal(renderer.root.findByType('details').props.open, true)
  assert.match(JSON.stringify(renderer.toJSON()), /Save and continue/)
  act(() => renderer.unmount())
})

test('the released pending login request survives locale changes without cancellation or a second login', async () => {
  let resolve!: (value: readonly []) => void
  let logins = 0
  let statuses = 0
  let signal: AbortSignal | undefined
  const pending = new Promise<readonly []>(accept => { resolve = accept })
  const controller = new OpenBknUiController(port({
    beginLogin: async current => { logins++; signal = current; return pending },
    status: async () => { statuses++; return { kind: 'authenticated', baseUrl: 'https://platform.invalid' } },
  }), async () => 's')
  controller.open()
  const request = controller.beginLogin()
  const harness = localeHarness()
  function State() {
    const current = useSyncExternalStore(listener => controller.subscribe(listener), () => controller.getSnapshot())
    const t = useOpenBknTranslation()
    return createElement('p', null, current.phase === 'loading' ? t('connectingToOpenBKN') : current.phase)
  }
  const Component = localized(State, harness.locale)
  let renderer!: ReturnType<typeof create>
  act(() => { renderer = create(createElement(Component)) })
  act(() => harness.set('en'))
  assert.match(JSON.stringify(renderer.toJSON()), /Connecting to OpenBKN/)
  assert.equal(signal?.aborted, false)
  assert.equal(logins, 1)
  resolve([])
  await act(async () => { await request })
  assert.equal(statuses, 1)
  assert.equal(controller.snapshot().phase, 'ready')
  act(() => renderer.unmount())
})

test('all three Latest provenance tabs remain and graph selection survives locale changes without rereading', async () => {
  const harness = localeHarness()
  const controller = new ProvenanceOverlayController()
  const view: ProvenanceView = {
    interactionId: 'interaction-original', timeline: [
      { seq: 0, kind: 'managed', tool: 'query_object_instance', at: 1, outcome: 'ok', summary: 'query_object_instance · 2 项' },
      { seq: 1, kind: 'question', at: 0, summary: '用户原文：2 项' },
    ],
    sources: { timeline: 'local-session', operations: 'unavailable', business: 'platform', evidence: 'unavailable', degraded: [] },
    execution: { operations: [] }, evidence: { kind: 'unavailable', reason: 'no-receipts' },
    business: { kind: 'ready', operations: [{ id: 'op-original', attempt: 1, toolName: 'query_object_instance', status: 'resolved', missingFacts: [], elements: [
      { kind: 'object', id: 'a', name: '平台原文 A' }, { kind: 'object', id: 'b', name: '平台原文 B' },
    ] }], contextRelations: [], derivedFacts: [], conversationContext: [] },
  }
  const original = JSON.stringify(view)
  const handle = { schemaVersion: 2 as const, interactionId: 'interaction-original', status: 'completed' as const, requestIds: [], traceIds: [], receiptIds: [], partial: false }
  controller.open('session-original', 'message-original', handle)
  const Component = localized(ProvenanceOverlay, harness.locale)
  let reads = 0
  const load = async () => { reads++; return view }
  let renderer!: ReturnType<typeof create>
  await act(async () => { renderer = create(createElement(Component, {
    useProvenanceOverlay: (select: (value: ReturnType<typeof controller.getSnapshot>) => unknown) => select(useSyncExternalStore(controller.subscribe, controller.getSnapshot)),
    load, close: () => controller.close(),
  } as never)) })
  act(() => renderer.root.findAllByType('button').find(button => button.children.includes('业务上下文图'))!.props.onClick())
  const node = () => renderer.root.findAllByType('button').find(button => button.findAllByType('strong').some(label => label.children.includes('平台原文 B')))!
  act(() => node().props.onClick())
  act(() => harness.set('en'))
  const text = JSON.stringify(renderer.toJSON())
  assert.match(text, /Execution provenance/)
  assert.match(text, /Business context graph/)
  assert.match(text, /Evidence chain/)
  assert.match(text, /平台原文 B/)
  assert.equal(node().props['aria-pressed'], true)
  assert.equal(reads, 1)
  assert.equal(JSON.stringify(view), original)
  act(() => renderer.root.findAllByType('button').find(button => button.children.includes('Execution provenance'))!.props.onClick())
  assert.match(JSON.stringify(renderer.toJSON()), /query_object_instance · items: 2/)
  assert.match(JSON.stringify(renderer.toJSON()), /用户原文：2 项/)
  assert.equal(JSON.stringify(view), original)
  act(() => renderer.unmount())
})

test('only plugin-owned diagnostic guidance and suggestion templates are translated', () => {
  const t = (key: OpenBknMessageKey, params?: Record<string, unknown>) => translateMessage('en', key, params)
  assert.match(diagnosticAction('Open OpenBKN settings, save the platform URL, then sign in with the OpenBKN CLI.', t), /Open OpenBKN settings/)
  assert.equal(diagnosticAction('平台原文 unchanged', t), '平台原文 unchanged')
  assert.match(sessionSuggestionText('了解「原始网络」知识网络。', t), /原始网络/)
  assert.doesNotMatch(sessionSuggestionText('了解「原始网络」知识网络。', t), /了解|知识网络/)
  assert.equal(sessionSuggestionText('平台自有建议 unchanged', t), '平台自有建议 unchanged')
})
