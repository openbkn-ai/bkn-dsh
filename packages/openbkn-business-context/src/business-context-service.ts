import { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-subprocess'
import type {} from '@deepseek-ai/dsh-tools'
import { credentialRef } from '@deepseek-ai/dsh-credentials'
import type { Agent } from '@deepseek-ai/dsh-agent'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import { Remote, RemoteError, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol'
import { parseVisibleBusinessNetworks } from './business-network-catalog.js'
import { Config, type Config as PluginConfig } from './config.js'
import { bindDshSessionBusinessNetwork, readDshSessionBusinessNetwork } from './dsh-session-binding.js'
import { appendDshSessionTurnProvenance, readDshSessionTurnProvenance } from './dsh-session-provenance.js'
import { findCompletedNativeMcpProvenance } from './native-mcp-provenance.js'
import { OpenBknPlatformReader, PlatformReaderError } from './platform-reader.js'
import { AuthCoordinator, OpenBknCliError } from './auth.js'
import { OpenBknCliSubprocess } from './openbkn-cli-subprocess.js'
import { OPENBKN_MCP_TOKEN_REF, OpenBknMcpManager } from './openbkn-mcp-manager.js'
import { buildProvenanceView } from './provenance-view.js'
import { buildNetworkCapabilityProfile, type NetworkCapabilityProfile } from './network-capability-profile.js'
import { mountBoundBusinessNetworkTool } from './scoped-business-context.js'
import { resolveSuggestedPrompts } from './suggested-prompts.js'
import { OpenBknWorkspaceBindingRegistry } from './workspace-binding-registry.js'
import type { BindBusinessNetworkResult, BusinessNetworkBinding } from './session-binding.js'
import type { AuthSnapshot, BusinessNetworkSummary, ProvenanceHandle, ProvenanceView } from './types.js'
import { realpath, stat } from 'node:fs/promises'

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
  }
}

/**
 * Owns the only selection transition: append the immutable DSH session event,
 * then activate the model tool only inside that Agent scope. The browser UI
 * will call this service through its host bridge in the next slice.
 */
export class OpenBknBusinessContextService extends TypertRemoteService {
  static inject = ['agents', 'credentials', 'subprocess', 'tools', 'openbknWorkspaceBindingRegistry']
  static Config = Config

  private readonly mounted = new WeakSet<Agent>()
  private readonly capabilityProfiles = new WeakMap<Agent, NetworkCapabilityProfile>()
  private mcpManagerInstance: OpenBknMcpManager | undefined

  constructor(ctx: Context, readonly config: PluginConfig) {
    super(ctx, 'openbknBusinessContext')
    ctx.on('agent/created', ({ agent }) => { this.mountIfBound(agent) })
    ctx.on('agent/pre-step', async ({ agent, step, signal }, next) =>
      await this.refreshManagedMcpAtTurnStart(agent, step, signal, next))
    ctx.on('agent/turn-stopping', ({ agent, turn }) => { this.captureTurnProvenance(agent, turn) })
    for (const agent of ctx.agents.list()) this.mountIfBound(agent)
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
      if (!credential.configured) throw error
      if (error instanceof OpenBknCliError) {
        return { kind: 'authentication-required', baseUrl: this.config.baseUrl }
      }
      throw error
    }
  }

  /** Start the CLI's configured-platform browser login, then synchronize and verify it. */
  @Remote('beginLogin')
  async remoteBeginLogin(signal: AbortSignal): Promise<readonly BusinessNetworkSummary[]> {
    if (signal.aborted) throw signal.reason
    await this.authCoordinator().beginLogin()
    await this.synchronizeCliCredential(signal)
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
    return readDshSessionBusinessNetwork(agent.session)
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
    // Trace Community operations and the Trace 3 authorized assembly are
    // independent read models. A failure in one must not hide safe facts from
    // the other; the browser receives no raw MCP or OSDK payload in either case.
    const [core, graph] = await Promise.allSettled([
      reader.getInteractionOperations(handle.interactionId, signal, cwd),
      reader.getInteractionBusinessGraph(handle.interactionId, signal, cwd),
    ])
    if (signal.aborted) throw signal.reason
    if (core.status === 'rejected' && graph.status === 'rejected') {
      this.ctx.logger.warn(
        'openbkn-business-context: provenance reads failed (core=%s, graph=%s)',
        safeRunnerFailureCode(core.reason),
        safeRunnerFailureCode(graph.reason),
      )
      throw new Error('OpenBKN provenance records are unavailable for this interaction.')
    }
    return buildProvenanceView(
      handle,
      core.status === 'fulfilled' ? core.value : undefined,
      graph.status === 'fulfilled' ? graph.value : undefined,
      {
      maxGraphNodes: this.config.maxGraphNodes,
      maxGraphEdges: this.config.maxGraphEdges,
      },
    )
  }

  /** Return deployment-configured, draft-only prompts for one already-bound live session. */
  @Remote('getSessionSuggestions')
  remoteGetSessionSuggestions(sessionId: SessionId): readonly string[] {
    const agent = this.ctx.agents.get(sessionId)
    if (agent === undefined) {
      throw new Error('OpenBKN suggestion target is not a live DSH session.')
    }
    const binding = readDshSessionBusinessNetwork(agent.session)
    return binding === undefined ? [] : resolveSuggestedPrompts(this.config.suggestedPrompts, binding.displayName)
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
    try {
      this.capabilityProfiles.set(agent, buildNetworkCapabilityProfile(
        binding,
        await this.platformReader().getKnowledgeNetworkDetail(binding, signal, agent.session.header.cwd ?? '.'),
      ))
    } catch (error: unknown) {
      this.ctx.logger.warn(
        'openbkn-business-context: capability profile unavailable; continuing with the verified network binding and fixed managed-session policy (code=%s)',
        safeCapabilityProfileFailureCode(error),
      )
    }
    const result = this.bind(agent, binding)
    return result.kind === 'bound' ? result.event.data : result.binding
  }

  /** Persist one network selection, reject conflicts, then scope the capability to this Agent. */
  bind(agent: Agent, requested: BusinessNetworkBinding): BindBusinessNetworkResult {
    if (this.ctx.agents.get(agent.id) !== agent) {
      throw new Error('OpenBKN business-network selection target is not a live DSH agent.')
    }
    if (normalizeBaseUrl(requested.platformBaseUrl) !== normalizeBaseUrl(this.config.baseUrl)) {
      throw new Error('OpenBKN business-network selection must use the configured OpenBKN platform.')
    }
    const result = bindDshSessionBusinessNetwork(agent.session, requested)
    this.mountIfBound(agent)
    return result
  }

  private mountIfBound(agent: Agent): void {
    if (this.mounted.has(agent)) return
    if (!mountBoundBusinessNetworkTool(agent, this.config, this.capabilityProfiles.get(agent))) return
    this.mounted.add(agent)
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
    if (step === 1 && readDshSessionBusinessNetwork(agent.session) !== undefined) {
      await this.remoteStatus(signal)
    }
    return await next()
  }

  /** Persist only an explicitly completed OpenBKN interaction when its turn ends. */
  private captureTurnProvenance(agent: Agent, turn: number): void {
    if (readDshSessionBusinessNetwork(agent.session) === undefined) return
    const provenance = findCompletedNativeMcpProvenance(agent.session.snapshotEvents(), turn)
    if (provenance === undefined) return
    appendDshSessionTurnProvenance(agent.session, provenance.messageId, provenance.handle)
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

function safeRunnerFailureCode(error: unknown): string {
  return error instanceof PlatformReaderError ? error.code : 'UNCLASSIFIED'
}

function safeCapabilityProfileFailureCode(error: unknown): string {
  return error instanceof PlatformReaderError ? error.code : 'PROFILE_UNAVAILABLE'
}

function normalizeBaseUrl(value: string): string {
  return value.trim().replace(/\/+$/, '')
}

async function canonicalDirectory(path: string): Promise<string> {
  const canonicalPath = await realpath(path)
  if (!(await stat(canonicalPath)).isDirectory()) throw new Error('OpenBKN workspace must be an existing local directory.')
  return canonicalPath
}
