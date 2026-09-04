import type { Context } from '@deepseek-ai/cordis'
import type { Agent } from '@deepseek-ai/dsh-agent'
import { readDshSessionBusinessNetwork, type DshSessionLog } from './dsh-session-binding.js'
import { applyOpenBknContextTools } from './openbkn-context-tools.js'
import type { OsdkRunnerConfig } from './osdk-runner.js'

/** Agent-scoped plugin row: only mounted after the session has a compatible binding. */
const scopedToolPlugin = (config: OsdkRunnerConfig) => ({
  name: 'openbkn-business-context-tool',
  inject: ['tools', 'subprocess'],
  apply(ctx: Context): void {
    applyOpenBknContextTools(ctx, config)
  },
})

/**
 * Mount the model-visible OpenBKN tool in one Agent's Cordis scope. An
 * unbound or differently configured session gets no registration at all, so
 * native DSH conversations keep their original tool catalogue.
 */
export function mountBoundBusinessNetworkTool(agent: Agent, config: OsdkRunnerConfig): boolean {
  const binding = readDshSessionBusinessNetwork(agent.session as unknown as DshSessionLog)
  if (binding === undefined || normalizeBaseUrl(binding.platformBaseUrl) !== normalizeBaseUrl(config.baseUrl)) return false
  agent.ctx.plugin(scopedToolPlugin(config))
  return true
}

function normalizeBaseUrl(value: string): string {
  return value.trim().replace(/\/+$/, '')
}
