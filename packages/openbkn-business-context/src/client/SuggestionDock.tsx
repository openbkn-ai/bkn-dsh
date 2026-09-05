import { useEffect } from 'react'
import type { HostObservable, InjectFace, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'

export interface SuggestionDockInjected {
  hooks: { suggestions: HostObservable<readonly string[]> }
  load(): Promise<void>
  setDraft(prompt: string): void
}

export type SuggestionDockProps = PropsRuntime<'conversation.input.dock'> & InjectFace<SuggestionDockInjected>

/** Bound-network prompt shortcuts; clicking fills DSH's native draft and never sends automatically. */
export function SuggestionDock({ useSuggestions, load, setDraft }: SuggestionDockProps) {
  const prompts = useSuggestions((value: readonly string[]) => value)
  useEffect(() => { void load() }, [load])
  if (prompts.length === 0) return null

  return <div aria-label="OpenBKN suggested prompts" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '0 0 10px' }}>
    {prompts.map((prompt: string) => <button key={prompt} type="button" onClick={() => setDraft(prompt)} style={buttonStyle}>{prompt}</button>)}
  </div>
}

const buttonStyle = {
  border: '1px solid #d8e8e5', borderRadius: 999, background: '#f4fbf9', color: '#087d72',
  padding: '6px 10px', fontSize: 12, lineHeight: 1.35, cursor: 'pointer', textAlign: 'left' as const,
}
