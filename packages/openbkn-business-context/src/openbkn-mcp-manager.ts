import type { Context } from '@deepseek-ai/cordis'
import * as McpClient from '@deepseek-ai/dsh-mcp-client'
import type { Config } from './config.js'

export const OPENBKN_MCP_TOKEN_REF = 'OPENBKN_MCP_TOKEN'
const REQUIRED_TOOL = 'mcp__openbkn__bkn_start_interaction'

/**
 * Mounts the standard DSH MCP client once the user has stored an OpenBKN
 * token. It resolves the credential immediately before mounting, and passes it
 * only to the in-memory standard MCP client configuration. An explicitly configured client with the same public tool
 * namespace is treated as the deployment-owned instance.
 */
export class OpenBknMcpManager {
  private starting: Promise<void> | undefined

  constructor(
    private readonly ctx: Context,
    private readonly config: Config,
    private readonly resolveToken: () => Promise<string | undefined>,
  ) {}

  async ensure(): Promise<void> {
    if (this.ctx.tools.get(REQUIRED_TOOL) !== undefined) return
    if (this.starting === undefined) {
      this.starting = this.start().finally(() => { this.starting = undefined })
    }
    await this.starting
  }

  private async start(): Promise<void> {
    const token = await this.resolveToken()
    if (token === undefined || token.length === 0) {
      throw new Error('OpenBKN Context Loader MCP requires a configured token.')
    }
    await this.ctx.plugin(McpClient, McpClient.Config({
      transport: 'streamable-http',
      serverName: 'openbkn',
      url: resolveMcpUrl(this.config),
      headers: { Authorization: `Bearer ${token}` },
      toolCallTimeoutMs: 20_000,
      failOnStartupError: true,
      reconnect: { enabled: true, initialDelayMs: 500, maxDelayMs: 30_000, maxAttempts: 10 },
    }))
    if (this.ctx.tools.get(REQUIRED_TOOL) === undefined) {
      throw new Error('OpenBKN Context Loader MCP did not publish its managed interaction tools.')
    }
  }
}

/** Resolve the stable Context Loader endpoint from the deployment platform URL. */
export function resolveMcpUrl(config: Pick<Config, 'baseUrl' | 'mcpUrl'>): string {
  if (config.mcpUrl !== undefined && config.mcpUrl.trim().length > 0) return new URL(config.mcpUrl).toString()
  const base = new URL(config.baseUrl)
  return new URL('/api/agent-retrieval/v1/mcp/', base).toString()
}
