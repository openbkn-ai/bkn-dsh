import type { HostObservable } from '@deepseek-ai/dsh-client-ui-slots'

/** Per-session, browser-local cache of Host-resolved draft suggestions. */
export class SuggestionDockController implements HostObservable<readonly string[]> {
  private prompts: readonly string[] = []
  private readonly listeners = new Set<() => void>()

  constructor(private readonly read: () => Promise<readonly string[]>) {}

  getSnapshot = (): readonly string[] => this.prompts
  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  async load(): Promise<void> {
    try {
      const prompts = await this.read()
      if (same(this.prompts, prompts)) return
      this.prompts = [...prompts]
      for (const listener of this.listeners) listener()
    } catch {
      // Keep the last safe set. The native composer remains fully usable.
    }
  }
}

function same(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index])
}
