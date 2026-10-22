import type { OpenBknTranslate } from './messages.ts'
import type { OpenBknMessageKey } from './locales.ts'
// Translate only this plugin's closed next-action catalogue. Raw report JSON is unchanged.
const actionKeys: Readonly<Record<string, OpenBknMessageKey>> = {
  "The OpenBKN entry is not registered in this profile; reinstall the plugin or review the profile patch.": "diagnosticEntryMissing",
  "Export this report and send it to support; the OpenBKN panel cannot start until the listed stage is fixed.": "diagnosticExportBlocked",
  "Open OpenBKN settings, save the platform URL, then sign in with the OpenBKN CLI.": "diagnosticConfigure",
  "The package-root bootstrap row is missing from this profile; reinstall the plugin.": "diagnosticBootstrapMissing",
  "The package root itself failed to load; reinstall the plugin and export a fresh report.": "diagnosticBootstrapFailed",
  "Export this report and send it to support; the failing stage is listed above.": "diagnosticExportFailure"
}
export function diagnosticAction(text: string, t: OpenBknTranslate): string {
  return Object.hasOwn(actionKeys, text) ? t(actionKeys[text]!) : text
}
