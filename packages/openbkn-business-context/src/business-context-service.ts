import { Context } from '@deepseek-ai/cordis'
import type { Agent } from '@deepseek-ai/dsh-agent'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import { Remote, RemoteError, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol'
import { AuthCoordinator } from './auth.js'
import { parseVisibleBusinessNetworks } from './business-network-catalog.js'
import { Config, type Config as PluginConfig } from './config.js'
import { bindDshSessionBusinessNetwork, readDshSessionBusinessNetwork } from './dsh-session-binding.js'
import { appendDshSessionTurnProvenance, readDshSessionTurnProvenance } from './dsh-session-provenance.js'
import { findCompletedNativeMcpProvenance } from './native-mcp-provenance.js'
import { OpenBknCliSubprocess } from './openbkn-cli-subprocess.js'
import { OsdkRunnerClient, OsdkRunnerError } from './osdk-runner.js'
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
  }
}

/**
 * Owns the only selection transition: append the immutable DSH session event,
 * then activate the model tool only inside that Agent scope. The browser UI
 * will call this service through its host bridge in the next slice.
 */
export class OpenBknBusinessContextService extends TypertRemoteService {
  static inject = ['agents', 'subprocess', 'openbknWorkspaceBindingRegistry']
  static Config = Config

  private readonly mounted = new WeakSet<Agent>()
  private readonly capabilityProfiles = new WeakMap<Agent, NetworkCapabilityProfile>()

  constructor(ctx: Context, readonly config: PluginConfig) {
    super(ctx, 'openbknBusinessContext')
    ctx.on('agent/created', ({ agent }) => { this.mountIfBound(agent) })
    ctx.on('agent/turn-stopping', ({ agent, turn }) => { this.captureTurnProvenance(agent, turn) })
    for (const agent of ctx.agents.list()) this.mountIfBound(agent)
  }

  /** Return only the safe login state; the browser never receives a credential value. */
  @Remote('status')
  async remoteStatus(signal: AbortSignal): Promise<AuthSnapshot> {
    return await this.authCoordinator().status(signal)
  }

  /** Start the configured CLI login flow; no token or generic command reaches the Client. */
  @Remote('beginLogin')
  async remoteBeginLogin(): Promise<void> {
    await this.authCoordinator().beginLogin()
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
    const runner = this.osdkRunner()
    // BKN Safe does not assemble or advertise this EE BFF capability. Probe
    // the two documented read models independently: a deployment can expose
    // either Core facts or the EE projection, and neither failure should hide
    // the other model's safe data from the browser.
    const [core, enterprise] = await Promise.allSettled([
      runner.getInteractionOperations(handle.interactionId, signal, cwd),
      runner.getInteractionBusinessProvenance(handle.interactionId, signal, cwd),
    ])
    if (signal.aborted) throw signal.reason
    if (core.status === 'rejected' && enterprise.status === 'rejected') {
      this.ctx.logger.warn(
        'openbkn-business-context: provenance reads failed (core=%s, enterprise=%s)',
        safeRunnerFailureCode(core.reason),
        safeRunnerFailureCode(enterprise.reason),
      )
      throw new Error('OpenBKN provenance records are unavailable for this interaction.')
    }
    return buildProvenanceView(
      handle,
      core.status === 'fulfilled' ? core.value : undefined,
      enterprise.status === 'fulfilled' ? enterprise.value : undefined,
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

  /** List only the business networks authorized for the current CLI identity. */
  @Remote('listNetworks')
  async remoteListNetworks(signal: AbortSignal): Promise<readonly BusinessNetworkSummary[]> {
    const status = await this.authCoordinator().status(signal)
    if (status.kind !== 'authenticated') {
      throw new Error('OpenBKN authentication is required before listing business networks.')
    }
    let payload: unknown
    try {
      payload = await this.osdkRunner().listKnowledgeNetworks(signal, '.')
    } catch (error: unknown) {
      if (error instanceof OsdkRunnerError && error.code === 'AUTHENTICATION_REQUIRED') {
        throw new RemoteError(
          'openbkn/authentication-required',
          'OpenBKN authentication is required.',
          { baseUrl: this.config.baseUrl },
        )
      }
      throw error
    }
    return parseVisibleBusinessNetworks(payload).map(network => {
      const workspacePath = this.ctx.openbknWorkspaceBindingRegistry.get(this.config.baseUrl, network.id)?.workspacePath
      return workspacePath === undefined ? network : { ...network, workspacePath }
    })
  }

  /** Persist a selected local DSH workspace only after the network is authorized. */
  @Remote('bindNetworkWorkspace')
  async remoteBindNetworkWorkspace(networkId: string, workspacePath: string, signal: AbortSignal): Promise<BusinessNetworkSummary> {
    const status = await this.authCoordinator().status(signal)
    if (status.kind !== 'authenticated') throw new Error('OpenBKN authentication is required before selecting a workspace.')
    const network = parseVisibleBusinessNetworks(await this.osdkRunner().listKnowledgeNetworks(signal, '.'))
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
    const status = await this.authCoordinator().status(signal)
    if (status.kind !== 'authenticated') {
      throw new Error('OpenBKN authentication is required before binding a business network.')
    }
    const network = parseVisibleBusinessNetworks(
      await this.osdkRunner().listKnowledgeNetworks(signal, '.'),
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
        await this.osdkRunner().getKnowledgeNetworkDetail(binding, signal, agent.session.header.cwd ?? '.'),
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

  /** Persist only an explicitly completed OpenBKN interaction when its turn ends. */
  private captureTurnProvenance(agent: Agent, turn: number): void {
    if (readDshSessionBusinessNetwork(agent.session) === undefined) return
    const provenance = findCompletedNativeMcpProvenance(agent.session.snapshotEvents(), turn)
    if (provenance === undefined) return
    appendDshSessionTurnProvenance(agent.session, provenance.messageId, provenance.handle)
  }

  private authCoordinator(): AuthCoordinator {
    return new AuthCoordinator(
      new OpenBknCliSubprocess(this.ctx.subprocess, '.', this.config.baseUrl),
      this.config.baseUrl,
    )
  }

  private osdkRunner(): OsdkRunnerClient {
    return new OsdkRunnerClient(this.ctx.subprocess, this.config)
  }
}

function safeRunnerFailureCode(error: unknown): string {
  return error instanceof OsdkRunnerError ? error.code : 'UNCLASSIFIED'
}

function safeCapabilityProfileFailureCode(error: unknown): string {
  return error instanceof OsdkRunnerError ? error.code : 'PROFILE_UNAVAILABLE'
}

function normalizeBaseUrl(value: string): string {
  return value.trim().replace(/\/+$/, '')
}

async function canonicalDirectory(path: string): Promise<string> {
  const canonicalPath = await realpath(path)
  if (!(await stat(canonicalPath)).isDirectory()) throw new Error('OpenBKN workspace must be an existing local directory.')
  return canonicalPath
}
