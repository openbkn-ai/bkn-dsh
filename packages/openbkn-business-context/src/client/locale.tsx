import { createContext, createElement, useContext, useMemo, useSyncExternalStore, type FunctionComponent } from 'react'
import type { LocaleRuntime } from '@deepseek-ai/dsh-client-locale/client'
import { translateChinese, translateMessage, type OpenBknTranslate } from './messages.ts'
import { zh, type OpenBknMessageKey } from './locales.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' { interface LocaleNamespaceMap { openbkn: OpenBknMessageKey } }
const TranslationContext = createContext<OpenBknTranslate>(translateChinese)
export function useOpenBknTranslation(): OpenBknTranslate { return useContext(TranslationContext) }

/** One provider per owned slot; locale revisions rerender without replacing controllers or requests. */
export function localized<P extends object>(Component: FunctionComponent<P>, locale: LocaleRuntime): FunctionComponent<P> {
  return function LocalizedSlot(props: P) {
    const snapshot = useSyncExternalStore(listener => locale.subscribe(listener), () => locale.getSnapshot())
    const translate = useMemo<OpenBknTranslate>(() => {
      const bound = locale.bind('openbkn')
      return (key, params) => Object.hasOwn(zh, key) ? bound(key, params) : translateMessage(snapshot.active, key, params)
    }, [snapshot.revision])
    return createElement(TranslationContext.Provider, { value: translate }, createElement(Component, props))
  }
}
