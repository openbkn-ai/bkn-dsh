import { execFile } from 'node:child_process'
import { parseArgs, promisify } from 'node:util'

const execute = promisify(execFile)

export function parseProbeOptions(args) {
  const { values } = parseArgs({
    args,
    strict: true,
    allowPositionals: false,
    options: Object.fromEntries(['live', 'kn', 'other-kn', 'plugin', 'cli', 'runtime', 'contract', 'capture'].map(name => [name, { type: 'string' }])),
  })
  for (const value of Object.values(values)) {
    if (!value.trim() || value.startsWith('--')) throw new Error('Probe options need non-empty values.')
  }
  if (values.live !== undefined) {
    if (values.capture !== undefined || values.contract !== undefined) throw new Error('Live contract and capture state must come from the platform.')
    const url = new URL(values.live)
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
      throw new Error('--live needs an HTTP(S) platform address without credentials, query or fragment.')
    }
    if (!values.kn || !values['other-kn'] || values.kn === values['other-kn']) {
      throw new Error('--live needs --kn and --other-kn naming two different networks.')
    }
  } else if (values.kn !== undefined || values['other-kn'] !== undefined) {
    throw new Error('Network options require --live <platform URL>.')
  }
  if (values.contract !== undefined && !['legacy', 'formal'].includes(values.contract)) throw new Error('Unknown stand-in contract.')
  if (values.capture !== undefined && !['enabled', 'disabled'].includes(values.capture)) throw new Error('Unknown stand-in capture state.')
  if (values.capture === 'disabled' && values.contract !== 'formal') throw new Error('Disabled capture probe requires the formal contract.')
  return {
    live: values.live,
    plugin: values.plugin ?? '.',
    cli: values.cli ?? 'openbkn',
    boundKn: values.kn ?? 'kn-bound',
    otherKn: values['other-kn'] ?? 'kn-other',
    ...(values.runtime === undefined ? {} : { runtime: values.runtime }),
    ...(values.contract === undefined ? {} : { contract: values.contract }),
    ...(values.capture === undefined ? {} : { capture: values.capture }),
  }
}

function quoteCmd(value) {
  // This manual probe only sends fixed CLI verbs and platform-issued IDs.
  // Refuse cmd expansion syntax instead of interpreting it in a path/argument.
  if (/["\r\n%!]/.test(value)) throw new Error('Unsupported Windows CLI path or argument.')
  return `"${value}"`
}

export async function runProbeCli(cli, args, options = {}) {
  try {
    if (process.platform === 'win32') {
      // cmd resolves PATHEXT shims. /s consumes the outer pair of quotes;
      // the inner quotes preserve spaces and shell separators in paths.
      const command = `"${[cli, ...args].map(quoteCmd).join(' ')}"`
      return await execute(process.env.ComSpec ?? 'cmd.exe', ['/d', '/s', '/c', command], {
        ...options, windowsVerbatimArguments: true, windowsHide: true, shell: false,
      })
    }
    return await execute(cli, args, { ...options, shell: false })
  } catch {
    // ChildProcess errors carry stdout/stderr: auth token may contain a token.
    // Never attach that error as a cause or print it from this probe.
    throw new Error('OpenBKN CLI invocation failed. Check the CLI path and login status without logging token output.')
  }
}
