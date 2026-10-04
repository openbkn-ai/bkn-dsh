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
  /**
   * Upper bound for one OpenBKN MCP tool call. Published functions and
   * `run_code` run on the platform and can take tens of seconds.
   */
  toolCallTimeoutMs: number
  /** Maximum result payload admitted into DSH context. */
  maxResultBytes: number
  /** Maximum business-context graph node count rendered for one turn. */
  maxGraphNodes: number
  /** Maximum business-context graph edge count rendered for one turn. */
  maxGraphEdges: number
  /**
   * Explicit opt-in only; disabled by default for local production use.
   * Allows plaintext http to non-loopback hosts — it does NOT relax TLS
   * certificate validation (self-signed certs are handled by the Node trust
   * store, e.g. NODE_EXTRA_CA_CERTS, not by this switch).
   */
  allowInsecureTls: boolean
}

/** Runtime schema and conservative defaults for the host plugin row. */
export const Config: Schema<Config> = Schema.object({
  baseUrl: Schema.string().required(),
  mcpUrl: Schema.string(),
  businessDomain: Schema.string().pattern(/^[A-Za-z0-9_-]{1,64}$/),
  cliPath: Schema.string().default('openbkn'),
  requestTimeoutMs: Schema.natural().min(1).default(30_000),
  toolCallTimeoutMs: Schema.natural().min(1).default(60_000),
  maxResultBytes: Schema.natural().min(1).default(1_000_000),
  maxGraphNodes: Schema.natural().min(1).default(200),
  maxGraphEdges: Schema.natural().min(1).default(400),
  allowInsecureTls: Schema.boolean().default(false),
})
