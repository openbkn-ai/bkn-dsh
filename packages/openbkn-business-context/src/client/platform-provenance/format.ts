import i18n from './i18n.js'
export function formatDateTime(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString(i18n.language, {hour12:false})
}
