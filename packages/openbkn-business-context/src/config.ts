import Schema from '@deepseek-ai/schemastery'

/** Deployment settings that are safe to keep in a DSH configuration patch. */
export interface Config {
  /** Empty until configured; credentials stay exclusively in DSH credentials. */
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
   * Upper bound for one OpenBKN MCP tool call. Raising it only helps a
   * deployment whose gateway allows longer requests: on the measured 0.1.5
   * platform the ingress answers 504 at 60 s and no call succeeded between
   * 20 s and 60 s, so a longer default only made each failure slower.
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
  baseUrl: Schema.transform(Schema.string().default(''), (value) => {
    // A fresh install is active but contributes no business capability yet.
    if (value === '') return value
    // WHATWG URL parsing repairs missing slashes, whitespace and backslashes.
    // Reject those inputs before parsing so typos fail at configuration time,
    // before business initialization or platform authentication.
    let valid = /^https?:\/\/[^/]/i.test(value) && !/[\s\\]/u.test(value)
    if (valid) {
      try {
        const url = new URL(value)
        valid = (url.protocol === 'https:' || url.protocol === 'http:') && url.hostname !== ''
      } catch {
        valid = false
      }
    }
    if (!valid) {
      // DSH serializes/reconstructs schema callbacks for settings validation:
      // keep this callback free of module references. The pinned Schemastery
      // ValidationError contract uses this global symbol and options.path;
      // its transform resolver does not pass callback options. Do not echo
      // the configured value (it may contain accidental secrets).
      throw Object.assign(new TypeError('$.baseUrl expected an absolute HTTP(S) URL without whitespace or backslashes'), {
        name: 'ValidationError', options: { path: ['baseUrl'] },
        [Symbol.for('ValidationError')]: true,
      })
    }
    return value
  }).default(''),
  mcpUrl: Schema.string(),
  businessDomain: Schema.string().pattern(/^[A-Za-z0-9_-]{1,64}$/),
  cliPath: Schema.string().default('openbkn'),
  requestTimeoutMs: Schema.natural().min(1).default(30_000),
  toolCallTimeoutMs: Schema.natural().min(1).default(20_000),
  maxResultBytes: Schema.natural().min(1).default(1_000_000),
  maxGraphNodes: Schema.natural().min(1).default(200),
  maxGraphEdges: Schema.natural().min(1).default(400),
  allowInsecureTls: Schema.boolean().default(false),
})
