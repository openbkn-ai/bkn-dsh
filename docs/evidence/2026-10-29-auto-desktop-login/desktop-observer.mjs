// Task-only observation; no production patch, login, tool call, or credential output.
import { apply as observeBusiness } from '../2026-10-29-auto-platform-login/host-observer.mjs'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

export const name = 'automatic-login-desktop-observer'
export const inject = ['openbknBusinessContext', 'openbknPlatformAccessProfile', 'loader', 'subprocess']

export function apply(ctx) {
  observeBusiness(ctx)
  void inspectCli(ctx).catch(error => {
    writeFileSync(join(process.env.OPENBKN_AUTO_TASK, 'cli-probe-error-private.json'), JSON.stringify({ name: error.name, message: String(error.message).slice(0, 300) }))
  })
}

async function inspectCli(ctx) {
  const root = process.env.OPENBKN_AUTO_TASK
  const cliPath = ctx.openbknBusinessContext.config.cliPath
  const id = createHash('sha256').update(cliPath).digest('hex').slice(0, 12)
  const reportFile = join(root, 'cli-probe-' + id + '-private.json')
  if (existsSync(reportFile)) return
  const marker = join(root, 'cli-runtime-' + id + '-private.json')
  const empty = join(root, 'empty-cli-probe-' + id)
  mkdirSync(empty, { recursive: true, mode: 0o700 })
  const executable = await ctx.subprocess.resolveExecutable(cliPath)
  const child = ctx.subprocess.spawn({
    argv: [executable, 'auth', 'status', '--json'], cwd: root,
    env: { BKN_CONFIG_DIR: empty, BKN_TOKEN: undefined,
      NODE_OPTIONS: '--import=' + pathToFileURL(join(root, 'preload-marker.mjs')).href,
      OPENBKN_PRELOAD_MARKER: marker },
    stdio: { stdin: { data: '' }, stdout: { maxBytes: 4096 }, stderr: { maxBytes: 4096 } },
    graceMs: 3000, signal: AbortSignal.timeout(10000),
  })
  const outcome = await child.done
  const stderr = child.collected.stderr?.readFrom(0)?.text ?? ''
  writeFileSync(join(root, 'cli-probe-' + id + '-stderr-private.log'), stderr)
  const report = { kind: 'desktop-cli-carrier-probe', cliPath, resolvedExecutable: executable,
    exitCode: outcome.exitCode, preloadMarkerWritten: existsSync(marker),
    electronDisabledNodeEnvironment: stderr.includes('Node.js environment variables are disabled'),
    runtime: existsSync(marker) ? JSON.parse(readFileSync(marker, 'utf8')) : null,
    networkRequestRequired: false, credentialCopied: false }
  writeFileSync(reportFile, JSON.stringify(report, null, 2) + '\n')
}
