import { X509Certificate } from 'node:crypto'
import { isIP } from 'node:net'
import { Agent, fetch as scopedFetch } from 'undici'
import type { CertificateIdentity, PlatformCertificateTrust } from './types.js'
export type { CertificateIdentity, PlatformCertificateTrust } from './types.js'

export type ConnectionFailureCode = 'CERTIFICATE_UNTRUSTED' | 'CERTIFICATE_INVALID'
  | 'CERTIFICATE_EXPIRED' | 'CERTIFICATE_HOSTNAME_MISMATCH' | 'TRUST_SCOPE_MISMATCH'
  | 'TRUST_TRANSPORT_UNAVAILABLE' | 'TRUST_CLI_UNAVAILABLE' | 'NETWORK_TIMEOUT' | 'NETWORK_UNREACHABLE'
  | 'PLATFORM_REJECTED' | 'CLI_FAILED'

/** Only stable classifications may cross the Host/UI boundary. */
export class PlatformConnectionError extends Error {
  constructor(readonly code: ConnectionFailureCode) {
    super(`OpenBKN connection failed (${code}).`)
    this.name = 'PlatformConnectionError'
  }
}

export function platformOrigin(baseUrl: string): string {
  let url: URL
  try { url = new URL(baseUrl) } catch { throw new PlatformConnectionError('TRUST_SCOPE_MISMATCH') }
  if (url.protocol !== 'https:' || url.username || url.password) throw new PlatformConnectionError('TRUST_SCOPE_MISMATCH')
  return url.origin
}

/** Accept exactly one bounded certificate, never a key, path or arbitrary file read. */
export function inspectPlatformCertificate(baseUrl: string, pem: string, now = Date.now()): CertificateIdentity {
  const origin = platformOrigin(baseUrl)
  if (typeof pem !== 'string' || Buffer.byteLength(pem) > 64 * 1024
    || !/^\s*-----BEGIN CERTIFICATE-----\r?\n[A-Za-z0-9+/=\r\n]+-----END CERTIFICATE-----\s*$/.test(pem)) {
    throw new PlatformConnectionError('CERTIFICATE_INVALID')
  }
  let cert: X509Certificate
  try { cert = new X509Certificate(pem) } catch { throw new PlatformConnectionError('CERTIFICATE_INVALID') }
  if (now < Date.parse(cert.validFrom) || now >= Date.parse(cert.validTo)) throw new PlatformConnectionError('CERTIFICATE_EXPIRED')
  // CA subjects need not name the server. The TLS handshake always checks the
  // actual leaf chain, dates and host; an imported leaf must also match now.
  const hostname = new URL(origin).hostname.replace(/^\[|\]$/g, '')
  if (!cert.ca && !(isIP(hostname) ? cert.checkIP(hostname) : cert.checkHost(hostname))) {
    throw new PlatformConnectionError('CERTIFICATE_HOSTNAME_MISMATCH')
  }
  const text = (value: string) => value.replace(/[\x00-\x1f\x7f]/g, ' ').slice(0, 512)
  return { origin, subject: text(cert.subject), issuer: text(cert.issuer), validFrom: cert.validFrom,
    validTo: cert.validTo, fingerprint256: cert.fingerprint256, isCA: cert.ca }
}

export function validatePlatformTrust(baseUrl: string, trust: PlatformCertificateTrust): CertificateIdentity {
  const identity = inspectPlatformCertificate(baseUrl, trust.pem)
  if (trust.origin !== identity.origin || trust.fingerprint256 !== identity.fingerprint256) {
    throw new PlatformConnectionError('TRUST_SCOPE_MISMATCH')
  }
  return identity
}

/** One business-owner lifetime, no global dispatcher or process.env writes. */
export class OpenBknPlatformTrust {
  private agent?: Agent
  private readonly lifetime = new AbortController()
  constructor(private readonly baseUrl: string, readonly certificate?: PlatformCertificateTrust) {
    if (certificate !== undefined) validatePlatformTrust(baseUrl, certificate)
  }

  readonly fetch: typeof fetch = async (input, init) => {
    this.lifetime.signal.throwIfAborted()
    if (this.certificate === undefined) return await fetch(input, init)
    validatePlatformTrust(this.baseUrl, this.certificate)
    const url = new URL(input instanceof Request ? input.url : String(input))
    if (url.origin !== this.certificate.origin || url.username || url.password) {
      throw new PlatformConnectionError('TRUST_SCOPE_MISMATCH')
    }
    this.agent ??= new Agent({ connect: { ca: this.certificate.pem, rejectUnauthorized: true } })
    // Redirect policy remains owned by the reader / MCP same-origin wrapper.
    // Manual responses prevent undici from sending a request before that fence.
    const signal = init?.signal ?? (input instanceof Request ? input.signal : undefined)
    return await scopedFetch(input as Parameters<typeof scopedFetch>[0], {
      ...init, redirect: init?.redirect === 'error' ? 'error' : 'manual', dispatcher: this.agent,
      signal: signal ? AbortSignal.any([signal, this.lifetime.signal]) : this.lifetime.signal,
    } as Parameters<typeof scopedFetch>[1]) as unknown as Response
  }

  async dispose(): Promise<void> {
    this.lifetime.abort(new PlatformConnectionError('TRUST_SCOPE_MISMATCH'))
    await this.agent?.destroy()

  }
}

/** Classify bounded CLI output in memory; do not copy it into an Error. */
export function connectionFailure(error: unknown): ConnectionFailureCode | undefined {
  let current = error
  for (let depth = 0; depth < 8 && current != null; depth++) {
    if (current instanceof PlatformConnectionError) return current.code
    const value = current as { code?: unknown; message?: unknown; cause?: unknown; data?: { cause?: unknown } }
    const code = typeof value.code === 'string' ? value.code : ''
    const message = typeof current === 'string' ? current.slice(0, 64 * 1024)
      : typeof value.message === 'string' ? value.message.slice(0, 64 * 1024) : ''
    const marker = code + ' ' + message
    if (/CERT_HAS_EXPIRED|CERT_NOT_YET_VALID/.test(marker)) return 'CERTIFICATE_EXPIRED'
    if (/ERR_TLS_CERT_ALTNAME_INVALID/.test(marker)) return 'CERTIFICATE_HOSTNAME_MISMATCH'
    if (/DEPTH_ZERO_SELF_SIGNED_CERT|SELF_SIGNED_CERT_IN_CHAIN|UNABLE_TO_VERIFY_LEAF_SIGNATURE|UNABLE_TO_GET_ISSUER_CERT_LOCALLY/.test(marker)) return 'CERTIFICATE_UNTRUSTED'
    if (/ETIMEDOUT|UND_ERR_CONNECT_TIMEOUT|TimeoutError/.test(marker)) return 'NETWORK_TIMEOUT'
    if (/ECONNREFUSED|ENOTFOUND|EHOSTUNREACH|ECONNRESET/.test(marker)) return 'NETWORK_UNREACHABLE'
    if (/Device (auth|token poll) failed \((401|403)\)|Device authorization denied/.test(marker)) return 'PLATFORM_REJECTED'
    current = value.cause ?? value.data?.cause
  }
  return undefined
}
