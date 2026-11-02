/** Browser actions are explicit user gestures and preserve platform Markdown verbatim. */
export const provenanceBrowserActions = {
  async copyText(text: string): Promise<void> {
    await writePlatformTextToClipboard(text, document.querySelector<HTMLElement>('[data-platform-provenance="conversation-detail"]'))
  },
  downloadMarkdown(interactionId: string, markdown: string): void {
    const safeId = interactionId.replace(/[^a-zA-Z0-9_-]/g, '_')
    const blob = new Blob([markdown], { type:'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `knowledge-network-optimization-${safeId}.md`
    anchor.rel = 'noopener'
    document.body.append(anchor)
    try { anchor.click() } finally { anchor.remove(); URL.revokeObjectURL(url) }
  },
}
import { writePlatformTextToClipboard } from './platform-provenance/index.tsx'
