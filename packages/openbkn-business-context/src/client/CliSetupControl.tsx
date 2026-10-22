import { useOpenBknTranslation } from './locale.tsx'

import { useEffect, useMemo, useRef, useState } from 'react'
import { CliSetupController, cliSetupMessage, type CliSetupPort, type CliSetupState } from './cli-setup-controller.ts'
import type { OpenBknCliInstallVersion } from '../types.ts'

export function CliSetupControl({ cliPath, savedCliPath, disabled, port, onResolved, onBusy }: {
  cliPath: string
  savedCliPath: string
  disabled: boolean
  port: CliSetupPort
  onResolved(path: string): void
  onBusy(busy: boolean, lockPath: boolean): void
}) {
  const t = useOpenBknTranslation()

  const current = useRef({ port, onResolved, onBusy })
  current.current = { port, onResolved, onBusy }
  const controller = useMemo(() => new CliSetupController({
    checkCli: (value, signal) => current.current.port.checkCli(value, signal),
    installCli: (value, targetVersion) => current.current.port.installCli(value, targetVersion),
  }, value => current.current.onResolved(value)), [])
  const [state, setState] = useState<CliSetupState>(controller.snapshot())
  const [targetVersion, setTargetVersion] = useState<OpenBknCliInstallVersion>()
  useEffect(() => {
    const disconnect = controller.subscribe(() => setState(controller.snapshot()))
    return () => { disconnect(); controller.dispose(); current.current.onBusy(false, false) }
  }, [controller])
  useEffect(() => { if (!disabled) void controller.check(cliPath) }, [controller, cliPath, disabled])
  const lockPath = state.phase === 'installing' || state.setupRequested === true
  const busy = state.phase === 'checking' || lockPath
  // A read-only check must not disable the path field and steal typing focus.
  useEffect(() => { current.current.onBusy(busy, lockPath) }, [busy, lockPath])
  return <div>
    <label style={{ fontSize: 13 }}>{t('cLIInstallationVersion')}<select aria-label={t('cLIInstallationVersionText1')} disabled={disabled || lockPath} value={state.result?.targetVersion ?? targetVersion ?? ''} onChange={event => setTargetVersion(event.target.value as OpenBknCliInstallVersion)}>
      <option value="" disabled>{t('selectAVersion')}</option>
      <option value="0.1.5">0.1.5</option><option value="0.2.0">0.2.0</option>
    </select></label>
    <p role="status" aria-live="polite" style={{ margin: '10px 0', fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>{cliSetupMessage(state, savedCliPath, targetVersion, t)}</p>
    {state.phase !== 'ready' ? <>
      <button type="button" disabled={disabled || busy || targetVersion === undefined} onClick={() => { if (targetVersion !== undefined) void controller.detectAndInstall(cliPath, targetVersion) }} style={{ border: '1px solid #cbd5e1', borderRadius: 8, padding: '8px 12px', background: '#fff', color: '#172033', cursor: 'pointer' }}>
        {state.phase === 'checking' ? t('checking') : state.phase === 'installing' ? t('installing') : t('detectAndInstallCLI')}
      </button>
      <p style={{ margin: '8px 0 0', fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>{t('chooseTheVersionMatchingYourPlatformUseAn')}</p>
    </> : null}
  </div>
}
