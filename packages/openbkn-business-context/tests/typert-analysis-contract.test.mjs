import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { WorkspaceAnalyzer } from '@deepseek-ai/dsh-typert-generator'

const root = fileURLToPath(new URL('../../../', import.meta.url))

test('discovers every public OpenBKN Remote method from the host aggregate', () => {
  const model = new WorkspaceAnalyzer({
    root,
    faces: ['host'],
    packages: ['@openbkn/dsh-business-context'],
    checkDiagnostics: false,
  }).analyze()
  const bundle = model.faces[0]?.packages.find(
    (candidate) => candidate.name === '@openbkn/dsh-business-context',
  )

  assert.ok(bundle)
  // Ten business methods, diagnostics getReport and four independent settings/setup methods.
  assert.equal(bundle.invocations.length, 15)
  const settings = bundle.invocations.filter(invocation => invocation.service === 'openbknConfiguration')
  assert.equal(settings.length, 4)
})
