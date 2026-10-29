/** Loaded only by the dedicated CLI child; never imported by a Host entry. */
import { readFileSync } from 'node:fs'
import { X509Certificate, createHash } from 'node:crypto'
import { setGlobalDispatcher } from 'undici'
import { platformPinDispatcher, type PlatformPin } from './platform-pin.js'

const file = process.env.OPENBKN_PLATFORM_PIN_FILE
if (!file) throw new Error('OpenBKN platform pin is required in the managed CLI child.')
const text = readFileSync(file, 'utf8')
if (Buffer.byteLength(text) > 64 * 1024) throw new Error('Invalid OpenBKN platform pin.')
const pin = JSON.parse(text) as PlatformPin
const cert = new X509Certificate(pin.pem)
if (pin.fingerprint256 !== cert.fingerprint256
  || pin.spki !== createHash('sha256').update(cert.publicKey.export({ type: 'spki', format: 'der' })).digest('base64')
  || typeof pin.remoteAddress !== 'string' || pin.remoteAddress.length > 128) throw new Error('Invalid OpenBKN platform pin.')
// This is the child CLI's dispatcher, not the DSH Host's or the browser's.
setGlobalDispatcher(platformPinDispatcher(pin))
