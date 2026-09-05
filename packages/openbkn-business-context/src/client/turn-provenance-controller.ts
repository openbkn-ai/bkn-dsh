import type { HostObservable } from '@deepseek-ai/dsh-client-ui-slots'
import type { ProvenanceHandle } from '../types.ts'

/** Browser-local cache of the Host-committed provenance for finalized assistant messages. */
export class TurnProvenanceController implements HostObservable<ReadonlyMap<string, ProvenanceHandle>> {
  private view: ReadonlyMap<string, ProvenanceHandle> = new Map()
  private readonly listeners = new Set<() => void>()

  constructor(private readonly read: (messageId: string) => Promise<ProvenanceHandle | undefined>) {}

  getSnapshot = (): ReadonlyMap<string, ProvenanceHandle> => this.view

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  /** Read once per mounted message; a transient failure never erases a committed handle. */
  async load(messageId: string): Promise<void> {
    try {
      const handle = await this.read(messageId)
      if (handle === undefined || this.view.get(messageId) === handle) return
      const next = new Map(this.view)
      next.set(messageId, handle)
      this.view = next
      for (const listener of this.listeners) listener()
    } catch {
      // The action remains absent. A remount/reconnect can retry without exposing an error in chat.
    }
  }
}
