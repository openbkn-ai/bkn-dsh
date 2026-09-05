import type { Context } from '@deepseek-ai/cordis'
import { Config as ConfigSchema, type Config as PluginConfig } from './config.js'
import { OpenBknBusinessContextService } from './business-context-service.js'
import { OpenBknWorkspaceBindingRegistry } from './workspace-binding-registry.js'

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
export { appendDshSessionTurnProvenance, readDshSessionTurnProvenance } from './dsh-session-provenance.js'
export type { DshSessionProvenanceLog, DshSessionProvenanceWriter } from './dsh-session-provenance.js'
export { TURN_PROVENANCE_EVENT, TurnProvenanceConflictError, appendTurnProvenance, readTurnProvenance } from './turn-provenance.js'
export type { TurnProvenanceEvent } from './turn-provenance.js'
export { normalizeProvenanceHandle } from './provenance-handle.js'
export type { ProvenanceHandle } from './types.js'
export { resolveSuggestedPrompts } from './suggested-prompts.js'
export { buildManagedSessionPolicy } from './managed-session-policy.js'
export type { ManagedSessionPolicy } from './managed-session-policy.js'
export { buildNetworkCapabilityProfile } from './network-capability-profile.js'
export type { NetworkCapabilityProfile } from './network-capability-profile.js'
export { OsdkRunnerClient, OsdkRunnerError } from './osdk-runner.js'
export type { JsonValue, OsdkRunnerConfig, OsdkRunnerErrorCode, RunnerSubprocess } from './osdk-runner.js'
export { OpenBknBusinessContextService } from './business-context-service.js'
export { OpenBknWorkspaceBindingRegistry, workspaceBindingKey, workspaceBindingRecord } from './workspace-binding-registry.js'
export type { WorkspaceBindingRecord } from './workspace-binding-registry.js'
export { mountBoundBusinessNetworkTool } from './scoped-business-context.js'

/** Cordis identity used by the bundle's Host row. */
export const name = 'openbkn-business-context'

export const inject = ['agents', 'subprocess', 'storageDomain']

/** Register the host service; it contributes no model-visible tool globally. */
export async function apply(ctx: Context, config: PluginConfig): Promise<void> {
  await ctx.plugin(OpenBknWorkspaceBindingRegistry)
  await ctx.plugin(OpenBknBusinessContextService, config)
}
