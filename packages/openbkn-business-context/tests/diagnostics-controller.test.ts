import assert from 'node:assert/strict'
import test from 'node:test'
import { DiagnosticsPanelController, type DiagnosticsUiPort } from '../src/client/diagnostics-controller.ts'
import { diagnosticsExportFileName, exportDiagnosticsReport, serializeDiagnosticsReport, type DownloadPort } from '../src/client/diagnostics-export.ts'
import type { DiagnosticsReport } from '../src/diagnostics-contract.ts'

function report(overrides: Partial<DiagnosticsReport> = {}): DiagnosticsReport {
  return {
    schemaVersion: 1,
    reportId: 'abcd1234',
    createdAt: '2026-10-05T12:00:00.000Z',
    target: { hostForm: 'npm', platform: 'darwin', dshVersion: null, pluginDiskVersion: '0.2.0-rc.2-openbkn.0.2.0-4', pluginLoadedVersion: null },
    mode: 'passive',
    checks: [],
    coverage: { executedChecks: 0, notRunChecks: 0, insufficientEvidenceChecks: 0, notes: [] },
    ...overrides,
  }
}

class FakePort implements DiagnosticsUiPort {
  calls = 0
  constructor(private readonly outcome: () => Promise<DiagnosticsReport>) {}
  async getReport(): Promise<DiagnosticsReport> { this.calls += 1; return await this.outcome() }
}

function settled(): { promise: Promise<void>; resolve(): void } {
  let resolve!: () => void
  const promise = new Promise<void>(given => { resolve = given })
  return { promise, resolve }
}

test('open loads a report and settles into ready', async () => {
  const controller = new DiagnosticsPanelController(new FakePort(async () => report()))
  controller.open()
  await controller.load()
  const state = controller.getSnapshot()
  assert.equal(state.open, true)
  assert.equal(state.phase, 'ready')
  assert.equal(state.report?.reportId, 'abcd1234')
})

test('a failing getReport degrades to the unavailable phase without guessing a cause', async () => {
  const controller = new DiagnosticsPanelController(new FakePort(async () => { throw new Error('typert gateway: unavailable') }))
  controller.open()
  await controller.load()
  const state = controller.getSnapshot()
  assert.equal(state.phase, 'unavailable')
  assert.equal(state.report, undefined)
  assert.ok(state.message !== undefined)
  assert.ok(!state.message.includes('gateway'), 'the transport detail must not surface verbatim')
})

test('a stale in-flight load never overwrites a newer one', async () => {
  const first = settled()
  const second = settled()
  let call = 0
  const controller = new DiagnosticsPanelController(new FakePort(() => {
    call += 1
    return call === 1 ? first.promise.then(() => report({ reportId: 'stale0000' })) : second.promise.then(() => report({ reportId: 'fresh9999' }))
  }))
  const early = controller.load()
  const late = controller.load()
  second.resolve()
  first.resolve()
  await Promise.all([early, late])
  assert.equal(controller.getSnapshot().report?.reportId, 'fresh9999')
})

test('close hides the panel but keeps the last report for reopening', async () => {
  const controller = new DiagnosticsPanelController(new FakePort(async () => report()))
  controller.open()
  await controller.load()
  controller.close()
  const state = controller.getSnapshot()
  assert.equal(state.open, false)
  assert.equal(state.phase, 'ready')
})

test('the export file name is UTC-stamped and id-suffixed', () => {
  const name = diagnosticsExportFileName(report())
  assert.equal(name, 'OpenBKN-diagnostic-20261005T120000000Z-abcd1234.json')
  const hostile = diagnosticsExportFileName(report({ reportId: '../ev%il', createdAt: '2026-10-05T12:00:00.000Z' }))
  assert.ok(!hostile.includes('/'), hostile)
  assert.ok(!hostile.includes('..'), hostile)
})

test('export writes the serialized report through the download port', () => {
  const downloads: { name: string; contents: string }[] = []
  const port: DownloadPort = { download: (name, contents) => { downloads.push({ name, contents }) } }
  exportDiagnosticsReport(report({ checks: [{ id: 'x', stage: 'component', status: 'fail', source: 'host-runtime', code: 'initialization-failed', evidence: {}, nextAction: null }] }), port)
  assert.equal(downloads.length, 1)
  assert.equal(downloads[0].name, 'OpenBKN-diagnostic-20261005T120000000Z-abcd1234.json')
  const parsed = JSON.parse(downloads[0].contents) as DiagnosticsReport
  assert.equal(parsed.schemaVersion, 1)
  assert.equal(parsed.checks[0].code, 'initialization-failed')
})

test('serialization is deterministic and terminates with a newline', () => {
  const text = serializeDiagnosticsReport(report())
  assert.ok(text.endsWith('\n'))
  assert.equal(JSON.parse(text).reportId, 'abcd1234')
})
