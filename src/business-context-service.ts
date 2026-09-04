import { Context, Service } from '@deepseek-ai/cordis'
import type { Agent } from '@deepseek-ai/dsh-agent'
import { Config, type Config as PluginConfig } from './config.js'
import { bindDshSessionBusinessNetwork } from './dsh-session-binding.js'
import { mountBoundBusinessNetworkTool } from './scoped-business-context.js'
import type { BindBusinessNetworkResult, BusinessNetworkBinding } from './session-binding.js'

declare module '@deepseek-ai/cordis' {
  interface Context {
    /** Host-owned bridge used by the later OpenBKN client UI to select a business network. */
    openbknBusinessContext: OpenBknBusinessContextService
  }
}

/**
 * Owns the only selection transition: append the immutable DSH session event,
 * then activate the model tool only inside that Agent scope. The browser UI
 * will call this service through its host bridge in the next slice.
 */
export class OpenBknBusinessContextService extends Service {
  static inject = ['agents']
  static Config = Config

  private readonly mounted = new WeakSet<Agent>()

  constructor(ctx: Context, readonly config: PluginConfig) {
    super(ctx, 'openbknBusinessContext')
    ctx.on('agent/created', ({ agent }) => { this.mountIfBound(agent) })
    for (const agent of ctx.agents.list()) this.mountIfBound(agent)
  }

  /** Persist one network selection, reject conflicts, then scope the capability to this Agent. */
  bind(agent: Agent, requested: BusinessNetworkBinding): BindBusinessNetworkResult {
    if (this.ctx.agents.get(agent.id) !== agent) {
      throw new Error('OpenBKN business-network selection target is not a live DSH agent.')
    }
    if (normalizeBaseUrl(requested.platformBaseUrl) !== normalizeBaseUrl(this.config.baseUrl)) {
      throw new Error('OpenBKN business-network selection must use the configured OpenBKN platform.')
    }
    const result = bindDshSessionBusinessNetwork(agent.session, requested)
    this.mountIfBound(agent)
    return result
  }

  private mountIfBound(agent: Agent): void {
    if (this.mounted.has(agent)) return
    if (!mountBoundBusinessNetworkTool(agent, this.config)) return
    this.mounted.add(agent)
  }
}

function normalizeBaseUrl(value: string): string {
  return value.trim().replace(/\/+$/, '')
}
