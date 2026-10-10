import { useEffect, useMemo, useRef, useState } from 'react'
import { CliSetupController, cliSetupMessage, type CliSetupPort, type CliSetupState } from './cli-setup-controller.ts'

export function CliSetupControl({ cliPath, savedCliPath, disabled, port, onResolved, onBusy }: {
  cliPath: string
  savedCliPath: string
  disabled: boolean
  port: CliSetupPort
  onResolved(path: string): void
  onBusy(busy: boolean, lockPath: boolean): void
}) {
  const current = useRef({ port, onResolved, onBusy })
  current.current = { port, onResolved, onBusy }
  const controller = useMemo(() => new CliSetupController({
    checkCli: (value, signal) => current.current.port.checkCli(value, signal),
    installCli: value => current.current.port.installCli(value),
  }, value => current.current.onResolved(value)), [])
  const [state, setState] = useState<CliSetupState>(controller.snapshot())
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
    <p role="status" aria-live="polite" style={{ margin: '10px 0', fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>{cliSetupMessage(state, savedCliPath)}</p>
    {state.phase !== 'ready' ? <>
      <button type="button" disabled={disabled || busy} onClick={() => void controller.detectAndInstall(cliPath)} style={{ border: '1px solid #cbd5e1', borderRadius: 8, padding: '8px 12px', background: '#fff', color: '#172033', cursor: 'pointer' }}>
        {state.phase === 'checking' ? '检测中…' : state.phase === 'installing' ? '安装中…' : '检测并安装 CLI'}
      </button>
      <p style={{ margin: '8px 0 0', fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>优先使用已有 CLI；未检测到时，通过本机 npm 安装 OpenBKN CLI 0.1.5（适用于 0.1.5 平台）。使用 npm 当前安装源和全局目录。</p>
    </> : null}
  </div>
}
