import type { BusinessNetworkSummary } from '../types.ts'
import {
  OpenBknUiController, type OpenBknUiPort, type OpenNetworkSession,
} from './openbkn-ui-controller.ts'

interface BusinessPanelConnection {
  port: OpenBknUiPort
  openNetworkSession: OpenNetworkSession
  refreshBoundSession(sessionId: string): void
}

/** Keeps the panel shell usable before, or without, the business services. */
export class OpenBknPanelBridge {
  private business?: BusinessPanelConnection
  readonly controller = new OpenBknUiController({
    status: async signal => this.connection().port.status(signal),
    beginLogin: async signal => this.connection().port.beginLogin(signal),
    configureToken: async (token, signal) => this.connection().port.configureToken(token, signal),
    listNetworks: async signal => this.connection().port.listNetworks(signal),
    bindNetworkWorkspace: async (id, path, signal) => this.connection().port.bindNetworkWorkspace(id, path, signal),
    bindNetwork: async (sessionId, id, signal) => this.connection().port.bindNetwork(sessionId, id, signal),
  }, (network: BusinessNetworkSummary, mode) => this.connection().openNetworkSession(network, mode),
  sessionId => this.connection().refreshBoundSession(sessionId))

  connect(
    port: OpenBknUiPort,
    openNetworkSession: OpenNetworkSession,
    refreshBoundSession: (sessionId: string) => void,
  ): () => void {
    const business = { port, openNetworkSession, refreshBoundSession }
    this.business = business
    if (this.controller.snapshot().open) this.controller.open()
    return () => {
      if (this.business !== business) return
      this.business = undefined
      if (this.controller.snapshot().open) this.controller.open()
    }
  }

  private connection(): BusinessPanelConnection {
    if (this.business !== undefined) return this.business
    throw Object.assign(new Error('OpenBKN business services are unavailable.'), {
      code: 'openbkn/business-unavailable',
    })
  }
}
