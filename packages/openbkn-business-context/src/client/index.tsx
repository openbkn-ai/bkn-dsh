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
import { OpenBknDiagnostics } from './OpenBknDiagnostics.tsx'
import { DiagnosticsPanelController } from './diagnostics-controller.ts'
import { OpenBknPanelBridge } from './openbkn-panel-bridge.ts'
import { OpenBknContextToolView } from './OpenBknContextToolView.tsx'
import { BoundNetworkBadge, BoundNetworkController } from './BoundNetworkBadge.tsx'
import {
  directoryPickerFailure, workspaceSelectionCancelled, type NetworkSessionMode, type OpenBknUiPort,
} from './openbkn-ui-controller.ts'
import { ProvenanceOverlay, ProvenanceOverlayController } from './ProvenanceOverlay.tsx'
import type { ProvenanceView } from '../types.ts'
import { SuggestionDock } from './SuggestionDock.tsx'
import { TurnProvenanceActions } from './TurnProvenanceActions.tsx'
import { SuggestionDockController, synchronizeSuggestionDockForEvents } from './suggestion-dock-controller.ts'
import { TurnProvenanceController } from './turn-provenance-controller.ts'

/** Browser-side Cordis identity. */
export const name = 'openbkn-business-context-client'

/**
 * Reserves an additive browser entry without taking ownership of any DSH
 * shell, conversation, composer, or scrolling surface. Only the base slot and
 * remote services are top-level dependencies: the diagnostics segment must
 * register even while session/workspace services are still starting (or
 * never start), and the business segment waits for its own services below.
 */
export const inject = ['slots', 'remote']

/**
 * Mount the generated Remote boundary, then register two independent
 * segments: the panel shell and diagnostics first (they must never wait for
 * business services), and the business slots after.
 */
export async function apply(ctx: Context): Promise<() => Promise<void>> {
  const disposeRemote = await ctx.remote.$mount(openbknBusinessContextRemote)
  // The diagnostics namespace is installed by the same $mount above, so this
  // inject never waits on the Host; only the business segment below does.
  // The diagnostics controller is created inside that injected scope; the
  // business segment connects to the independent panel bridge when ready.
  const panel = new OpenBknPanelBridge()
  const diagnostics = ctx.inject(['slots', 'remote', 'remote.openbknDiagnostics', 'remote.openbknConfiguration'], scopedCtx =>
    registerPanels(scopedCtx, panel))
  // A diagnostics failure degrades the panel only; it never blocks or breaks
  // the business registration below.
  const diagnosticsSettled = diagnostics.then(() => undefined, () => undefined)
  const ui = ctx.inject([
    'slots',
    'remote',
    'remote.openbknBusinessContext',
    'sessions',
    'conversation',
    'workspaces',
    'uiWorkspace',
  ], scopedCtx => registerSlots(scopedCtx, panel))
  try {
    await ui
  } catch (error) {
    await ui.dispose()
    await diagnosticsSettled
    await diagnostics.dispose()
    await disposeRemote()
    throw error
  }
  return async () => {
    await ui.dispose()
    await diagnosticsSettled
    await diagnostics.dispose()
    await disposeRemote()
  }
}

/**
 * Register the diagnostics surfaces. The namespace is mounted locally by
 * this face's own `$mount` call, so listing it here waits for nothing on the
 * Host; the business Remote namespace is deliberately absent. The created
 * panel shell shares a controller with the later business segment.
 */
function registerPanels(ctx: Context, bridge: OpenBknPanelBridge): void {
  const panel = bridge.controller
  const disconnectConfiguration = bridge.connectConfiguration({
    getConfiguration: async signal => unwrap(await ctx.remote.openbknConfiguration.getConfiguration(signal)),
    saveConfiguration: async (input, signal) => unwrap(await ctx.remote.openbknConfiguration.saveConfiguration(input, signal)),
  })
  ctx.effect(() => disconnectConfiguration, 'openbkn panel configuration connection')
  const controller = new DiagnosticsPanelController({
    getReport: async signal => unwrap(await ctx.remote.openbknDiagnostics.getReport(signal)),
  })
  const inject = () => ({
    hooks: { ui: panel as HostObservable<ReturnType<typeof panel.getSnapshot>> },
    open: () => panel.open(),
    close: () => panel.close(),
    refresh: () => panel.refresh(),
    beginLogin: () => panel.beginLogin(),
    showSettings: () => panel.showSettings(),
    saveConfiguration: (input: import('../types.ts').OpenBknConfigurationInput) => panel.saveConfiguration(input),
    openNetwork: (networkId: string, mode: NetworkSessionMode) => panel.openNetwork(networkId, mode),
    openDiagnostics: () => {
      panel.close()
      controller.open()
    },
  })
  ctx.effect(() => () => { panel.close(); controller.close() }, 'openbkn panel lifecycle')
  ctx.slots.inject('sidebar.footer.action', () => ctx.slots.register({
    name: 'sidebar.footer.action', id: 'openbkn-business-context', order: 100, inject,
  }, OpenBknEntry))
  ctx.slots.inject('shell.overlay', () => ctx.slots.register({
    name: 'shell.overlay', id: 'openbkn-business-context', order: 100, inject,
  }, OpenBknOverlay))
  ctx.slots.inject('shell.overlay', () => ctx.slots.register({
    name: 'shell.overlay', id: 'openbkn-business-context-diagnostics', order: 120,
    inject: () => ({
      hooks: { diagnostics: controller },
      open: () => controller.open(),
      close: () => controller.close(),
      refresh: () => controller.refresh(),
    }),
  }, OpenBknDiagnostics))
}

/** Register only additive DSH slots; native navigation and conversation surfaces remain untouched. */
function registerSlots(ctx: Context, panel: OpenBknPanelBridge): void {
  const provenanceOverlay = new ProvenanceOverlayController()
  const provenanceControllers = new Map<SessionId, TurnProvenanceController>()
  const suggestionControllers = new Map<SessionId, SuggestionDockController>()
  const observedSuggestionSessions = new Set<SessionId>()
  const bindingControllers = new Map<SessionId, BoundNetworkController>()
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
  const suggestionsControllersLoad = (sessionId: SessionId): void => {
    suggestionControllers.get(sessionId)?.load()
  }
  const port = remotePort(ctx)
  const disconnect = panel.connect(
    port,
    createNetworkSessionOpener(ctx, port),
    sessionId => {
      bindingControllers.get(sessionId as SessionId)?.load()
      suggestionsControllersLoad(sessionId as SessionId)
    },
  )
  ctx.effect(() => disconnect, 'openbkn panel business connection')
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
      bindingControllers.set(sessionId, binding)
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
      observeSuggestionLifecycle(ctx, actx, sessionId, suggestions, observedSuggestionSessions)
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

/** Subscribe inside the native session scope; no polling and no replacement conversation surface. */
function observeSuggestionLifecycle(
  ctx: Context,
  actx: Context,
  sessionId: SessionId,
  suggestions: SuggestionDockController,
  observed: Set<SessionId>,
): void {
  if (observed.has(sessionId)) return
  const binding = ctx.sessions.binding(sessionId)
  if (binding === undefined) return
  observed.add(sessionId)
  actx.effect(() => {
    const unsubscribe = binding.eventSource.subscribe(() => {
      const change = binding.eventSource.getSnapshot().change
      if (change.kind !== 'append') return
      synchronizeSuggestionDockForEvents(suggestions, change.entries.map((entry: { readonly event: { readonly type: string } }) => entry.event))
    })
    return () => {
      observed.delete(sessionId)
      unsubscribe()
    }
  }, 'openbkn empty-session entry dock')
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
    beginLogin: async signal => unwrap(await remote.beginLogin(signal)),
    configureToken: async (token, signal) => unwrap(await remote.configureToken(token, signal)),
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
  return async (network: import('../types.ts').BusinessNetworkSummary, mode: NetworkSessionMode, signal?: AbortSignal): Promise<SessionId> => {
    signal?.throwIfAborted()
    let workspace: WorkspaceView
    if (network.workspacePath === undefined) {
      if (mode !== 'create-workspace') throw new Error('This OpenBKN business knowledge network has no associated local workspace.')
      let path: string | null
      try {
        path = await uiWorkspace.pickDirectory()
      } catch (error: unknown) {
        throw directoryPickerFailure(error)
      }
      signal?.throwIfAborted()
      if (path === null) throw workspaceSelectionCancelled()
      workspace = await workspaces.create({ path })
      signal?.throwIfAborted()
      await port.bindNetworkWorkspace(network.id, workspace.path, signal)
    } else {
      workspace = workspaces.list.getSnapshot().items.find(item => item.path === network.workspacePath)
        ?? await workspaces.create({ path: network.workspacePath })
    }

    signal?.throwIfAborted()
    const sessionId = mode === 'continue' ? latestWorkspaceSession(workspace, sessions) ?? await sessions.create({ workspaceId: workspace.workspaceId })
      : await sessions.create({ workspaceId: workspace.workspaceId })
    signal?.throwIfAborted()
    uiWorkspace.openSession(sessionId)
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
