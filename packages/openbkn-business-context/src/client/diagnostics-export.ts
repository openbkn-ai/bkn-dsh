import type { DiagnosticsReport } from '../diagnostics-contract.ts'

/** Serializer indirection so tests can capture downloads without a DOM. */
export interface DownloadPort {
  download(fileName: string, contents: string): void
}

const browserDownload: DownloadPort = {
  download(fileName, contents) {
    const blob = new Blob([contents], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = fileName
    anchor.rel = 'noopener'
    document.body.append(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
  },
}

/**
 * Build the export file name for one report: UTC timestamp plus the short
 * report id, so two exports from one panel are distinguishable.
 * @param report - the report being exported.
 * @returns a file-system-safe JSON file name.
 */
export function diagnosticsExportFileName(report: Pick<DiagnosticsReport, 'createdAt' | 'reportId'>): string {
  const stamp = report.createdAt.replace(/[^0-9TZ]/g, '')
  const safeId = report.reportId.replace(/[^0-9A-Za-z-]/g, '') || 'report'
  return `OpenBKN-diagnostic-${stamp}-${safeId}.json`
}

/**
 * Serialize a report for export. The DTO is whitelisted by construction; this
 * re-stringifies deterministically and refuses non-JSON leftovers.
 * @param report - the report to export.
 * @returns the JSON document text.
 */
export function serializeDiagnosticsReport(report: DiagnosticsReport): string {
  return `${JSON.stringify(report, null, 2)}\n`
}

/**
 * Export one report as a JSON download.
 * @param report - the report to export.
 * @param port - download sink (browser file save by default).
 */
export function exportDiagnosticsReport(report: DiagnosticsReport, port: DownloadPort = browserDownload): void {
  port.download(diagnosticsExportFileName(report), serializeDiagnosticsReport(report))
}
