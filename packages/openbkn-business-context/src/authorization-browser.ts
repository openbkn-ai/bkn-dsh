import { existsSync } from 'node:fs'
import { mkdtemp } from 'node:fs/promises'
import { join } from 'node:path'
import type { CliSubprocess } from './openbkn-cli-subprocess.js'
import type { PlatformPin } from './platform-pin.js'
import { PlatformConnectionError } from './platform-trust.js'

/** Installed Chromium only; a private user-data directory, never the user's daily browser. */
export async function openAuthorizationBrowser(subprocess: CliSubprocess, directory: string, pin: PlatformPin,
  address: string, signal?: AbortSignal): Promise<() => Promise<void>> {
  const url = new URL(address)
  if (url.origin !== pin.origin || url.username || url.password) throw new PlatformConnectionError('TRUST_SCOPE_MISMATCH')
  const candidates = process.platform === 'darwin'
    ? ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge']
    : process.platform === 'win32'
      ? [process.env.PROGRAMFILES, process.env['PROGRAMFILES(X86)'], process.env.LOCALAPPDATA].filter((p): p is string => !!p)
        .flatMap(p => [join(p, 'Microsoft', 'Edge', 'Application', 'msedge.exe'), join(p, 'Google', 'Chrome', 'Application', 'chrome.exe')])
      : ['google-chrome', 'microsoft-edge', 'chromium', 'chromium-browser']
  let executable: string | undefined
  for (const path of candidates) {
    try { if (process.platform !== 'linux' && !existsSync(path)) continue
      executable = await subprocess.resolveExecutable(path, undefined, signal); break } catch { signal?.throwIfAborted() }
  }
  if (!executable) throw new PlatformConnectionError('BROWSER_UNAVAILABLE')
  const profile = await mkdtemp(join(directory, 'authorization-browser-'))
  const controller = new AbortController()
  const child = subprocess.spawn({ argv: [executable, '--user-data-dir=' + profile,
    '--ignore-certificate-errors-spki-list=' + pin.spki, '--no-first-run', '--no-default-browser-check', '--new-window', url.href],
    cwd: directory, stdio: { stdin: { data: '' }, stdout: { maxBytes: 1024 }, stderr: { maxBytes: 1024 } },
    graceMs: 3000, signal: signal ? AbortSignal.any([signal, controller.signal]) : controller.signal })
  const dispose = async () => { controller.abort(); await child.done.catch(() => undefined) }
  const early = await Promise.race([child.done.then(() => true), new Promise<false>(r => setTimeout(() => r(false), 400))])
  if (early) { await dispose(); throw new PlatformConnectionError('BROWSER_UNAVAILABLE') }
  return dispose
}
