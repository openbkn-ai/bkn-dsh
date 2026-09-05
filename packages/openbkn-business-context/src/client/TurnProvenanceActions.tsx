import { useEffect } from 'react'
import type { HostObservable, InjectFace, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { ProvenanceHandle } from '../types.ts'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'

export interface TurnProvenanceActionsInjected {
  hooks: { provenance: HostObservable<ReadonlyMap<string, ProvenanceHandle>> }
  load(messageId: string): Promise<void>
  open(messageId: string, handle: ProvenanceHandle, restoreFocus: HTMLElement): void
}

export type TurnProvenanceActionsProps = PropsRuntime<'conversation.chat.assistant-actions'> & InjectFace<TurnProvenanceActionsInjected>

/** One compact, native action-row entry for a finalized message with real OpenBKN provenance. */
export function TurnProvenanceActions({ messageId, useProvenance, load, open }: TurnProvenanceActionsProps) {
  const handle = useProvenance((items: ReadonlyMap<string, ProvenanceHandle>) => items.get(messageId))
  useEffect(() => { void load(messageId) }, [load, messageId])
  if (handle === undefined) return null

  return (
    <button
      type="button"
      title="View OpenBKN provenance for this answer"
      onClick={event => open(messageId, handle, event.currentTarget)}
      style={{ border: '1px solid #bfe6df', borderRadius: 7, background: '#f0faf8', color: '#087d72', padding: '4px 8px', fontSize: 12, fontWeight: 650, cursor: 'pointer' }}
    >
      查看业务溯源
    </button>
  )
}
