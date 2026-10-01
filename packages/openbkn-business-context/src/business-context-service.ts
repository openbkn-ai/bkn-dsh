import { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-subprocess'
import type {} from '@deepseek-ai/dsh-tools'
import { credentialRef } from '@deepseek-ai/dsh-credentials'
import type { Agent } from '@deepseek-ai/dsh-agent'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import { Remote, RemoteError, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol'
import { parseVisibleBusinessNetworks } from './business-network-catalog.js'
import { Config, type Config as PluginConfig } from './config.js'
import { dshHomePath } from '@deepseek-ai/dsh-home-paths'
import {
  bindDshSessionBusinessNetwork,
  inheritForkedBusinessNetwork,
  readDshSessionBusinessNetwork,
  type SessionBindingRecords,
} from './dsh-session-binding.js'
import { readDshSessionTurnProvenance } from './dsh-session-provenance.js'
import { SessionBindingStore } from './session-binding-store.js'
import { OpenBknPlatformReader, PlatformReaderError } from './platform-reader.js'
import { AuthCoordinator, OpenBknCliError } from './auth.js'
import { OpenBknCliSubprocess, OpenBknCliUnavailableError } from './openbkn-cli-subprocess.js'
import { OPENBKN_MCP_TOKEN_REF, OpenBknMcpManager } from './openbkn-mcp-manager.js'
import { buildProvenanceView } from './provenance-view.js'
import { buildNetworkCapabilityProfile, type NetworkCapabilityProfile } from './network-capability-profile.js'
import { mountBoundBusinessNetworkTool } from './scoped-business-context.js'
import { emptyBusinessSessionPrompt } from './suggested-prompts.js'
import { buildTurnTimeline } from './turn-timeline.js'
import { OpenBknWorkspaceBindingRegistry } from './workspace-binding-registry.js'
import type { BindBusinessNetworkResult, BusinessNetworkBinding } from './session-binding.js'
import type { AuthSnapshot, BusinessNetworkSummary, ProvenanceDegradation, ProvenanceHandle, ProvenanceView } from './types.js'
import { realpath, stat } from 'node:fs/promises'
import { trimTrailingSlashes } from './trailing-slashes.js'

declare module '@deepseek-ai/cordis' {
  interface Context {
    /** Host-owned bridge used by the later OpenBKN client UI to select a business network. */
    openbknBusinessContext: OpenBknBusinessContextService
  }
}

declare module '@deepseek-ai/dsh-typert-protocol' {
  interface RemoteErrorDetailsMap {
    'openbkn/authentication-required': { readonly baseUrl: string }
    'openbkn/connection-failed': {
      readonly baseUrl: string
      readonly layer: 'context-loader-mcp' | 'platform-api'
    }
    'openbkn/platform-unavailable': { readonly baseUrl: string }
    'openbkn/cli-unavailable': { readonly cliPath: string }
  }
}

/** The one `sessionPersistence` read the orphan cleanup needs. */
interface SessionPersistenceStat {
  stat(sessionId: string): Promise<unknown>
}

/**
 * A record younger than this is never treated as orphaned: another process
 * may hold its session unmaterialized (invisible to this process's `stat`).
 */
const ORPHAN_BINDING_GRACE_MS = 7 * 24 * 60 * 60 * 1000

/**
 * A CLI the host cannot find or execute is reported with its own code, so the
 * panel explains how to install or point to it instead of blaming the token.
 * The lookup failure stays attached as the cause.
 */
function cliUnavailableAsRemote(error: unknown): unknown {
  return error instanceof OpenBknCliUnavailableError
    ? new RemoteError('openbkn/cli-unavailable', error.message, { cliPath: error.cliPath }, { cause: error })
    : error
}

const OPENBKN_TOOL_PREFIX = 'mcp__openbkn__'
const UNBOUND_OPENBKN_TOOL_DENIAL = 'OpenBKN tools are available only in a session bound to an OpenBKN knowledge network. '
  + 'Do not retry; tell the user to open a business session from the OpenBKN sidebar entry (in Standard mode, 标准模式).'

/**
 * Owns the only selection transition: durably record the immutable binding in
 * the plugin's own per-session store (never the DSH session log, which hosts
 * without an ignorable-event write path could not reload), then activate the
 * model tool only inside that Agent scope.
 */
export class OpenBknBusinessContextService extends TypertRemoteService {
  static inject = ['agents', 'credentials', 'subprocess', 'tools', 'openbknWorkspaceBindingRegistry']
  static Config = Config

  private readonly mounted = new WeakSet<Agent>()
  private readonly capabilityProfiles = new WeakMap<Agent, NetworkCapabilityProfile>()
  private mcpManagerInstance: OpenBknMcpManager | undefined
  /** Per-session binding records under `$DSH_HOME/openbkn/session-bindings`. */
  bindingRecords: SessionBindingRecords = new SessionBindingStore(dshHomePath('openbkn', 'session-bindings'))

  constructor(ctx: Context, readonly config: PluginConfig) {
    super(ctx, 'openbknBusinessContext')
    ctx.on('agent/created', async ({ agent }) => {
      await this.restoreBinding(agent)
      return undefined
    })
    ctx.on('agent/pre-step', async ({ agent, step, signal }, next) =>
      await this.refreshManagedMcpAtTurnStart(agent, step, signal, next))
    // The Context Loader client registers its tools globally, so every
    // session would see them; only a session whose scoped policy is mounted
    // may call them.
    ctx.tools.guard(execution => this.openBknToolDenial(execution))
    // DSH can restore Agents before this service is constructed. Treat those
    // resumed sessions exactly like newly created native sessions.
    for (const agent of ctx.agents.list()) void this.restoreBinding(agent)
    // Hosts without session persistence have no stored sessions to compare.
    ctx.inject(['sessionPersistence'], (persistenceCtx: Context) => {
      void this.pruneOrphanBindings(persistenceCtx.get('sessionPersistence') as SessionPersistenceStat)
    })
  }

  /**
   * Return the CLI-authenticated state and synchronize its token into the
   * DSH credential vault when needed. The token stays Host-only throughout.
   * A pre-existing manually configured DSH credential remains a fallback for
   * deployments without a usable CLI login.
   */
  @Remote('status')
  async remoteStatus(signal: AbortSignal): Promise<AuthSnapshot> {
    if (signal.aborted) throw signal.reason
    try {
      const auth = await this.authCoordinator().status(signal)
      if (auth.kind === 'authenticated') {
        await this.synchronizeCliCredential(signal)
      }
      return auth
    } catch (error: unknown) {
      // A configured manual credential is a restricted-deployment fallback,
      // not permission to hide a failed CLI synchronization. Once the CLI has
      // established this platform identity, its token is authoritative.
      const credential = await this.ctx.credentials.describe(credentialRef(OPENBKN_MCP_TOKEN_REF))
      if (!credential.configured) throw cliUnavailableAsRemote(error)
      if (error instanceof OpenBknCliError) {
        return { kind: 'authentication-required', baseUrl: this.config.baseUrl }
      }
      throw cliUnavailableAsRemote(error)
    }
  }

  /** Start the CLI's configured-platform browser login, then synchronize and verify it. */
  @Remote('beginLogin')
  async remoteBeginLogin(signal: AbortSignal): Promise<readonly BusinessNetworkSummary[]> {
    if (signal.aborted) throw signal.reason
    try {
      await this.authCoordinator().beginLogin()
      await this.synchronizeCliCredential(signal)
    } catch (error: unknown) {
      throw cliUnavailableAsRemote(error)
    }
    return await this.listNetworksAfterAuthentication(signal)
  }

  /**
   * Save one user-entered token to DSH's credential provider, connect the
   * standard MCP client by reference, then return only visible network DTOs.
   */
  @Remote('configureToken')
  async remoteConfigureToken(token: string, signal: AbortSignal): Promise<readonly BusinessNetworkSummary[]> {
    const value = token.trim()
    if (value.length === 0) throw new Error('An OpenBKN token is required.')
    await this.ctx.credentials.set(credentialRef(OPENBKN_MCP_TOKEN_REF), value)
    try {
      await this.refreshMcpConnection()
    } catch (error: unknown) {
      throw new RemoteError(
        'openbkn/connection-failed',
        'The OpenBKN Context Loader MCP could not be connected.',
        { baseUrl: this.config.baseUrl, layer: 'context-loader-mcp' },
        { cause: error },
      )
    }
    return await this.listNetworksAfterAuthentication(signal)
  }

  /** Read the immutable network identity already recorded on one live DSH session. */
  @Remote('getNetworkBinding')
  remoteGetNetworkBinding(sessionId: SessionId): BusinessNetworkBinding | undefined {
    const agent = this.ctx.agents.get(sessionId)
    if (agent === undefined) {
      throw new Error('OpenBKN business-network binding target is not a live DSH session.')
    }
    return this.bindingOf(agent)
  }

  /** Read only the provenance already committed for one finalized assistant message. */
  @Remote('getTurnProvenance')
  remoteGetTurnProvenance(sessionId: SessionId, messageId: string): ProvenanceHandle | undefined {
    const agent = this.ctx.agents.get(sessionId)
    if (agent === undefined) {
      throw new Error('OpenBKN turn provenance target is not a live DSH session.')
    }
    return readDshSessionTurnProvenance(agent.session, messageId)
  }

  /**
   * Resolve the selected turn's provenance on demand through the fixed
   * platform OSDK catalogue. The browser receives a bounded presentation DTO,
   * never raw MCP output, OSDK routes, or credentials.
   *
   * The local timeline (Layer 0) is rebuilt from session events and always
   * renders. Platform reads (Layers 1/2) degrade independently: a failure is
   * classified into `sources.degraded` instead of failing the whole view, so
   * a partially authorized deployment still sees the local execution chain.
   */
  @Remote('getTurnProvenanceView')
  async remoteGetTurnProvenanceView(
    sessionId: SessionId,
    messageId: string,
    signal: AbortSignal,
  ): Promise<ProvenanceView | undefined> {
    const agent = this.ctx.agents.get(sessionId)
    if (agent === undefined) {
      throw new Error('OpenBKN turn provenance target is not a live DSH session.')
    }
    const handle = readDshSessionTurnProvenance(agent.session, messageId)
    if (handle === undefined) return undefined
    const cwd = agent.session.header.cwd ?? '.'
    const reader = this.platformReader()
    const timeline = buildTurnTimeline(
      agent.session.snapshotEvents(),
      handle.turn === undefined ? { messageId } : { turn: handle.turn },
    )
    // Trace operations and the authorized assembly are independent read
    // models. Each failure degrades only its own pane; neither hides the
    // local timeline, and the browser receives no raw payload in any case.
    const [core, graph] = await Promise.allSettled([
      reader.getInteractionOperations(handle.interactionId, signal, cwd),
      reader.getInteractionBusinessGraph(handle.interactionId, signal, cwd),
    ])
    if (signal.aborted) throw signal.reason
    // Verified against OpenBKN 0.1.4 (docs/evidence/2026-09-20-provenance-v1-v2.md):
    // the observability read routes have no license gate. A 403
    // permission_denied there always means the request's business domain is
    // not in the deployment's static allow-list (chart-shipped, default
    // bd_public) or the account was refused by BKN Safe; a license gap on the
    // platform instead answers 404 capability_not_licensed on the MCP write
    // path, never 403 here. So the reader's LICENSE_REQUIRED classification
    // maps to the domain-authorization degradation, never an upgrade hint.
    const classify = (pane: 'operations' | 'business', failure: unknown): ProvenanceDegradation => {
      const error = failure instanceof PlatformReaderError ? failure : undefined
      if (error?.code === 'AUTHENTICATION_REQUIRED') return { pane, reason: 'authentication-required' }
      if (error?.code === 'RECORD_NOT_DISCLOSED') return { pane, reason: 'record-not-disclosed' }
      if (error?.code === 'LICENSE_REQUIRED') {
        return { pane, reason: 'domain-not-authorized', ...(error.requiredAction === undefined ? {} : { requiredAction: error.requiredAction }) }
      }
      return { pane, reason: 'platform-unavailable' }
    }
    const operations = core.status === 'rejected' ? classify('operations', core.reason) : undefined
    const business = graph.status === 'rejected' ? classify('business', graph.reason) : undefined
    if (operations !== undefined || business !== undefined) {
      this.ctx.logger.warn(
        'openbkn-business-context: provenance reads degraded (operations=%s, business=%s)',
        operations === undefined ? 'ok' : operations.reason,
        business === undefined ? 'ok' : business.reason,
      )
    }
    return buildProvenanceView(
      handle,
      timeline,
      core.status === 'fulfilled' ? core.value : undefined,
      graph.status === 'fulfilled' ? graph.value : undefined,
      { ...(operations === undefined ? {} : { operations }), ...(business === undefined ? {} : { business }) },
      {
      maxGraphNodes: this.config.maxGraphNodes,
      maxGraphEdges: this.config.maxGraphEdges,
      },
    )
  }

  /** Return the one optional, draft-only introduction for an empty bound session. */
  @Remote('getSessionSuggestions')
  remoteGetSessionSuggestions(sessionId: SessionId): readonly string[] {
    const agent = this.ctx.agents.get(sessionId)
    if (agent === undefined) {
      throw new Error('OpenBKN suggestion target is not a live DSH session.')
    }
    const binding = this.bindingOf(agent)
    if (binding === undefined) return []
    if (agent.session.snapshotEvents().some(event => event.type === 'assistant/message')) return []
    return [emptyBusinessSessionPrompt(binding.displayName)]
  }

  /** List only the business networks authorized by the managed OpenBKN token. */
  @Remote('listNetworks')
  async remoteListNetworks(signal: AbortSignal): Promise<readonly BusinessNetworkSummary[]> {
    const status = await this.remoteStatus(signal)
    if (status.kind !== 'authenticated') {
      throw new Error('OpenBKN authentication is required before listing business networks.')
    }
    await this.ensureMcpConnection()
    return await this.listNetworksAfterAuthentication(signal)
  }

  /** A successful MCP initial handshake plus OSDK catalogue read is the connection test. */
  private async listNetworksAfterAuthentication(signal: AbortSignal): Promise<readonly BusinessNetworkSummary[]> {
    let payload: unknown
    try {
      payload = await this.platformReader().listKnowledgeNetworks(signal, '.')
    } catch (error: unknown) {
      if (error instanceof PlatformReaderError && error.code === 'AUTHENTICATION_REQUIRED') {
        throw new RemoteError(
          'openbkn/authentication-required',
          'OpenBKN authentication is required.',
          { baseUrl: this.config.baseUrl },
        )
      }
      if (error instanceof PlatformReaderError && error.code === 'PLATFORM_UNAVAILABLE') {
        throw new RemoteError(
          'openbkn/platform-unavailable',
          'The OpenBKN platform knowledge-network catalogue is temporarily unavailable.',
          { baseUrl: this.config.baseUrl },
          { cause: error },
        )
      }
      throw new RemoteError(
        'openbkn/connection-failed',
        'The OpenBKN platform API could not be queried.',
        { baseUrl: this.config.baseUrl, layer: 'platform-api' },
        { cause: error },
      )
    }
    return parseVisibleBusinessNetworks(payload).map(network => {
      const workspacePath = this.ctx.openbknWorkspaceBindingRegistry.get(this.config.baseUrl, network.id)?.workspacePath
      return workspacePath === undefined ? network : { ...network, workspacePath }
    })
  }

  /** Persist a selected local DSH workspace only after the network is authorized. */
  @Remote('bindNetworkWorkspace')
  async remoteBindNetworkWorkspace(networkId: string, workspacePath: string, signal: AbortSignal): Promise<BusinessNetworkSummary> {
    const status = await this.remoteStatus(signal)
    if (status.kind !== 'authenticated') throw new Error('OpenBKN authentication is required before selecting a workspace.')
    const network = parseVisibleBusinessNetworks(await this.platformReader().listKnowledgeNetworks(signal, '.'))
      .find(candidate => candidate.id === networkId.trim())
    if (network === undefined) throw new Error('The requested OpenBKN business network is not visible to the current identity.')
    const canonicalPath = await canonicalDirectory(workspacePath)
    await this.ctx.openbknWorkspaceBindingRegistry.put({
      platformBaseUrl: this.config.baseUrl,
      knowledgeNetworkId: network.id,
      displayName: network.displayName,
      workspacePath: canonicalPath,
    })
    return { ...network, workspacePath: canonicalPath }
  }

  /**
   * Bind this exact live Agent to one network already confirmed visible by the
   * configured CLI identity. The Client provides only the opaque network id;
   * display data and platform routing are re-derived on the Host.
   */
  @Remote('bindNetwork')
  async remoteBindNetwork(
    sessionId: SessionId,
    networkId: string,
    signal: AbortSignal,
  ): Promise<BusinessNetworkBinding> {
    const status = await this.remoteStatus(signal)
    if (status.kind !== 'authenticated') {
      throw new Error('OpenBKN authentication is required before binding a business network.')
    }
    const network = parseVisibleBusinessNetworks(
      await this.platformReader().listKnowledgeNetworks(signal, '.'),
    ).find(candidate => candidate.id === networkId.trim())
    if (network === undefined) {
      throw new Error('The requested OpenBKN business network is not visible to the current identity.')
    }
    const agent = this.ctx.agents.get(sessionId)
    if (agent === undefined) {
      throw new Error('OpenBKN business-network selection target is not a live DSH session.')
    }
    const binding = {
      platformBaseUrl: this.config.baseUrl,
      knowledgeNetworkId: network.id,
      displayName: network.displayName,
    }
    // Profile retrieval is host-only and advisory. The verified binding owns
    // network identity, so a profile failure keeps the fixed scoped policy.
    // The candidate stays local until `bind` settles: a concurrent request for
    // another network must not replace the profile the winner mounts.
    let profile: NetworkCapabilityProfile | undefined
    try {
      profile = buildNetworkCapabilityProfile(
        binding,
        await this.platformReader().getKnowledgeNetworkDetail(binding, signal, agent.session.header.cwd ?? '.'),
      )
    } catch (error: unknown) {
      this.ctx.logger.warn(
        'openbkn-business-context: capability profile unavailable; continuing with the verified network binding and fixed managed-session policy (code=%s)',
        safeCapabilityProfileFailureCode(error),
      )
    }
    const result = await this.bind(agent, binding, profile)
    return result.binding
  }

  /**
   * Persist one network selection, reject conflicts, then scope the capability
   * to this Agent. The capability is enabled only after the binding record is
   * durable; a failed write rejects and leaves the session unbound.
   */
  async bind(agent: Agent, requested: BusinessNetworkBinding, profile?: NetworkCapabilityProfile): Promise<BindBusinessNetworkResult> {
    if (this.ctx.agents.get(agent.id) !== agent) {
      throw new Error('OpenBKN business-network selection target is not a live DSH agent.')
    }
    if (normalizeBaseUrl(requested.platformBaseUrl) !== normalizeBaseUrl(this.config.baseUrl)) {
      throw new Error('OpenBKN business-network selection must use the configured OpenBKN platform.')
    }
    const result = await bindDshSessionBusinessNetwork(agent.session, this.bindingRecords, requested)
    // Only the settled binding's own profile is published, and only before the
    // policy mounts (a mounted policy keeps the profile it was built with).
    if (profile !== undefined && profile.knowledgeNetworkId === result.binding.knowledgeNetworkId && !this.mounted.has(agent)) {
      this.capabilityProfiles.set(agent, profile)
    }
    this.mountIfBound(agent)
    return result
  }

  private bindingOf(agent: Agent): BusinessNetworkBinding | undefined {
    return readDshSessionBusinessNetwork(agent.session, this.bindingRecords)
  }

  /**
   * Global guard: an OpenBKN tool runs only for an Agent carrying the scoped
   * business policy (lifecycle, network scope, PTC refusal). Unbound sessions,
   * sessions whose binding could not be read or conflicted when restored,
   * sessions bound to another platform, and fresh sub-agents are refused. The
   * check is the mounted policy, not a re-read of the record, so a record that
   * breaks after mounting takes effect when the session is reopened.
   */
  private openBknToolDenial(execution: { readonly name: string; readonly agent?: Agent }): string | undefined {
    if (!execution.name.startsWith(OPENBKN_TOOL_PREFIX)) return undefined
    if (execution.agent !== undefined && this.mounted.has(execution.agent)) return undefined
    return UNBOUND_OPENBKN_TOOL_DENIAL
  }

  private mountIfBound(agent: Agent): void {
    if (this.mounted.has(agent)) return
    const binding = this.bindingOf(agent)
    const profile = this.capabilityProfiles.get(agent)
    const matchingProfile = profile !== undefined && profile.knowledgeNetworkId === binding?.knowledgeNetworkId ? profile : undefined
    if (!mountBoundBusinessNetworkTool(agent, this.config, binding, matchingProfile)) return
    this.mounted.add(agent)
  }

  /**
   * Bring a newly live session's binding into effect: its own record or log
   * event, a fork's inherited binding, or a unique workspace association. A
   * failure leaves the session unbound (no OpenBKN capability) and is logged;
   * it never blocks the native DSH session.
   */
  private async restoreBinding(agent: Agent): Promise<void> {
    try {
      await inheritForkedBusinessNetwork(agent.session, this.bindingRecords)
      await this.bindWorkspaceNetworkIfUnique(agent)
    } catch (error: unknown) {
      this.warnBindingUnavailable(error)
    }
  }

  /**
   * The binding as a native-session lifecycle hook sees it: an unreadable,
   * malformed, or conflicting binding counts as unbound (and is logged), the
   * same outcome `restoreBinding` gave the session, so the OpenBKN capability
   * stays off but native DSH turns keep running. Remote reads still surface
   * the error to the UI through `bindingOf`.
   */
  private bindingOrUnbound(agent: Agent): BusinessNetworkBinding | undefined {
    try {
      return this.bindingOf(agent)
    } catch (error: unknown) {
      this.warnBindingUnavailable(error)
      return undefined
    }
  }

  /** Remove binding records of sessions DSH no longer stores; see `SessionBindingStore.pruneOrphans`. */
  private async pruneOrphanBindings(persistence: SessionPersistenceStat): Promise<void> {
    if (!(this.bindingRecords instanceof SessionBindingStore)) return
    try {
      const removed = await this.bindingRecords.pruneOrphans(
        async sessionId => await persistence.stat(sessionId) !== undefined,
        new Date(Date.now() - ORPHAN_BINDING_GRACE_MS),
      )
      if (removed.length > 0) {
        this.ctx.logger.info('openbkn-business-context: removed %d binding record(s) of sessions DSH no longer stores', removed.length)
      }
    } catch (error: unknown) {
      this.ctx.logger.warn(
        'openbkn-business-context: binding record cleanup skipped (code=%s)',
        error instanceof Error ? error.name : 'unknown',
      )
    }
  }

  private warnBindingUnavailable(error: unknown): void {
    this.ctx.logger.warn(
      'openbkn-business-context: session binding unavailable; the session stays unbound (code=%s)',
      error instanceof Error ? error.name : 'unknown',
    )
  }

  /**
   * Project one user-approved workspace association into a newly live native
   * DSH session. A missing or ambiguous association deliberately leaves the
   * native session untouched.
   */
  private async bindWorkspaceNetworkIfUnique(agent: Agent): Promise<void> {
    if (this.bindingOf(agent) !== undefined) {
      this.mountIfBound(agent)
      return
    }
    const workspacePath = agent.session.header.cwd
    if (workspacePath === undefined) return
    const record = this.ctx.openbknWorkspaceBindingRegistry.findUniqueByWorkspace(this.config.baseUrl, workspacePath)
    if (record === undefined) return
    await this.bind(agent, {
      platformBaseUrl: this.config.baseUrl,
      knowledgeNetworkId: record.knowledgeNetworkId,
      // Legacy mappings persisted before display metadata use the stable id
      // rather than guessing a business-facing name.
      displayName: record.displayName ?? record.knowledgeNetworkId,
    })
  }

  /**
   * Reconcile the CLI-owned credential before a bound business turn reaches
   * its first model step. This is the only per-turn lifecycle point: later
   * tool-planning steps retain the same connection and do not re-authenticate.
   */
  private async refreshManagedMcpAtTurnStart<T>(
    agent: Agent,
    step: number,
    signal: AbortSignal,
    next: () => Promise<T>,
  ): Promise<T> {
    if (step === 1 && this.bindingOrUnbound(agent) !== undefined) {
      await this.remoteStatus(signal)
    }
    return await next()
  }

  private async ensureMcpConnection(): Promise<void> {
    if (this.ctx.tools === undefined) return
    await this.mcpManager().ensure()
  }

  private async refreshMcpConnection(): Promise<void> {
    if (this.ctx.tools === undefined) return
    await this.mcpManager().refresh()
  }

  private mcpManager(): OpenBknMcpManager {
    return this.mcpManagerInstance ??= new OpenBknMcpManager(this.ctx, this.config, () => this.resolveOpenBknToken())
  }

  private authCoordinator(): AuthCoordinator {
    return new AuthCoordinator(new OpenBknCliSubprocess(this.ctx.subprocess, '.', this.config.baseUrl, this.config.cliPath), this.config.baseUrl)
  }

  /** Synchronize exactly one configured-platform CLI token into DSH credentials. */
  private async synchronizeCliCredential(signal: AbortSignal): Promise<void> {
    const token = await this.authCoordinator().readToken(signal)
    await this.ctx.credentials.set(credentialRef(OPENBKN_MCP_TOKEN_REF), token)
    await this.refreshMcpConnection()
  }

  /** Historical private seam retained for unit fixtures; it now returns the Host HTTP reader, never a Python OSDK process. */
  private platformReader(): OpenBknPlatformReader {
    return new OpenBknPlatformReader({
      ...this.config,
      resolveToken: () => this.resolveOpenBknToken(),
    })
  }

  /** Resolve only the DSH-managed token; legacy environment variables are not silently migrated. */
  private async resolveOpenBknToken(): Promise<string | undefined> {
    const ref = credentialRef(OPENBKN_MCP_TOKEN_REF)
    const managed = await this.ctx.credentials.resolve(ref)
    return managed?.value
  }
}

function safeCapabilityProfileFailureCode(error: unknown): string {
  return error instanceof PlatformReaderError ? error.code : 'PROFILE_UNAVAILABLE'
}

function normalizeBaseUrl(value: string): string {
  return trimTrailingSlashes(value.trim())
}

async function canonicalDirectory(path: string): Promise<string> {
  const canonicalPath = await realpath(path)
  if (!(await stat(canonicalPath)).isDirectory()) throw new Error('OpenBKN workspace must be an existing local directory.')
  return canonicalPath
}
