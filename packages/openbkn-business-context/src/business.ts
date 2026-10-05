import type { Context } from '@deepseek-ai/cordis'
import { Config as ConfigSchema, type Config as PluginConfig } from './config.js'
import { OpenBknBusinessContextService } from './business-context-service.js'
import { OpenBknWorkspaceBindingRegistry } from './workspace-binding-registry.js'

export { ConfigSchema as Config }
export type { PluginConfig }

// Remote boundary types (AuthSnapshot, BusinessNetworkBinding,
// BusinessNetworkSummary, ProvenanceHandle, ProvenanceView) are deliberately
// NOT re-exported here: the typert generator attributes them to the first
// non-root face that exports them, and the client face only compiles the
// types-only ./types surface. Import them from
// '@openbkn/dsh-business-context/types'.
export { AuthCoordinator, OpenBknCliError } from './auth.js'
export type { CliResult, OpenBknCli } from './auth.js'
export {
  BUSINESS_NETWORK_BOUND_EVENT,
  MIGRATED_BUSINESS_NETWORK_BOUND_EVENT,
  bindBusinessNetwork,
  BusinessNetworkBindingConflictError,
  readBusinessNetworkBinding,
} from './session-binding.js'
export type {
  BindBusinessNetworkResult,
  SessionEventLike,
} from './session-binding.js'
export { SessionBindingStore } from './session-binding-store.js'
export type { SessionBindingRecord } from './session-binding-store.js'
export { bindDshSessionBusinessNetwork, inheritForkedBusinessNetwork, readDshSessionBusinessNetwork } from './dsh-session-binding.js'
export type { DshForkableSessionLog, DshSessionLog, SessionBindingRecords } from './dsh-session-binding.js'
export { readDshSessionTurnProvenance } from './dsh-session-provenance.js'
export type { DshSessionProvenanceLog } from './dsh-session-provenance.js'
export { MIGRATED_TURN_PROVENANCE_EVENT, TURN_PROVENANCE_EVENT, TurnProvenanceConflictError, readTurnProvenance } from './turn-provenance.js'
export type { TurnProvenanceEvent } from './turn-provenance.js'
export { normalizeProvenanceHandle, sameProvenanceHandle } from './provenance-handle.js'
export { buildTurnTimeline } from './turn-timeline.js'
export type { TurnTimelineLocator } from './turn-timeline.js'
export {
  CONVERSATION_INVALID_ERROR_CODES,
  FINISH_INTERACTION_TOOL,
  MANAGED_CONVERSATION_EVENT,
  MIGRATED_MANAGED_CONVERSATION_EVENT,
  START_INTERACTION_TOOL,
  classifyFailure,
  denialFor,
  initialState,
  lastConversationEvent,
  onToolResult,
  onTurnStart,
  projectLifecycleOutcome,
  restoreFrom,
} from './interaction-lifecycle.js'
export type {
  InteractionLifecycleState,
  LifecycleOutcomeLike,
  LifecycleToolResultProjection,
  ManagedConversationEventData,
} from './interaction-lifecycle.js'
export { emptyBusinessSessionPrompt } from './suggested-prompts.js'
export { buildManagedSessionPolicy, OPENBKN_DSH_INTERACTION_AGENT_NAME } from './managed-session-policy.js'
export type { ManagedSessionPolicy } from './managed-session-policy.js'
export { buildNetworkCapabilityProfile } from './network-capability-profile.js'
export type { NetworkCapabilityProfile } from './network-capability-profile.js'
export { OpenBknPlatformReader, PlatformReaderError } from './platform-reader.js'
export type { PlatformFetch, PlatformReaderConfig, PlatformReaderErrorCode } from './platform-reader.js'
export { OpenBknBusinessContextService } from './business-context-service.js'
export { OpenBknWorkspaceBindingRegistry, workspaceBindingKey, workspaceBindingRecord } from './workspace-binding-registry.js'
export type { WorkspaceBindingRecord } from './workspace-binding-registry.js'
export { mountBoundBusinessNetworkTool } from './scoped-business-context.js'

/**
 * Cordis identity used by the business row. The package root belongs to the
 * bootstrap entry (src/bootstrap.ts); this module loads through the
 * `@openbkn/dsh-business-context/business` subpath row, so an import failure
 * here leaves the root — and the client bundle it serves — alive.
 */
export const name = 'openbkn-business-context'

export const inject = ['agents', 'subprocess', 'storageDomain']

/** Register the host service; it contributes no model-visible tool globally. */
export async function apply(ctx: Context, config: PluginConfig): Promise<void> {
  await ctx.plugin(OpenBknWorkspaceBindingRegistry)
  await ctx.plugin(OpenBknBusinessContextService, config)
}
