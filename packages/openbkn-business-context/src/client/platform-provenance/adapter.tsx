import { createContext, useContext } from 'react'
import type { JsonValue } from '@deepseek-ai/dsh-util-values'
import type { ProvenanceDetailRequest } from '../../provenance-detail-types.js'
import type { BusinessProvenanceConversation, BusinessProvenanceInteractionListItem, BusinessProvenanceInteraction, BusinessProvenancePage, BusinessProvenanceAnalysisHistory } from './business-provenance/business-provenance.service.js'
import { BusinessProvenanceAnalysisError } from './business-provenance/business-provenance.service.js'
import { parseCurrentExplanation, type CurrentExplanation } from './evidence-chain/current-explanation.service.js'
import { normalizeConversations, normalizeInteraction, normalizeInteractions, normalizeHistory } from './normalizers.js'

export type PlatformProvenanceTransport = (request: ProvenanceDetailRequest, signal?: AbortSignal, onAnalysis?: (event: { event: string; data: JsonValue }) => void) => Promise<JsonValue>
export interface PlatformProvenanceAdapter {
  readConversation(signal?: AbortSignal): Promise<BusinessProvenanceConversation>
  listInteractions(query: {keyword?: string; page?: number; pageSize?: number}, signal?: AbortSignal): Promise<BusinessProvenancePage<BusinessProvenanceInteractionListItem>>
  readInteraction(id: string, signal?: AbortSignal): Promise<BusinessProvenanceInteraction>
  readExplanation(id: string, signal?: AbortSignal): Promise<CurrentExplanation>
  generateExplanation(id: string, signal?: AbortSignal): Promise<CurrentExplanation>
  readMarkdown(id: string, signal?: AbortSignal): Promise<string>
  readAnalysisHistory(id: string, signal?: AbortSignal): Promise<BusinessProvenanceAnalysisHistory[]>
  analyze(id: string, markdown: string, onDelta: (text: string) => void, signal?: AbortSignal): Promise<Record<string, unknown>>
  copyText(text: string): Promise<void>
  downloadMarkdown(id: string, markdown: string): void | Promise<void>
}
export function createPlatformProvenanceAdapter(transport: PlatformProvenanceTransport, actions: Pick<PlatformProvenanceAdapter, 'copyText' | 'downloadMarkdown'>): PlatformProvenanceAdapter {
  return {
    ...actions,
    async readConversation(signal) {
      const page = normalizeConversations(await transport({kind: 'conversation'}, signal)) as BusinessProvenancePage<BusinessProvenanceConversation>
      if (page.entries.length !== 1 || !page.entries[0]?.conversationId) throw new Error('conversation unavailable')
      return page.entries[0]
    },
    async listInteractions(query, signal) { return normalizeInteractions(await transport({kind:'rounds', ...query}, signal)) },
    async readInteraction(id, signal) {
      const value = normalizeInteraction(await transport({kind:'detail', interactionId:id}, signal), id) as BusinessProvenanceInteraction
      if (value.interactionId !== id) throw new Error('interaction mismatch')
      return value
    },
    async readExplanation(id, signal) { return parseCurrentExplanation(await transport({kind:'explanation',interactionId:id},signal),id) },
    async generateExplanation(id, signal) { return parseCurrentExplanation(await transport({kind:'generate',interactionId:id},signal),id) },
    async readMarkdown(id, signal) {
      const value = await transport({kind:'markdown',interactionId:id},signal)
      if (typeof value !== 'string') throw new Error('invalid markdown')
      return value
    },
    async readAnalysisHistory(id, signal) { return normalizeHistory(await transport({kind:'history',interactionId:id},signal), id) },
    async analyze(id, markdown, onDelta, signal) {
      let result: Record<string, unknown> | undefined
      let analysisError: BusinessProvenanceAnalysisError | undefined
      await transport({kind:'analyze',interactionId:id,markdown},signal, ({event,data}) => {
        if (!data || typeof data !== 'object' || Array.isArray(data)) return
        if (event === 'token' && typeof data.content === 'string') onDelta(data.content)
        if (event === 'structured' && data.content && typeof data.content === 'object' && !Array.isArray(data.content)) result = data.content
        if (event === 'error') analysisError = new BusinessProvenanceAnalysisError(typeof data.message === 'string' ? data.message : 'Analysis failed', typeof data.code === 'string' ? data.code : undefined)
      })
      if (analysisError) throw analysisError
      if (!result) throw new BusinessProvenanceAnalysisError('Analysis result missing', 'analysis_empty_result')
      return result
    },
  }
}
const AdapterContext = createContext<PlatformProvenanceAdapter | null>(null)
export const PlatformProvenanceAdapterProvider = AdapterContext.Provider
export function usePlatformProvenanceAdapter() {
  const adapter = useContext(AdapterContext)
  if (!adapter) throw new Error('Platform provenance adapter missing')
  return adapter
}
const PortalContext = createContext<HTMLElement | null>(null)
export const PlatformProvenancePortalProvider = PortalContext.Provider
export function usePlatformProvenancePortal() { return useContext(PortalContext) }
