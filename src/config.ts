import Schema from '@deepseek-ai/schemastery'

/** Deployment settings that are safe to keep in a DSH configuration patch. */
export interface Config {
  /** OpenBKN platform base URL; credentials stay exclusively in the OpenBKN CLI. */
  baseUrl: string
  /** Optional OpenBKN business domain used to constrain platform requests. */
  businessDomain?: string
  /** Path to the controlled Python runner used in a later capability slice. */
  runnerPath: string
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
  businessDomain: Schema.string(),
  runnerPath: Schema.string().default('python3'),
  requestTimeoutMs: Schema.natural().min(1).default(30_000),
  maxResultBytes: Schema.natural().min(1).default(1_000_000),
  maxGraphNodes: Schema.natural().min(1).default(200),
  maxGraphEdges: Schema.natural().min(1).default(400),
  allowInsecureTls: Schema.boolean().default(false),
})
