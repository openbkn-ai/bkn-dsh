import { translateChinese, type OpenBknTranslate } from './messages.ts'
import type { DiagnosticsTarget } from '../diagnostics-contract.ts'

function hostLabels(t: OpenBknTranslate): Record<DiagnosticsTarget['hostForm'], string> { return {
  desktop: t('desktop'),
  npm: t('npmBrowserApp'),
  source: t('sourceBuild'),
  unknown: t('unknownTheCurrentReportCannotIdentifyTheHost'),
} }

const PLATFORM_LABELS: Readonly<Record<string, string>> = {
  win32: 'Windows',
  darwin: 'macOS',
  linux: 'Linux',
}

/** Presentation only: keep raw report facts and missing values unchanged. */
export function diagnosticsTargetRows(target: DiagnosticsTarget, t: OpenBknTranslate = translateChinese): readonly { label: string; value: string }[] {
  const HOST_LABELS = hostLabels(t)
  return [
    { label: t('hostForm'), value: HOST_LABELS[target.hostForm] ?? HOST_LABELS.unknown },
    { label: t('operatingSystem'), value: target.platform === null ? t('notCollected') : PLATFORM_LABELS[target.platform] ?? target.platform },
    { label: t('dSHVersion'), value: target.dshVersion ?? t('notCollectedNoVersionInformationInThisReport') },
    { label: t('pluginOnDisk'), value: target.pluginDiskVersion ?? t('notCollectedInstallationInformationUnavailable') },
    { label: t('pluginLoaded'), value: target.pluginLoadedVersion ?? t('notCollectedRunningVersionCannotBeConfirmed') },
  ]
}
