import { useOpenBknTranslation } from './locale.tsx'

import type { ToolCallViewProps } from '@deepseek-ai/dsh-client-ui-tool/client'

/** Safe replacement for the generic raw-output row of the fixed OpenBKN context tool. */
export function OpenBknContextToolView({ block }: ToolCallViewProps) {
  const t = useOpenBknTranslation()

  const running = !('kind' in block)
  const failed = !running && block.kind === 'tool-result' && block.error !== undefined
  const status = running ? t('readingBusinessKnowledgeNetwork') : failed ? t('couldNotReadBusinessKnowledgeNetwork') : t('businessKnowledgeNetworkContextLoaded')
  return <div style={rowStyle}>
    <span aria-hidden="true" style={markStyle}>B</span>
    <span style={{ display: 'grid', gap: 2 }}><strong style={{ fontSize: 13 }}>{t('openBKNBusinessContext')}</strong><span style={{ color: failed ? '#b42318' : '#64748b', fontSize: 12 }}>{status}</span></span>
  </div>
}

const rowStyle = { display: 'flex', alignItems: 'center', gap: 9, padding: '10px 12px', border: '1px solid #d9e8e5', borderRadius: 10, background: '#f8fcfb', color: '#172033' }
const markStyle = { width: 24, height: 24, display: 'grid', placeItems: 'center', borderRadius: 7, background: '#078b7f', color: '#fff', fontSize: 12, fontWeight: 750 }
