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
  // Single-result streams carry the login/provenance result and native cancellation.
  assert.equal(bundle.invocations.length, 19)
  const business = bundle.invocations.filter(invocation => invocation.service === 'openbknBusinessContext')
  assert.deepEqual(business.map(invocation => invocation.method).sort(), [
    'beginLogin', 'beginLoginStream', 'bindNetwork', 'bindNetworkWorkspace', 'configureToken',
    'getNetworkBinding', 'getSessionSuggestions', 'getTurnProvenance', 'getTurnProvenanceView', 'getTurnProvenanceViewStream', 'listNetworks', 'provenanceDetailStream', 'status',
  ])
  const login = business.find(invocation => invocation.method === 'beginLoginStream')
  assert.equal(login.mode, 'stream')
  assert.deepEqual(login.parameters, [])
  assert.deepEqual(login.cancellation, { parameter: 'signal' })
  const provenance = business.find(invocation => invocation.method === 'getTurnProvenanceViewStream')
  assert.equal(provenance.mode, 'stream')
  assert.deepEqual(provenance.parameters.map(parameter => parameter.name), ['sessionId', 'messageId'])
  assert.deepEqual(provenance.cancellation, { parameter: 'signal' })
  const detail = business.find(invocation => invocation.method === 'provenanceDetailStream')
  assert.equal(detail.mode, 'stream')
  assert.deepEqual(detail.parameters.map(parameter => parameter.name), ['sessionId', 'messageId', 'request'])
  assert.deepEqual(detail.cancellation, { parameter: 'signal' })
  const settings = bundle.invocations.filter(invocation => invocation.service === 'openbknConfiguration')
  assert.deepEqual(settings.map(invocation => invocation.method).sort(), [
    'checkCli', 'getConfiguration', 'installCli', 'previewCertificate', 'saveConfiguration',
  ])
})
