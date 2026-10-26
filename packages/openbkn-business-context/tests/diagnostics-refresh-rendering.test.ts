import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { act, create } from 'react-test-renderer'
import { OpenBknDiagnostics } from '../src/client/OpenBknDiagnostics.tsx'
import type { DiagnosticsPanelState } from '../src/client/diagnostics-controller.ts'
import type { DiagnosticsReport } from '../src/diagnostics-contract.ts'

const report: DiagnosticsReport = {
  schemaVersion: 1, reportId: 'fixture', createdAt: '2026-10-22T00:00:00Z', mode: 'passive',
  target: { hostForm: 'npm', platform: 'darwin', dshVersion: null, pluginDiskVersion: null, pluginLoadedVersion: null },
  checks: [], coverage: { executedChecks: 0, notRunChecks: 0, insufficientEvidenceChecks: 0, notes: [] },
}

for (const outcome of ['ready', 'unavailable'] as const) {
  test(`the focused diagnostic refresh control survives loading, ${outcome} and retry`, () => {
    let state: DiagnosticsPanelState = { open: true, phase: 'ready', report }
    const props = { useDiagnostics: (select: (value: DiagnosticsPanelState) => unknown) => select(state), close() {}, refresh: async () => {} }
    let ui!: ReturnType<typeof create>
    const render = () => createElement(OpenBknDiagnostics, props as never)
    act(() => { ui = create(render()) })
    try {
      const original = ui.root.findAllByType('button').at(-1)!
      assert.equal(original.children.join(''), '重新采集')
      for (const next of [
        { open: true, phase: 'loading', report },
        { open: true, phase: outcome, report: outcome === 'ready' ? { ...report, reportId: 'next' } : undefined },
        { open: true, phase: 'loading' },
        { open: true, phase: 'ready', report },
      ] satisfies DiagnosticsPanelState[]) {
        state = next
        act(() => ui.update(render()))
        assert.equal(ui.root.findAllByType('button').at(-1), original, 'do not unmount the active refresh button')
      }
    } finally { act(() => ui.unmount()) }
  })
}
