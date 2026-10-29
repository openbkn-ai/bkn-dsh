import { useEffect, useRef, useState } from 'react'
import type { CertificateIdentity, OpenBknConfigurationInput, PlatformCertificatePreview } from '../types.js'
import { useOpenBknTranslation } from './locale.tsx'

export type CertificateChoice = Pick<OpenBknConfigurationInput, 'trustConfirmationId' | 'removeCertificate'>
export interface CertificatePort { previewCertificate(baseUrl: string, pem: string): Promise<PlatformCertificatePreview> }

/** File contents are previewed in the Host; no path or certificate is persisted in browser state. */
export function CertificateControl({ baseUrl, current, certificateError, disabled, port, onChange }: {
  baseUrl: string; current?: CertificateIdentity; certificateError?: string; disabled: boolean; port?: CertificatePort
  onChange(choice: CertificateChoice, pending: boolean): void
}) {
  const t = useOpenBknTranslation()
  const sequence = useRef(0)
  const [preview, setPreview] = useState<PlatformCertificatePreview>()
  const [confirmed, setConfirmed] = useState(false)
  const [reading, setReading] = useState(false)
  const [error, setError] = useState<string>()
  const [remove, setRemove] = useState(false)
  useEffect(() => {
    sequence.current++
    setPreview(undefined); setConfirmed(false); setReading(false); setError(undefined); setRemove(false)
    onChange({}, false)
    return () => { sequence.current++ }
  }, [baseUrl])

  async function select(file: File | undefined) {
    const revision = ++sequence.current
    setPreview(undefined); setConfirmed(false); setError(undefined); setRemove(false); setReading(false)
    if (!file || !port) { onChange({}, false); return }
    setReading(true); onChange({}, true)
    try {
      if (file.size > 64 * 1024) throw new Error('CERTIFICATE_INVALID')
      const result = await port.previewCertificate(baseUrl, await file.text())
      if (sequence.current !== revision) return
      setPreview(result)
    } catch (failure) {
      if (sequence.current !== revision) return
      const reason = (failure as { details?: { reason?: unknown } })?.details?.reason
      setError(typeof reason === 'string' && /^CERTIFICATE_(INVALID|EXPIRED|HOSTNAME_MISMATCH)$|^TRUST_SCOPE_MISMATCH$/.test(reason) ? reason : 'CERTIFICATE_INVALID')
      onChange({}, false)
    } finally { if (sequence.current === revision) setReading(false) }
  }
  function cancel() {
    sequence.current++; setPreview(undefined); setConfirmed(false); setReading(false); setError(undefined)
    onChange({}, false)
  }
  const identity = preview ?? current
  return <fieldset disabled={disabled || port === undefined} style={{ border: '1px solid #cbd5e1', borderRadius: 8, padding: 12, minWidth: 0, display: 'grid', gap: 10 }}>
    <legend>{t('platformCertificate')}</legend>
    <p style={{ margin: 0, fontSize: 13 }}>{t('platformCertificateHelp')}</p>
    <label>{t('selectPlatformCertificate')}<input type="file" accept=".pem,.crt,.cer" aria-label={t('selectPlatformCertificate')} onChange={event => void select(event.currentTarget.files?.[0])} /></label>
    {reading ? <p role="status">{t('previewingCertificate')}</p> : null}
    {error ? <p role="alert">{t('certificateNotAccepted')} ({error})</p> : null}
    {certificateError ? <p role="status">{t('certificateNotAccepted')} ({certificateError})</p> : null}
    {identity ? <dl style={{ margin: 0, overflowWrap: 'anywhere', fontSize: 13 }}>
      <dt>{t('openBKNPlatformURL')}</dt><dd>{identity.origin}</dd>
      <dt>{t('certificateSubject')}</dt><dd>{identity.subject}</dd>
      <dt>{t('certificateIssuer')}</dt><dd>{identity.issuer}</dd>
      <dt>{t('certificateValidity')}</dt><dd>{identity.validFrom} — {identity.validTo}</dd>
      <dt>{t('certificateFingerprint')}</dt><dd>{identity.fingerprint256}</dd>
    </dl> : null}
    {preview ? <>
      <label><input type="checkbox" checked={confirmed} onChange={event => {
        setConfirmed(event.currentTarget.checked)
        onChange(event.currentTarget.checked ? { trustConfirmationId: preview.confirmationId } : {}, !event.currentTarget.checked)
      }} />{t('confirmPlatformCertificate')}</label>
      <button type="button" onClick={cancel}>{t('cancelCertificateSelection')}</button>
    </> : current || certificateError ? <label><input type="checkbox" checked={remove} onChange={event => {
      setRemove(event.currentTarget.checked); onChange(event.currentTarget.checked ? { removeCertificate: true } : {}, false)
    }} />{t('removePlatformCertificate')}</label> : null}
  </fieldset>
}
