import { en, zh, type OpenBknMessageKey } from './locales.ts'
export type OpenBknTranslate = (key: OpenBknMessageKey, params?: Record<string, unknown>) => string
export interface MessageDescriptor { readonly key: OpenBknMessageKey; readonly params?: Readonly<Record<string, unknown>> }
/** State stores a stable key and safe parameters, never a language-specific rendered error. */
export type UiMessage = MessageDescriptor | readonly UiMessage[] | string
export function uiMessage(key: OpenBknMessageKey, params?: Record<string, unknown>): MessageDescriptor { return { key, ...(params === undefined ? {} : { params }) } }
export function joinUiMessages(...messages: UiMessage[]): UiMessage { return messages }
export function translateMessage(locale: string, key: OpenBknMessageKey, params?: Record<string, unknown>): string {
  const dictionary = locale === 'zh' ? zh : en
  const template = Object.hasOwn(dictionary, key) ? dictionary[key] : (locale === 'zh' ? '文案暂不可用' : 'Text unavailable')
  return template.replace(/\{(\w+)\}/g, (match, name: string) => params !== undefined && Object.hasOwn(params, name) ? String(params[name]) : match)
}
export const translateChinese: OpenBknTranslate = (key, params) => translateMessage('zh', key, params)
export function renderUiMessage(message: UiMessage | undefined, t: OpenBknTranslate = translateChinese): string {
  if (message === undefined) return ''
  if (typeof message === 'string') return message
  if (Array.isArray(message)) return message.map(part => renderUiMessage(part, t)).join('')
  const descriptor = message as MessageDescriptor
  const params = descriptor.params === undefined ? undefined : Object.fromEntries(Object.entries(descriptor.params).map(([name, value]) => [name,
    typeof value === 'object' && value !== null && ('key' in value || Array.isArray(value)) ? renderUiMessage(value as UiMessage, t) : value,
  ]))
  return t(descriptor.key, params)
}
