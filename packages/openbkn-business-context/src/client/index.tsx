import type { Context } from '@deepseek-ai/cordis'
import type { RemoteResult } from '@deepseek-ai/dsh-api-remotes/client'
import type { SessionId } from '@deepseek-ai/dsh-api-remotes/client'
import type { BusinessNetworkBinding, ProvenanceHandle } from '../types.ts'
import type { HostObservable } from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-api-remotes/client'
import type {} from '@deepseek-ai/dsh-api-session-controller/client'
import type {} from '@deepseek-ai/dsh-client-ui-layout/client'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type {} from '@deepseek-ai/dsh-client-ui-chat/client'
import type {} from '@deepseek-ai/dsh-client-ui-tool/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-ui-session/client'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'
import type {} from '@deepseek-ai/dsh-client-ui-workspace/client'
import type { ISessions } from '@deepseek-ai/dsh-api-session-controller/client'
import type { IWorkspaces, WorkspaceView } from '@deepseek-ai/dsh-api-workspace-controller/client'
import type { UiWorkspace } from '@deepseek-ai/dsh-client-ui-workspace/client'
import openbknBusinessContextRemote from '@openbkn/dsh-business-context/remote'
import { OpenBknEntry } from './OpenBknEntry.tsx'
import { OpenBknOverlay } from './OpenBknOverlay.tsx'
import { OpenBknContextToolView } from './OpenBknContextToolView.tsx'
import { BoundNetworkBadge, BoundNetworkController } from './BoundNetworkBadge.tsx'
import { OpenBknUiController, type NetworkSessionMode, type OpenBknUiPort } from './openbkn-ui-controller.ts'
import { ProvenanceOverlay, ProvenanceOverlayController } from './ProvenanceOverlay.tsx'
import type { ProvenanceView } from '../types.ts'
import { SuggestionDock } from './SuggestionDock.tsx'
import { TurnProvenanceActions } from './TurnProvenanceActions.tsx'
import { SuggestionDockController } from './suggestion-dock-controller.ts'
import { TurnProvenanceController } from './turn-provenance-controller.ts'

/** Browser-side Cordis identity. */
export const name = 'openbkn-business-context-client'

/**
 * Reserves an additive browser entry without taking ownership of any DSH
 * shell, conversation, composer, or scrolling surface.
 */
export const inject = ['slots', 'remote', 'sessions', 'conversation', 'workspaces', 'uiWorkspace']

/** Mount the generated Remote boundary before registering additive DSH UI slots. */
export async function apply(ctx: Context): Promise<() => Promise<void>> {
  const disposeRemote = await ctx.remote.$mount(openbknBusinessContextRemote)
  const ui = ctx.inject([
    'slots',
    'remote',
    'remote.openbknBusinessContext',
    'sessions',
    'conversation',
  ], registerSlots)
  try {
    await ui
  } catch (error) {
    await ui.dispose()
    await disposeRemote()
    throw error
  }
  return async () => {
    await ui.dispose()
    await disposeRemote()
  }
}

/** Register only additive DSH slots; native navigation and conversation surfaces remain untouched. */
function registerSlots(ctx: Context): void {
  const controller = new OpenBknUiController(remotePort(ctx), createNetworkSessionOpener(ctx, remotePort(ctx)))
  const provenanceOverlay = new ProvenanceOverlayController()
  const provenanceControllers = new Map<SessionId, TurnProvenanceController>()
  const suggestionControllers = new Map<SessionId, SuggestionDockController>()
  const provenanceFor = (sessionId: SessionId): TurnProvenanceController => {
    let controller = provenanceControllers.get(sessionId)
    if (controller === undefined) {
      controller = new TurnProvenanceController(async messageId => unwrap(
        await ctx.remote.openbknBusinessContext.getTurnProvenance(sessionId, messageId),
      ))
      provenanceControllers.set(sessionId, controller)
    }
    return controller
  }
  const suggestionsFor = (sessionId: SessionId): SuggestionDockController => {
    let controller = suggestionControllers.get(sessionId)
    if (controller === undefined) {
      controller = new SuggestionDockController(async () => unwrap(
        await ctx.remote.openbknBusinessContext.getSessionSuggestions(sessionId),
      ))
      suggestionControllers.set(sessionId, controller)
    }
    return controller
  }
  const inject = () => ({
    hooks: { ui: controller as HostObservable<ReturnType<typeof controller.getSnapshot>> },
    open: () => controller.open(),
    close: () => controller.close(),
    refresh: () => controller.refresh(),
    beginLogin: () => controller.beginLogin(),
    openNetwork: (networkId: string, mode: NetworkSessionMode) => controller.openNetwork(networkId, mode),
  })

  ctx.slots.inject('sidebar.footer.action', () => ctx.slots.register({
    name: 'sidebar.footer.action', id: 'openbkn-business-context', order: 100, inject,
  }, OpenBknEntry))
  ctx.slots.inject('shell.overlay', () => ctx.slots.register({
    name: 'shell.overlay', id: 'openbkn-business-context', order: 100, inject,
  }, OpenBknOverlay))
  ctx.slots.inject('shell.overlay', () => ctx.slots.register({
    name: 'shell.overlay', id: 'openbkn-business-provenance', order: 110,
    inject: () => ({
      hooks: { provenanceOverlay },
      load: async (sessionId: SessionId, messageId: string) => unwrap(
        await ctx.remote.openbknBusinessContext.getTurnProvenanceView(sessionId, messageId),
      ),
      close: () => provenanceOverlay.close(),
    }),
  }, ProvenanceOverlay))
  ctx.slots.inject('conversation.session.header.actions', () => ctx.slots.register({
    name: 'conversation.session.header.actions', id: 'openbkn-bound-network', order: 30,
    inject: (sessionId: SessionId) => {
      const binding = new BoundNetworkController(async () => unwrap(await ctx.remote.openbknBusinessContext.getNetworkBinding(sessionId)))
      return { hooks: { binding }, load: () => binding.load() }
    },
  }, BoundNetworkBadge))
  ctx.slots.inject('conversation.input.dock', () => ctx.slots.register({
    name: 'conversation.input.dock', id: 'openbkn-suggestions', order: 30,
    inject: (sessionId: SessionId) => {
      const actx = ctx.sessions.scope(sessionId)
      if (actx === undefined) throw new Error(`OpenBKN suggestion dock could not resolve session ${sessionId}.`)
      const conversation = actx.get('conversation')
      if (conversation === undefined) throw new Error('OpenBKN suggestion dock requires the DSH conversation service.')
      const suggestions = suggestionsFor(sessionId)
      return {
        hooks: { suggestions },
        load: () => suggestions.load(),
        setDraft: (prompt: string) => conversation.input.for(actx).setDraft(prompt),
      }
    },
  }, SuggestionDock))
  ctx.slots.inject('conversation.chat.assistant-actions', () => ctx.slots.register({
    name: 'conversation.chat.assistant-actions', id: 'openbkn-turn-provenance', order: 20,
    inject: (sessionId: SessionId) => {
      const provenance = provenanceFor(sessionId)
      return {
        hooks: { provenance },
        load: (messageId: string) => provenance.load(messageId),
        open: (messageId: string, handle: ProvenanceHandle, restoreFocus: HTMLElement) => provenanceOverlay.open(sessionId, messageId, handle, restoreFocus),
      }
    },
  }, TurnProvenanceActions))
  ctx.slots.inject('tool.call.toolview', () => ctx.slots.register({
    name: 'tool.call.toolview', key: 'openbkn_get_business_network_context',
  }, OpenBknContextToolView))
}

function remotePort(ctx: Context): OpenBknUiPort & {
  getNetworkBinding(sessionId: SessionId): Promise<BusinessNetworkBinding | undefined>
  getTurnProvenance(sessionId: SessionId, messageId: string): Promise<ProvenanceHandle | undefined>
  getTurnProvenanceView(sessionId: SessionId, messageId: string): Promise<ProvenanceView | undefined>
  getSessionSuggestions(sessionId: SessionId): Promise<readonly string[]>
} {
  const remote = ctx.remote.openbknBusinessContext
  return {
    status: async signal => unwrap(await remote.status(signal)),
    beginLogin: async () => unwrap(await remote.beginLogin()),
    getNetworkBinding: async (sessionId: SessionId) => unwrap(await remote.getNetworkBinding(sessionId)),
    getTurnProvenance: async (sessionId: SessionId, messageId: string) => unwrap(await remote.getTurnProvenance(sessionId, messageId)),
    getTurnProvenanceView: async (sessionId: SessionId, messageId: string) => unwrap(await remote.getTurnProvenanceView(sessionId, messageId)),
    getSessionSuggestions: async (sessionId: SessionId) => unwrap(await remote.getSessionSuggestions(sessionId)),
    listNetworks: async signal => unwrap(await remote.listNetworks(signal)),
    bindNetworkWorkspace: async (networkId, workspacePath, signal) => unwrap(await remote.bindNetworkWorkspace(networkId, workspacePath, signal)),
    bindNetwork: async (sessionId, networkId, signal) => unwrap(await remote.bindNetwork(sessionId, networkId, signal)),
  }
}

/** Use DSH's native workspace/session services; the plugin owns only the OpenBKN association. */
function createNetworkSessionOpener(ctx: Context, port: OpenBknUiPort) {
  const sessions = ctx.get('sessions') as ISessions
  const workspaces = ctx.get('workspaces') as IWorkspaces
  const uiWorkspace = ctx.get('uiWorkspace') as UiWorkspace
  return async (network: import('../types.ts').BusinessNetworkSummary, mode: NetworkSessionMode): Promise<SessionId> => {
    let workspace: WorkspaceView
    if (network.workspacePath === undefined) {
      if (mode !== 'create-workspace') throw new Error('This OpenBKN business knowledge network has no associated local workspace.')
      const path = await uiWorkspace.pickDirectory()
      if (path === null) throw new Error('Workspace selection was cancelled.')
      workspace = await workspaces.create({ path })
      await port.bindNetworkWorkspace(network.id, workspace.path)
    } else {
      workspace = workspaces.list.getSnapshot().items.find(item => item.path === network.workspacePath)
        ?? await workspaces.create({ path: network.workspacePath })
    }

    const sessionId = mode === 'continue' ? latestWorkspaceSession(workspace, sessions) ?? await sessions.create({ workspaceId: workspace.workspaceId })
      : await sessions.create({ workspaceId: workspace.workspaceId })
    sessions.open(sessionId)
    return sessionId
  }
}

function latestWorkspaceSession(workspace: WorkspaceView, sessions: ISessions): SessionId | undefined {
  const snapshot = sessions.list.getSnapshot()
  const archived = new Set(snapshot.archivedSessionIds)
  return workspace.sessionIds
    .map(id => snapshot.byId[id])
    .filter((session): session is NonNullable<typeof session> => session !== undefined && !archived.has(session.id))
    .sort((left, right) => right.updatedAt - left.updatedAt)[0]?.id
}

function unwrap<T>(result: RemoteResult<T>): T {
  if (!result.ok) throw result.error
  return result.value
}
