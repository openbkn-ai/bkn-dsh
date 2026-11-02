import { useLayoutEffect, useState } from 'react'
import { App, ConfigProvider, type ConfigProviderProps } from 'antd'
import zhCN from 'antd/es/locale/zh_CN.js'
import enUS from 'antd/es/locale/en_US.js'
import { I18nextProvider } from 'react-i18next'
import i18n from './i18n.js'
import { BusinessProvenanceScene } from './business-provenance/BusinessProvenanceScene.js'
import type { BusinessProvenanceConversation } from './business-provenance/business-provenance.service.js'
import { PlatformProvenanceAdapterProvider, PlatformProvenancePortalProvider, type PlatformProvenanceAdapter } from './adapter.js'
import { css as sceneCss } from './business-provenance/BusinessProvenanceScene.styles.js'
import { css as railCss } from './evidence-chain/BusinessProvenance016.styles.js'
import { css as chainCss } from './evidence-chain/EvidenceChainPanels.styles.js'
import { css as explanationCss } from './evidence-chain/CurrentExplanationPanel.styles.js'
import { css as markdownCss } from './MarkdownText.styles.js'
import { css as themeCss } from './theme.styles.js'
import { platformTheme } from './theme.js'
export { createPlatformProvenanceAdapter } from './adapter.js'
export { writePlatformTextToClipboard } from './clipboard.js'
export type { PlatformProvenanceAdapter, PlatformProvenanceTransport } from './adapter.js'
export type { BusinessProvenanceConversation, BusinessProvenanceInteraction, BusinessProvenanceInteractionListItem, BusinessProvenancePage, BusinessProvenanceAnalysisHistory } from './business-provenance/business-provenance.service.js'
export interface PlatformProvenanceDetailProps {
  conversation: BusinessProvenanceConversation
  initialInteractionId: string
  adapter: PlatformProvenanceAdapter
  language?: string
}
/** Current conversation detail copied from Studio; the DSH Host owns authentication and identity. */
export function PlatformProvenanceDetail({conversation,initialInteractionId,adapter,language='zh'}: PlatformProvenanceDetailProps) {
  const [portal,setPortal] = useState<HTMLDivElement | null>(null)
  const locale = language.startsWith('en') ? 'en-US' : 'zh-CN'
  useLayoutEffect(() => { void i18n.changeLanguage(locale) }, [locale])
  const antLocaleModule = locale === 'en-US' ? enUS : zhCN
  const antLocale = ('default' in antLocaleModule ? antLocaleModule.default : antLocaleModule) as ConfigProviderProps['locale']
  return <I18nextProvider i18n={i18n}><PlatformProvenanceAdapterProvider value={adapter}>
    <PlatformProvenancePortalProvider value={portal}>
      <ConfigProvider locale={antLocale} getPopupContainer={() => portal!} theme={platformTheme}>
        <div ref={setPortal} data-platform-provenance="conversation-detail" style={{position:'relative',isolation:'isolate',minHeight:'100%',color:'#172033',background:'#f7f9fc'}}>
          <style>{themeCss+sceneCss+railCss+chainCss+explanationCss+markdownCss}</style>
          {portal && <App message={{getContainer:()=>portal}}><BusinessProvenanceScene key={`${conversation.conversationId}:${initialInteractionId}`} conversation={conversation} initialInteractionId={initialInteractionId}/></App>}
        </div>
      </ConfigProvider>
    </PlatformProvenancePortalProvider>
  </PlatformProvenanceAdapterProvider></I18nextProvider>
}
