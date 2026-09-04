import type { Context } from '@deepseek-ai/cordis'
import { Config as ConfigSchema, type Config as PluginConfig } from './config.js'
import { OpenBknBusinessContextService } from './business-context-service.js'

export { ConfigSchema as Config }
export type { PluginConfig }
export { AuthCoordinator, OpenBknCliError } from './auth.js'
export type { AuthSnapshot, CliResult, OpenBknCli } from './auth.js'
export {
  BUSINESS_NETWORK_BOUND_EVENT,
  bindBusinessNetwork,
  BusinessNetworkBindingConflictError,
  readBusinessNetworkBinding,
} from './session-binding.js'
export type {
  BindBusinessNetworkResult,
  BusinessNetworkBinding,
  BusinessNetworkBoundEvent,
  SessionEventLike,
} from './session-binding.js'
export { bindDshSessionBusinessNetwork, readDshSessionBusinessNetwork } from './dsh-session-binding.js'
export type { DshSessionBindingLog, DshSessionLog } from './dsh-session-binding.js'
export { OsdkRunnerClient, OsdkRunnerError } from './osdk-runner.js'
export type { JsonValue, OsdkRunnerConfig, OsdkRunnerErrorCode, RunnerSubprocess } from './osdk-runner.js'
export { OpenBknBusinessContextService } from './business-context-service.js'
export { mountBoundBusinessNetworkTool } from './scoped-business-context.js'

/** Cordis identity used by the bundle's Host row. */
export const name = 'openbkn-business-context'

export const inject = ['agents']

/** Register the host service; it contributes no model-visible tool globally. */
export async function apply(ctx: Context, config: PluginConfig): Promise<void> {
  await ctx.plugin(OpenBknBusinessContextService, config)
}
