import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { act, create } from 'react-test-renderer'
import { CertificateControl, type CertificateChoice } from '../src/client/CertificateControl.tsx'
import { OpenBknUiController } from '../src/client/openbkn-ui-controller.ts'
import { renderUiMessage } from '../src/client/messages.ts'
import type { PlatformCertificatePreview } from '../src/types.ts'

const preview: PlatformCertificatePreview = { confirmationId: 'synthetic-preview-id', origin: 'https://platform.example', subject: 'CN=synthetic', issuer: 'CN=synthetic',
  validFrom: '2026-01-01', validTo: '2027-01-01', fingerprint256: 'AA:BB:CC', isCA: true }
const flush = () => new Promise<void>(resolve => setImmediate(resolve))
const file = () => new File(['synthetic certificate content'], 'admin.pem')

test('certificate preview displays identity and requires an explicit checkbox before enabling save', async () => {
  let last: [CertificateChoice, boolean] | undefined
  let ui!: ReturnType<typeof create>
  await act(async () => { ui = create(createElement(CertificateControl, { baseUrl: preview.origin, disabled: false,
    port: { previewCertificate: async () => preview }, onChange: (choice, busy) => { last = [choice, busy] } })) })
  try {
    await act(async () => { ui.root.findByProps({ type: 'file' }).props.onChange({ currentTarget: { files: [file()] } }); await flush() })
    assert.deepEqual(last, [{}, true], 'preview alone keeps trust unconfirmed')
    const text = JSON.stringify(ui.toJSON())
    assert.match(text, /AA:BB:CC/); assert.match(text, /https:\/\/platform.example/)
    assert.doesNotMatch(text, /synthetic certificate content/)
    await act(async () => { ui.root.findByProps({ type: 'checkbox' }).props.onChange({ currentTarget: { checked: true } }) })
    assert.deepEqual(last, [{ trustConfirmationId: preview.confirmationId }, false])
    await act(async () => { ui.root.findByProps({ type: 'checkbox' }).props.onChange({ currentTarget: { checked: false } }) })
    assert.deepEqual(last, [{}, true])
    await act(async () => { ui.root.findByType('button').props.onClick() })
    assert.deepEqual(last, [{}, false]); assert.equal(ui.root.findAllByProps({ type: 'checkbox' }).length, 0)
  } finally { await act(async () => { ui.unmount() }) }
})

test('changing platform invalidates pending certificate preview and its late result', async () => {
  let resolve!: (value: PlatformCertificatePreview) => void
  const pending = new Promise<PlatformCertificatePreview>(done => { resolve = done })
  let last: [CertificateChoice, boolean] | undefined
  const props = { baseUrl: preview.origin, disabled: false, port: { previewCertificate: async () => pending },
    onChange: (choice: CertificateChoice, busy: boolean) => { last = [choice, busy] } }
  let ui!: ReturnType<typeof create>
  await act(async () => { ui = create(createElement(CertificateControl, props)) })
  try {
    await act(async () => { ui.root.findByProps({ type: 'file' }).props.onChange({ currentTarget: { files: [file()] } }); await flush() })
    await act(async () => { ui.update(createElement(CertificateControl, { ...props, baseUrl: 'https://other.example' })) })
    await act(async () => { resolve(preview); await flush() })
    assert.deepEqual(last, [{}, false]); assert.doesNotMatch(JSON.stringify(ui.toJSON()), /AA:BB:CC/)
  } finally { await act(async () => { ui.unmount() }) }
})

test('an invalid stored certificate can be removed, without selecting or trusting a new file', async () => {
  let choice: CertificateChoice | undefined
  let ui!: ReturnType<typeof create>
  await act(async () => { ui = create(createElement(CertificateControl, { baseUrl: preview.origin, disabled: false,
    certificateError: 'CERTIFICATE_EXPIRED', port: { previewCertificate: async () => preview }, onChange: value => { choice = value } })) })
  try {
    assert.match(JSON.stringify(ui.toJSON()), /CERTIFICATE_EXPIRED/)
    await act(async () => { ui.root.findByProps({ type: 'checkbox' }).props.onChange({ currentTarget: { checked: true } }) })
    assert.deepEqual(choice, { removeCertificate: true })
  } finally { await act(async () => { ui.unmount() }) }
})

test('malformed preview errors never render raw stderr or credential text', async () => {
  let ui!: ReturnType<typeof create>
  await act(async () => { ui = create(createElement(CertificateControl, { baseUrl: preview.origin, disabled: false,
    port: { previewCertificate: async () => { throw { message: 'secret-token', details: { reason: 'secret-device-code' } } } }, onChange: () => {} })) })
  try {
    await act(async () => { ui.root.findByProps({ type: 'file' }).props.onChange({ currentTarget: { files: [file()] } }); await flush() })
    const text = JSON.stringify(ui.toJSON()); assert.match(text, /CERTIFICATE_INVALID/); assert.doesNotMatch(text, /secret-token|secret-device-code/)
  } finally { await act(async () => { ui.unmount() }) }
})

test('connection error UI distinguishes TLS, network and missing companion with stable safe codes', async () => {
  for (const reason of ['CERTIFICATE_UNTRUSTED', 'CERTIFICATE_EXPIRED', 'NETWORK_TIMEOUT', 'NETWORK_UNREACHABLE', 'TRUST_TRANSPORT_UNAVAILABLE', 'TRUST_CLI_UNAVAILABLE', 'PLATFORM_REJECTED', 'CLI_FAILED']) {
    const controller = new OpenBknUiController({ status: async () => { throw { code: 'openbkn/transport-failed', details: { reason }, message: 'secret-token' } } } as never, async () => '', () => {})
    controller.open(); await controller.refresh()
    const text = renderUiMessage(controller.snapshot().message)
    assert.match(text, new RegExp(reason)); assert.doesNotMatch(text, /secret-token|尚未确定/)
    controller.close()
  }
})
