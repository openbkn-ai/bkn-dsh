import type { Context } from '@deepseek-ai/cordis'
import { defineTool } from '@deepseek-ai/dsh-tools'
import type {} from '@deepseek-ai/dsh-agent'
import type {} from '@deepseek-ai/dsh-subprocess'
import { readDshSessionBusinessNetwork, type DshSessionLog } from './dsh-session-binding.js'
import { OsdkRunnerClient, type OsdkRunnerConfig, type RunnerSubprocess } from './osdk-runner.js'

/** Services required for the fixed, session-bound OpenBKN context tool. */
export const inject = ['tools', 'subprocess']

/**
 * Register the single business-context capability available to a model. The
 * knowledge network is never a tool parameter: it is recovered from the
 * current DSH session's immutable OpenBKN binding.
 */
export function applyOpenBknContextTools(ctx: Context, config: OsdkRunnerConfig): void {
  const subprocess: RunnerSubprocess = {
    spawn: spec => ctx.subprocess.spawn(spec),
  }
  const runner = new OsdkRunnerClient(subprocess, config)
  ctx.tools.register(defineTool({
    name: 'openbkn_get_business_network_context',
    description: 'Read the selected OpenBKN business knowledge network context for this conversation.',
    parameters: {},
    output: {
      schema: { type: 'json' },
      render: (_args, value) => [{ type: 'text', text: JSON.stringify(value) }],
    },
    timeoutMs: config.requestTimeoutMs,
    async execute(_args, exec) {
      const session = exec.agent?.session
      if (session === undefined) throw new Error('OpenBKN business context requires an active DSH session.')
      const binding = readDshSessionBusinessNetwork(session as unknown as DshSessionLog)
      if (binding === undefined) throw new Error('This DSH session is not bound to an OpenBKN business knowledge network.')
      return runner.getKnowledgeNetworkDetail(binding, exec.signal, session.header.cwd ?? '.')
    },
  }))
}
