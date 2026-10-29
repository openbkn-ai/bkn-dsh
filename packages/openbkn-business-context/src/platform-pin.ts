/** Private-environment automatic trust: observe once, pin each connection. */
import { createHash, X509Certificate } from 'node:crypto'
import { connect as tlsConnect, type TLSSocket } from 'node:tls'
import { isIP } from 'node:net'
import { Agent, Pool, fetch as pinnedFetch, type buildConnector } from 'undici'
import { PlatformConnectionError, platformOrigin } from './platform-trust.js'

export interface PlatformPin {
  origin: string
  fingerprint256: string
  spki: string
  pem: string
  remoteAddress: string
}

function identity(socket: TLSSocket, origin: string): PlatformPin {
  const raw = socket.getPeerCertificate().raw
  if (!raw) throw new PlatformConnectionError('CERTIFICATE_INVALID')
  const cert = new X509Certificate(raw)
  if (Date.now() < Date.parse(cert.validFrom) || Date.now() >= Date.parse(cert.validTo)) {
    throw new PlatformConnectionError('CERTIFICATE_EXPIRED')
  }
  return { origin, fingerprint256: cert.fingerprint256, pem: cert.toString(),
    spki: createHash('sha256').update(cert.publicKey.export({ type: 'spki', format: 'der' })).digest('base64'),
    remoteAddress: socket.remoteAddress?.replace(/^::ffff:/, '') ?? '' }
}

/** No HTTP or credential is sent during this bounded, explicitly accepted bootstrap. */
export async function observePlatform(baseUrl: string, signal?: AbortSignal): Promise<PlatformPin> {
  const origin = platformOrigin(baseUrl), url = new URL(origin)
  signal?.throwIfAborted()
  return await new Promise((resolve, reject) => {
    const host = url.hostname.replace(/^\[|\]$/g, '')
    const socket = tlsConnect({ host, port: Number(url.port || 443),
      servername: isIP(host) ? undefined : host, rejectUnauthorized: false })
    let settled = false
    const finish = (error?: unknown, value?: PlatformPin) => {
      if (settled) return; settled = true
      clearTimeout(timer); signal?.removeEventListener('abort', aborted); socket.destroy()
      if (error) reject(error); else resolve(value!)
    }
    const timer = setTimeout(() => finish(new PlatformConnectionError('NETWORK_TIMEOUT')), 5_000)
    const aborted = () => finish(signal?.reason ?? new Error('Cancelled'))
    signal?.addEventListener('abort', aborted, { once: true })
    socket.once('error', finish)
    socket.once('secureConnect', () => { try { finish(undefined, identity(socket, origin)) } catch (error) { finish(error) } })
    if (signal?.aborted) aborted()
  })
}

export function samePlatformPin(a: PlatformPin, b: PlatformPin): boolean {
  return a.origin === b.origin && a.fingerprint256 === b.fingerprint256 && a.remoteAddress === b.remoteAddress
}

/** Private TOFU substitutes an exact observed leaf identity for public CA/name validation. */
export function platformPinDispatcher(pin: PlatformPin, connect: typeof tlsConnect = tlsConnect): Agent {
  const expected = platformOrigin(pin.origin)
  const connector: buildConnector.connector = (options, callback) => {
    const host = options.hostname.replace(/^\[|\]$/g, '')
    const socket = connect({ host, port: Number(options.port || 443),
      servername: isIP(host) ? undefined : host, rejectUnauthorized: false, ALPNProtocols: ['http/1.1'] })
    let completed = false
    const finish = (error: Error | null) => {
      if (completed) return; completed = true; clearTimeout(timer)
      if (error) { socket.destroy(); callback(error, null) } else callback(null, socket)
    }
    const timer = setTimeout(() => finish(new PlatformConnectionError('NETWORK_TIMEOUT')), 5_000)
    socket.once('error', finish)
    socket.once('secureConnect', () => {
      try {
        if (!samePlatformPin(pin, identity(socket, expected))) throw new PlatformConnectionError('PLATFORM_IDENTITY_CHANGED')
        finish(null)
      } catch (error) { finish(error as Error) }
    })
  }
  return new Agent({ factory: (origin) => {
    if (new URL(origin).origin !== expected) throw new PlatformConnectionError('TRUST_SCOPE_MISMATCH')
    return new Pool(origin, { connect: connector })
  } })
}

export function platformPinFetch(pin: PlatformPin): { fetch: typeof fetch; dispose(): Promise<void> } {
  const dispatcher = platformPinDispatcher(pin), lifetime = new AbortController()
  return {
    fetch: async (input, init) => {
      lifetime.signal.throwIfAborted()
      const url = new URL(input instanceof Request ? input.url : String(input))
      if (url.origin !== pin.origin || url.username || url.password) throw new PlatformConnectionError('TRUST_SCOPE_MISMATCH')
      const signal = init?.signal ?? (input instanceof Request ? input.signal : undefined)
      return await pinnedFetch(String(url), { ...init, redirect: init?.redirect === 'error' ? 'error' : 'manual', dispatcher,
        signal: signal ? AbortSignal.any([signal, lifetime.signal]) : lifetime.signal } as never) as unknown as Response
    },
    dispose: async () => { lifetime.abort(); await dispatcher.destroy() },
  }
}
