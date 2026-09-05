import type { SessionId } from '@deepseek-ai/dsh-api-remotes/client'
import type { InjectFace, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'

export interface OpenBknEntryInjected {
  open(sessionId?: SessionId): void
}

export type OpenBknEntryProps = PropsRuntime<'sidebar.footer.action'> & InjectFace<OpenBknEntryInjected>

/** Additive sidebar-footer entry; the native DSH sidebar continues to own its shell. */
export function OpenBknEntry({ wide, useSessions, open }: OpenBknEntryProps) {
  const sessionId = useSessions((state: { readonly current?: SessionId }) => state.current)
  return (
    <button
      type="button"
      aria-label="OpenBKN business knowledge networks"
      onClick={() => open(sessionId)}
      style={{
        width: wide ? '100%' : 36,
        minHeight: 36,
        border: '1px solid #bfe6df',
        borderRadius: 10,
        background: '#effaf7',
        color: '#087d72',
        fontWeight: 650,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: wide ? 'flex-start' : 'center',
        gap: 8,
        padding: wide ? '0 10px' : 0,
      }}
    >
      <span aria-hidden="true" style={{ width: 20, height: 20, display: 'grid', placeItems: 'center', borderRadius: 6, background: '#079b8f', color: '#fff', fontSize: 12 }}>B</span>
      {wide ? <span>OpenBKN</span> : null}
    </button>
  )
}
