import { translateChinese, type OpenBknTranslate } from './messages.ts'
import type { OpenBknCliInstallVersion, OpenBknCliSetupView } from '../types.ts'

export interface CliSetupPort {
  checkCli(cliPath: string, signal?: AbortSignal): Promise<OpenBknCliSetupView>
  installCli(cliPath: string, targetVersion: OpenBknCliInstallVersion): Promise<OpenBknCliSetupView>
}
export interface CliSetupState {
  readonly phase: 'idle' | 'checking' | OpenBknCliSetupView['state']
  readonly result?: OpenBknCliSetupView
  readonly setupRequested?: boolean
}

/** Read-only checks are cancellable; an accepted Host installation survives panel closure. */
export class CliSetupController {
  private state: CliSetupState = { phase: 'idle' }
  private revision = 0
  private disposed = false
  private clicking = false
  private reading?: AbortController
  private timer?: ReturnType<typeof setTimeout>
  private readonly listeners = new Set<() => void>()
  constructor(private readonly port: CliSetupPort, private readonly resolved: (path: string) => void) {}
  snapshot(): CliSetupState { return this.state }
  subscribe(listener: () => void): () => void { this.listeners.add(listener); return () => { this.listeners.delete(listener) } }

  async check(cliPath: string): Promise<void> {
    if (this.disposed || this.clicking) return
    await this.inspect(cliPath)
  }
  async detectAndInstall(cliPath: string, targetVersion: OpenBknCliInstallVersion = '0.1.5'): Promise<void> {
    if (this.disposed || this.clicking) return
    this.clicking = true
    try {
      const checked = await this.inspect(cliPath)
      if (checked === undefined || !checked.result.canInstall || !this.current(checked.revision)) return
      this.publish({ phase: 'installing' })
      // Do not pass a panel AbortSignal: npm is owned and bounded by the Host.
      const result = await this.port.installCli(cliPath, targetVersion)
      if (this.current(checked.revision)) this.accept(result, cliPath, checked.revision)
    } catch {
      if (!this.disposed) this.publish({ phase: 'failed', result: { state: 'failed', canInstall: false, reason: 'host-unavailable' } })
    } finally {
      this.clicking = false
      if (!this.disposed) this.publish(this.state)
    }
  }
  dispose(): void {
    this.disposed = true
    this.revision++
    this.reading?.abort()
    clearTimeout(this.timer)
    this.listeners.clear()
  }
  private async inspect(cliPath: string): Promise<{ result: OpenBknCliSetupView; revision: number } | undefined> {
    this.reading?.abort()
    clearTimeout(this.timer)
    const revision = ++this.revision
    const controller = this.reading = new AbortController()
    // Polling a Host-owned install must keep its input lock until it settles.
    if (this.state.phase !== 'installing') this.publish({ phase: 'checking' })
    try {
      const result = await this.port.checkCli(cliPath, controller.signal)
      if (!this.current(revision)) return undefined
      this.accept(result, cliPath, revision)
      return { result, revision }
    } catch {
      if (this.current(revision)) this.publish({ phase: 'failed', result: { state: 'failed', canInstall: false, reason: 'host-unavailable' } })
      return undefined
    }
  }
  private accept(result: OpenBknCliSetupView, cliPath: string, revision: number): void {
    this.publish({ phase: result.state, result })
    if (result.state === 'ready' && result.resolvedPath !== undefined && result.resolvedPath !== cliPath) this.resolved(result.resolvedPath)
    if (result.state === 'installing') this.timer = setTimeout(() => {
      if (this.current(revision)) void this.check(cliPath)
    }, 1000)
  }
  private current(revision: number): boolean { return !this.disposed && this.revision === revision }
  private publish(state: CliSetupState): void {
    this.state = { ...state, setupRequested: this.clicking }
    for (const listener of this.listeners) listener()
  }
}

/** Only controlled reasons become user-facing text; raw installer output stays on Host. */
export function cliSetupMessage(state: CliSetupState, savedCliPath?: string, targetVersion?: OpenBknCliInstallVersion, t: OpenBknTranslate = translateChinese): string {
  const installVersion = state.result?.targetVersion ?? targetVersion ?? '0.1.5'
  if (state.phase === 'checking') return t('checkingCLI')
  if (state.phase === 'installing') return t('cliInstalling', { p0: installVersion })
  if (state.phase === 'ready') {
    const version = state.result?.version
    const mismatch = version !== undefined && targetVersion !== undefined && version !== targetVersion
      ? t('cliVersionMismatch', { p0: targetVersion }) : ''
    return t('cliReady', { p0: version ?? '', p1: mismatch, p2: state.result?.resolvedPath !== undefined && state.result.resolvedPath === savedCliPath ? '' : t('thePathHasBeenFilledInClickSave') })
  }
  if (state.phase === 'missing') return targetVersion === undefined
    ? t('cLIWasNotFoundInTheCurrentEnvironment')
    : t('cliMissingVersion', { p0: targetVersion })
  switch (state.result?.reason) {
    case 'custom-path-missing': return t('thisPathWasNotFoundCorrectItOr')
    case 'path-is-directory': return t('thisPathIsADirectoryEnterThePath')
    case 'execution-failed': return t('cLIWasFoundButThisDSHHostCannot')
    case 'existing-installation': return t('anSDKExistsInTheNpmDirectoryBut')
    case 'npm-missing': return t('thisDSHHostCannotFindNpmInstallNode')
    case 'node-unavailable': return t('thisDSHHostCannotUseASupportedNode')
    case 'prefix-unavailable': return t('theNpmInstallationDirectoryCouldNotBeDetermined')
    case 'permission-denied': return t('theNpmInstallationDirectoryIsNotWritableInstall')
    case 'network-failed': return t('cLIInstallationEncounteredANetworkErrorCheckThe')
    case 'tls-failed': return t('cLIInstallationEncounteredACertificateErrorCheckThe')
    case 'timeout': return t('theCLIOperationTimedOutCheckLocalInstallation')
    case 'verification-failed': return t('theInstallationCommandCompletedButCLIIsNot')
    case 'busy': return t('aBusinessTurnOrSettingsSaveIsStill')
    case 'unsupported-version': return t('selectASupportedCLIVersion015')
    case 'host-unavailable': return t('theCLISetupServiceIsUnavailableCheckThe')
    case 'installation-failed': return t('cLIInstallationFailedCheckTheLocalNpmEnvironment')
    default: return ''
  }
}
