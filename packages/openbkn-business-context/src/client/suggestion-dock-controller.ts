import type { HostObservable } from '@deepseek-ai/dsh-client-ui-slots'

/** Per-session, browser-local cache of the Host-resolved empty-session entry. */
export class SuggestionDockController implements HostObservable<readonly string[]> {
  private prompts: readonly string[] = []
  private readonly listeners = new Set<() => void>()
  private revision = 0

  constructor(private readonly read: () => Promise<readonly string[]>) {}

  getSnapshot = (): readonly string[] => this.prompts
  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  async load(): Promise<void> {
    await this.refresh()
  }

  /** Hide the entry as soon as the native DSH turn starts. */
  beginTurn(): void {
    this.revision += 1
    this.publish([])
  }

  /** Reload after a session binding is established. */
  async refresh(): Promise<void> {
    const revision = ++this.revision
    try {
      const prompts = await this.read()
      if (revision !== this.revision) return
      this.publish(prompts)
    } catch {
      // Keep the last safe set. The native composer remains fully usable.
    }
  }

  private publish(prompts: readonly string[]): void {
    if (same(this.prompts, prompts)) return
    this.prompts = [...prompts]
    for (const listener of this.listeners) listener()
  }
}

function same(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index])
}

/** The entry is relevant only before the first native DSH turn. */
export function synchronizeSuggestionDockForEvents(
  controller: Pick<SuggestionDockController, 'beginTurn' | 'refresh'>,
  events: readonly { readonly type: string }[],
): void {
  for (const event of events) {
    if (event.type === 'turn/start') controller.beginTurn()
  }
}
