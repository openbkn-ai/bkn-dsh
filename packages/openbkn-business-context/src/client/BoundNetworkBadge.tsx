import { useOpenBknTranslation } from './locale.tsx'

import { useEffect } from 'react'
import type { InjectFace, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { BusinessNetworkBinding } from '../types.ts'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'

export interface BoundNetworkBadgeInjected {
  hooks: { binding: BoundNetworkController }
  load(): Promise<void>
}

export type BoundNetworkBadgeProps = PropsRuntime<'conversation.session.header.actions'> & InjectFace<BoundNetworkBadgeInjected>

/** Read-only session-header label; changing networks requires a new DSH session. */
export function BoundNetworkBadge({ useBinding, load }: BoundNetworkBadgeProps) {
  const t = useOpenBknTranslation()

  const state = useBinding((value: BoundNetworkBadgeState) => value)
  useEffect(() => { void load() }, [load])
  if (state.kind !== 'bound') return null
  return (
    <span title={t('bindingHint')} style={{
      display: 'inline-flex', alignItems: 'center', gap: 6, maxWidth: 260, overflow: 'hidden',
      border: '1px solid #bfe6df', borderRadius: 9, background: '#effaf7', color: '#087d72', padding: '6px 9px', fontSize: 13, fontWeight: 650,
    }}>
      <span aria-hidden="true" style={{ width: 18, height: 18, display: 'grid', placeItems: 'center', borderRadius: 5, background: '#079b8f', color: '#fff', fontSize: 11 }}>B</span>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{state.binding.displayName}</span>
    </span>
  )
}

export type BoundNetworkBadgeState =
  | { readonly kind: 'idle' }
  | { readonly kind: 'bound'; readonly binding: BusinessNetworkBinding }
  | { readonly kind: 'absent' }

/** One Session's safe binding read, expressed in DSH's HostObservable currency. */
export class BoundNetworkController {
  private state: BoundNetworkBadgeState = { kind: 'idle' }
  private readonly listeners = new Set<() => void>()
  private retries = 0

  constructor(
    private readonly read: () => Promise<BusinessNetworkBinding | undefined>,
    /** Retry delay for "agent not live yet" reads; injectable for deterministic tests. */
    private readonly retryDelayMs: number = 2_000,
    private readonly maxRetries: number = 5,
  ) {}

  getSnapshot(): BoundNetworkBadgeState { return this.state }
  subscribe(listener: () => void): () => void { this.listeners.add(listener); return () => this.listeners.delete(listener) }

  async load(): Promise<void> {
    try {
      const binding = await this.read()
      this.retries = 0
      this.publish(binding === undefined ? { kind: 'absent' } : { kind: 'bound', binding })
    } catch (error: unknown) {
      // A just-reopened stored session may not have a live agent yet; the
      // host rejects the binding read until the session activates. Retry a
      // bounded number of times before settling on "absent".
      if (this.retries < this.maxRetries && sessionNotLiveMessage(error)) {
        this.retries += 1
        setTimeout(() => { void this.load() }, this.retryDelayMs)
        return
      }
      this.publish({ kind: 'absent' })
    }
  }

  private publish(state: BoundNetworkBadgeState): void {
    this.state = state
    for (const listener of this.listeners) listener()
  }
}

function sessionNotLiveMessage(error: unknown): boolean {
  const message = error instanceof Error ? error.message : typeof error === 'object' && error !== null
    ? String((error as { message?: unknown }).message ?? error)
    : String(error)
  return message.includes('not a live DSH session')
}
