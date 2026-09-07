import Schema from '@deepseek-ai/schemastery'

/** Deployment settings that are safe to keep in a DSH configuration patch. */
export interface Config {
  /** OpenBKN platform base URL; credentials stay exclusively in DSH credentials. */
  baseUrl: string
  /** Optional Context Loader MCP endpoint; defaults to the standard platform route. */
  mcpUrl?: string
  /** Optional OpenBKN business domain used to constrain platform requests. */
  businessDomain?: string
  /** Absolute path to the OpenBKN CLI used only for the Host login/token handshake. */
  cliPath: string
  /** Upper bound for one OpenBKN request. */
  requestTimeoutMs: number
  /** Maximum result payload admitted into DSH context. */
  maxResultBytes: number
  /** Maximum business-context graph node count rendered for one turn. */
  maxGraphNodes: number
  /** Maximum business-context graph edge count rendered for one turn. */
  maxGraphEdges: number
  /** Explicit opt-in only; disabled by default for local production use. */
  allowInsecureTls: boolean
}

/** Runtime schema and conservative defaults for the host plugin row. */
export const Config: Schema<Config> = Schema.object({
  baseUrl: Schema.string().required(),
  mcpUrl: Schema.string(),
  businessDomain: Schema.string(),
  cliPath: Schema.string().default('openbkn'),
  requestTimeoutMs: Schema.natural().min(1).default(30_000),
  maxResultBytes: Schema.natural().min(1).default(1_000_000),
  maxGraphNodes: Schema.natural().min(1).default(200),
  maxGraphEdges: Schema.natural().min(1).default(400),
  allowInsecureTls: Schema.boolean().default(false),
})
