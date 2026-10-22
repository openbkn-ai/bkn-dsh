import { useOpenBknTranslation } from './locale.tsx'
import { type OpenBknTranslate } from './messages.ts'
import { useEffect } from 'react'
import type { HostObservable, InjectFace, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'

export interface SuggestionDockInjected {
  hooks: { suggestions: HostObservable<readonly string[]> }
  load(): Promise<void>
  setDraft(prompt: string): void
}

export type SuggestionDockProps = PropsRuntime<'conversation.input.dock'> & InjectFace<SuggestionDockInjected>

/** One bound-network empty-session entry; clicking only fills DSH's native draft. */
export function SuggestionDock({ useSuggestions, load, setDraft }: SuggestionDockProps) {
  const t = useOpenBknTranslation()

  const prompts = useSuggestions((value: readonly string[]) => value)
  useEffect(() => { void load() }, [load])
  if (prompts.length === 0) return null

  return <div aria-label={t('sessionEntryLabel')} style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '0 0 10px' }}>
    {prompts.map((original: string) => { const prompt = sessionSuggestionText(original, t); return <button key={prompt} type="button" onClick={() => setDraft(prompt)} style={buttonStyle}>{prompt}</button> })}
  </div>
}

const buttonStyle = {
  border: '1px solid #d8e8e5', borderRadius: 999, background: '#f4fbf9', color: '#087d72',
  padding: '6px 10px', fontSize: 12, lineHeight: 1.35, cursor: 'pointer', textAlign: 'left' as const,
}

/** The Host emits only this plugin-owned draft template; unknown future prompt text remains verbatim. */
export function sessionSuggestionText(prompt: string, t: OpenBknTranslate): string {
  const match = /^了解「(.+)」知识网络。$/u.exec(prompt)
  return match === null ? prompt : t('sessionSuggestion', { networkName: match[1] })
}
