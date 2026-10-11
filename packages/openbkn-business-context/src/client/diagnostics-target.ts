import type { DiagnosticsTarget } from '../diagnostics-contract.ts'

const HOST_LABELS: Record<DiagnosticsTarget['hostForm'], string> = {
  desktop: '桌面版',
  npm: 'npm 浏览器版',
  source: '源码构建',
  unknown: '未识别（宿主未提供形态标识）',
}

const PLATFORM_LABELS: Readonly<Record<string, string>> = {
  win32: 'Windows',
  darwin: 'macOS',
  linux: 'Linux',
}

/** Presentation only: keep raw report facts and missing values unchanged. */
export function diagnosticsTargetRows(target: DiagnosticsTarget): readonly { label: string; value: string }[] {
  return [
    { label: '运行形态', value: HOST_LABELS[target.hostForm] ?? HOST_LABELS.unknown },
    { label: '操作系统', value: target.platform === null ? '未采集' : PLATFORM_LABELS[target.platform] ?? target.platform },
    { label: 'DSH 版本', value: target.dshVersion ?? '未采集（宿主未提供版本）' },
    { label: '插件（磁盘）', value: target.pluginDiskVersion ?? '未采集（无法读取安装信息）' },
    { label: '插件（已加载）', value: target.pluginLoadedVersion ?? '未采集（无法确认运行版本）' },
  ]
}
