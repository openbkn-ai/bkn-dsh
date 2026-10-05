import assert from 'node:assert/strict'
import test from 'node:test'
import {
  BUSINESS_CONFIG_FIELDS,
  DIAGNOSTICS_EVIDENCE_TEXT_LIMIT,
  DIAGNOSTICS_SCHEMA_VERSION,
  diagnosticsCoverageOf,
  newDiagnosticsReportId,
  sanitizeDiagnosticsEvidence,
} from '../src/diagnostics-contract.ts'

test('the report schema version and codes are frozen additions', () => {
  assert.equal(DIAGNOSTICS_SCHEMA_VERSION, 1)
  assert.ok(BUSINESS_CONFIG_FIELDS.includes('baseUrl'))
  assert.ok(BUSINESS_CONFIG_FIELDS.includes('cliPath'))
})

test('report ids are unique, short hex strings', () => {
  const seen = new Set<string>()
  for (let index = 0; index < 200; index += 1) {
    const id = newDiagnosticsReportId()
    assert.match(id, /^[0-9a-f]{8}$/)
    seen.add(id)
  }
  assert.ok(seen.size > 190)
})

test('coverage separates executed, not-run, and insufficient-evidence checks', () => {
  const coverage = diagnosticsCoverageOf([
    { id: 'a', stage: 'component', status: 'pass', source: 'host-runtime', code: 'c', evidence: {}, nextAction: null },
    { id: 'b', stage: 'cli', status: 'fail', source: 'host-runtime', code: 'c', evidence: {}, nextAction: null },
    { id: 'c', stage: 'network', status: 'not-run', source: 'host-runtime', code: 'c', evidence: {}, nextAction: null },
    { id: 'd', stage: 'network', status: 'insufficient-evidence', source: 'host-runtime', code: 'c', evidence: {}, nextAction: null },
  ], ['note'])
  assert.deepEqual(coverage, {
    executedChecks: 3, notRunChecks: 1, insufficientEvidenceChecks: 1, notes: ['note'],
  })
})

test('evidence sanitization keeps only bounded scalars', () => {
  const clean = sanitizeDiagnosticsEvidence({
    count: 3,
    flag: true,
    none: null,
    configField: 'baseUrl',
    droppedObject: { nested: 'secret' },
    droppedArray: ['a', 'b'],
    droppedSymbol: Symbol('x'),
    droppedFunction: () => undefined,
    droppedLongText: 'x'.repeat(DIAGNOSTICS_EVIDENCE_TEXT_LIMIT + 1),
    droppedNaN: Number.NaN,
    droppedFreeText: 'anything at all',
  })
  assert.deepEqual(clean, { count: 3, flag: true, none: null, configField: 'baseUrl' })
})
