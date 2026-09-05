import Schema from '@deepseek-ai/schemastery'

/** Deployment settings that are safe to keep in a DSH configuration patch. */
export interface Config {
  /** OpenBKN platform base URL; credentials stay exclusively in DSH credentials. */
  baseUrl: string
  /** Optional Context Loader MCP endpoint; defaults to the standard platform route. */
  mcpUrl?: string
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
  /** Deployment-configured draft-only question templates; `{network}` resolves to the bound network name. */
  suggestedPrompts: string[]
  /** Explicit opt-in only; disabled by default for local production use. */
  allowInsecureTls: boolean
}

/** Runtime schema and conservative defaults for the host plugin row. */
export const Config: Schema<Config> = Schema.object({
  baseUrl: Schema.string().required(),
  mcpUrl: Schema.string(),
  businessDomain: Schema.string(),
  runnerPath: Schema.string().default('python3'),
  requestTimeoutMs: Schema.natural().min(1).default(30_000),
  maxResultBytes: Schema.natural().min(1).default(1_000_000),
  maxGraphNodes: Schema.natural().min(1).default(200),
  maxGraphEdges: Schema.natural().min(1).default(400),
  suggestedPrompts: Schema.array(Schema.string()).default([
    '概览 {network} 中最需要关注的业务风险与原因。',
    '识别关键对象之间的影响关系，并说明需要核实的信息。',
    '给出下一步最值得执行的业务分析步骤。',
  ]),
  allowInsecureTls: Schema.boolean().default(false),
})
