/** Explicit, bounded CLI setup. Authentication continues to use its existing adapter. */
import { access, stat } from 'node:fs/promises'
import { homedir } from 'node:os'
import path from 'node:path'
import type { CliSubprocess } from './openbkn-cli-subprocess.js'
import type { OpenBknCliSetupView } from './types.js'

export const CLI_INSTALL_VERSION = '0.1.5'
const OUTPUT_LIMIT = 16 * 1024
const INSPECT_MS = 5_000
const INSTALL_MS = 180_000

interface SetupEnvironment {
  readonly platform: NodeJS.Platform
  readonly home: string
  readonly env: Readonly<Record<string, string | undefined>>
  readonly exists: (file: string) => Promise<boolean>
  readonly isDirectory: (file: string) => Promise<boolean>
}
interface CommandResult { readonly code: number | null; readonly stdout: string; readonly stderr: string; readonly lossy: boolean }
interface Inspection { readonly view: OpenBknCliSetupView; readonly npm?: string; readonly prefix?: string }

/** One Host-owned installation at a time; closing a browser panel cannot kill npm halfway. */
export class OpenBknCliSetup {
  private installation?: Promise<OpenBknCliSetupView>
  private readonly lifetime = new AbortController()
  constructor(private readonly subprocess: CliSubprocess, private readonly cwd: string,
    private readonly environment: SetupEnvironment = {
      platform: process.platform, home: homedir(), env: process.env,
      exists: async file => { try { await access(file); return true } catch (error) {
        if (['ENOENT', 'ENOTDIR'].includes((error as NodeJS.ErrnoException).code ?? '')) return false
        throw error
      } },
      isDirectory: async file => { try { return (await stat(file)).isDirectory() } catch (error) {
        if (['ENOENT', 'ENOTDIR'].includes((error as NodeJS.ErrnoException).code ?? '')) return false
        throw error
      } },
    }) {}

  dispose(): void { this.lifetime.abort() }
  get isInstalling(): boolean { return this.installation !== undefined }

  async check(cliPath: string, signal?: AbortSignal): Promise<OpenBknCliSetupView> {
    if (this.installation !== undefined) return { state: 'installing', canInstall: false }
    return (await this.inspect(cliPath, signal)).view
  }

  /** Called only from the explicit product button, never during initial detection. */
  install(cliPath: string): Promise<OpenBknCliSetupView> {
    if (this.installation !== undefined) return this.installation
    const operation = this.performInstall(cliPath)
    this.installation = operation
    void operation.finally(() => { if (this.installation === operation) this.installation = undefined })
    return operation
  }

  private async performInstall(cliPath: string): Promise<OpenBknCliSetupView> {
    try {
      // Recheck on the Host: a stale/malicious Client cannot overwrite an existing CLI.
      const inspected = await this.inspect(cliPath, this.lifetime.signal)
      if (!inspected.view.canInstall || inspected.npm === undefined || inspected.prefix === undefined) return inspected.view
      const result = await this.run(inspected.npm, ['install', '--global', `@openbkn/bkn-sdk@${CLI_INSTALL_VERSION}`,
        '--prefix', inspected.prefix, '--ignore-scripts', '--no-audit', '--no-fund', '--loglevel=error'], INSTALL_MS, this.lifetime.signal)
      if (result.code !== 0) return { state: 'failed', canInstall: false, reason: installationFailure(result.stderr) }
      const candidate = this.binaryAt(inspected.prefix)
      const verified = await this.verify(candidate, this.lifetime.signal)
      return verified?.state === 'ready' && verified.version === CLI_INSTALL_VERSION
        ? verified : { state: 'failed', canInstall: false, reason: 'verification-failed' }
    } catch (error) {
      return { state: 'failed', canInstall: false, reason: isTimeout(error) ? 'timeout' : 'installation-failed' }
    }
  }

  private async inspect(command: string, signal?: AbortSignal): Promise<Inspection> {
    const cliPath = typeof command === 'string' ? command.trim() : ''
    if (!cliPath || cliPath.length > 4096 || /[\r\n\0]/u.test(cliPath)) return { view: blocked('custom-path-missing') }
    const signalWithLimit = AbortSignal.any([this.lifetime.signal, AbortSignal.timeout(25_000), ...(signal ? [signal] : [])])
    try {
      const direct = await this.verify(cliPath, signalWithLimit)
      if (direct !== undefined) return { view: direct }
      const defaultCommand = cliPath === 'openbkn'
        || (this.environment.platform === 'win32' && cliPath.toLowerCase() === 'openbkn.cmd')
      if (!defaultCommand) return { view: blocked('custom-path-missing') }

      for (const candidate of this.standardCandidates()) {
        const found = await this.verify(candidate, signalWithLimit)
        if (found !== undefined) return { view: found }
      }
      let npm: string
      try { npm = await this.subprocess.resolveExecutable('npm', undefined, signalWithLimit) }
      catch { return { view: blocked('npm-missing') } }
      const prefixResult = await this.run(npm, ['prefix', '--global'], INSPECT_MS, signalWithLimit)
      const prefix = prefixResult.stdout.trim()
      const paths = this.paths()
      if (prefixResult.code !== 0 || prefixResult.lossy || !paths.isAbsolute(prefix) || /[\r\n\0]/u.test(prefix)) {
        return { view: blocked('prefix-unavailable') }
      }
      const found = await this.verify(this.binaryAt(prefix), signalWithLimit)
      if (found !== undefined) return { view: found }
      const packageFile = this.environment.platform === 'win32'
        ? paths.join(prefix, 'node_modules', '@openbkn', 'bkn-sdk', 'package.json')
        : paths.join(prefix, 'lib', 'node_modules', '@openbkn', 'bkn-sdk', 'package.json')
      if (await this.environment.exists(packageFile)) return { view: blocked('existing-installation') }
      let node: string
      try { node = await this.subprocess.resolveExecutable('node', undefined, signalWithLimit) }
      catch { return { view: blocked('node-unavailable') } }
      const nodeResult = await this.run(node, ['--version'], INSPECT_MS, signalWithLimit)
      const match = /^v(\d+)\.(\d+)\.(\d+)$/u.exec(nodeResult.stdout.trim())
      if (nodeResult.code !== 0 || nodeResult.lossy || match === null
        || !(Number(match[1]) >= 24 || (Number(match[1]) === 22 && Number(match[2]) >= 19))) {
        return { view: blocked('node-unavailable') }
      }
      return { view: { state: 'missing', canInstall: true }, npm, prefix }
    } catch (error) {
      signal?.throwIfAborted()
      return { view: blocked(isTimeout(error) ? 'timeout' : 'execution-failed') }
    }
  }

  private async verify(command: string, signal: AbortSignal): Promise<OpenBknCliSetupView | undefined> {
    if (this.paths().isAbsolute(command) && await this.environment.isDirectory(command)) return blocked('path-is-directory')
    let executable: string
    try { executable = await this.subprocess.resolveExecutable(command, undefined, signal) }
    catch {
      signal.throwIfAborted()
      // A file in a known location that cannot execute must not be silently overwritten.
      if (this.paths().isAbsolute(command) && await this.environment.exists(command)) return blocked('execution-failed')
      return undefined
    }
    try {
      const result = await this.run(executable, ['--version'], INSPECT_MS, signal)
      const version = result.stdout.trim()
      if (result.code === 0 && !result.lossy && /^\d+\.\d+\.\d+(?:-[\da-z.-]+)?$/iu.test(version)) {
        return { state: 'ready', canInstall: false, resolvedPath: executable, version }
      }
      return blocked('execution-failed')
    } catch (error) {
      signal.throwIfAborted()
      return blocked(isTimeout(error) ? 'timeout' : 'execution-failed')
    }
  }

  private paths(): typeof path.posix { return this.environment.platform === 'win32' ? path.win32 : path.posix }
  private binaryAt(prefix: string): string {
    return this.environment.platform === 'win32' ? this.paths().join(prefix, 'openbkn.cmd') : this.paths().join(prefix, 'bin', 'openbkn')
  }
  private standardCandidates(): string[] {
    const { platform, home, env } = this.environment
    const paths = this.paths()
    const directories = platform === 'win32'
      ? [env.APPDATA ? paths.join(env.APPDATA, 'npm') : undefined]
      : ['/usr/local/bin', '/opt/homebrew/bin', paths.join(home, '.local', 'bin')]
    directories.push(env.PNPM_HOME)
    return [...new Set(directories.filter((dir): dir is string => dir !== undefined && paths.isAbsolute(dir)))]
      .map(dir => paths.join(dir, platform === 'win32' ? 'openbkn.cmd' : 'openbkn'))
  }
  private async run(executable: string, args: readonly string[], timeout: number, signal: AbortSignal): Promise<CommandResult> {
    const bounded = AbortSignal.any([signal, AbortSignal.timeout(timeout)])
    bounded.throwIfAborted()
    const child = this.subprocess.spawn({ argv: [executable, ...args], cwd: this.cwd,
      stdio: { stdin: { data: '' }, stdout: { maxBytes: OUTPUT_LIMIT }, stderr: { maxBytes: OUTPUT_LIMIT } },
      graceMs: 3_000, signal: bounded })
    const result = await child.done
    bounded.throwIfAborted()
    const stdout = child.collected.stdout?.readFrom(0)
    const stderr = child.collected.stderr?.readFrom(0)
    return { code: result.exitCode, stdout: stdout?.text ?? '', stderr: stderr?.text ?? '', lossy: stdout?.lossy === true || stderr?.lossy === true }
  }
}

function blocked(reason: OpenBknCliSetupView['reason']): OpenBknCliSetupView { return { state: 'blocked', canInstall: false, reason } }
function isTimeout(error: unknown): boolean { return error instanceof Error && error.name === 'TimeoutError' }
function installationFailure(stderr: string): OpenBknCliSetupView['reason'] {
  // Project known npm error codes only. Raw output may contain private registry credentials.
  if (/\b(?:EACCES|EPERM)\b/u.test(stderr)) return 'permission-denied'
  if (/\b(?:CERT_HAS_EXPIRED|SELF_SIGNED_CERT_IN_CHAIN|DEPTH_ZERO_SELF_SIGNED_CERT|UNABLE_TO_VERIFY_LEAF_SIGNATURE)\b/u.test(stderr)) return 'tls-failed'
  if (/\b(?:ENOTFOUND|EAI_AGAIN|ECONNREFUSED|ECONNRESET|ETIMEDOUT)\b/u.test(stderr)) return 'network-failed'
  return 'installation-failed'
}
