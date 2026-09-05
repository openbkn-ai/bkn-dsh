import { isAbsolute } from 'node:path'
import { Service, type Context } from '@deepseek-ai/cordis'
import { domainTable, defineDomain, type KvTable } from '@deepseek-ai/dsh-storage-domain'
import { z } from 'zod'

declare module '@deepseek-ai/cordis' {
  interface Context {
    /** Durable, non-secret OpenBKN knowledge-network to DSH workspace mapping. */
    openbknWorkspaceBindingRegistry: OpenBknWorkspaceBindingRegistry
  }
}

/** A local DSH workspace chosen for one OpenBKN business knowledge network. */
export const workspaceBindingRecord = z.object({
  platformBaseUrl: z.string().url(),
  knowledgeNetworkId: z.string().trim().min(1),
  workspacePath: z.string().trim().refine(isAbsolute, 'workspacePath must be absolute'),
  updatedAt: z.string().datetime(),
})

export type WorkspaceBindingRecord = z.infer<typeof workspaceBindingRecord>

const workspaceBindingDomain = defineDomain({
  name: 'openbkn_workspace_bindings',
  version: 1,
  tables: { bindings: domainTable<string, WorkspaceBindingRecord>(workspaceBindingRecord) },
})

/** Stable storage key: one configurable OpenBKN platform and network identity. */
export function workspaceBindingKey(platformBaseUrl: string, knowledgeNetworkId: string): string {
  return `${normalizeBaseUrl(platformBaseUrl)}::${knowledgeNetworkId.trim()}`
}

/**
 * Host-owned durable index for the small, non-secret network-to-workspace
 * association. It deliberately stores a path rather than a DSH workspace id:
 * DSH resolves a registered workspace id from the path at each Client run.
 */
export class OpenBknWorkspaceBindingRegistry extends Service {
  static inject = ['storageDomain']
  private table?: KvTable<string, WorkspaceBindingRecord>

  constructor(ctx: Context) {
    super(ctx, 'openbknWorkspaceBindingRegistry')
  }

  protected async [Service.init](): Promise<void> {
    const domain = await this.ctx.storageDomain.open(workspaceBindingDomain)
    this.ctx.effect(() => () => domain.close(), 'openbknWorkspaceBindingRegistry.domainClose')
    this.table = domain.table('bindings')
  }

  get(platformBaseUrl: string, knowledgeNetworkId: string): WorkspaceBindingRecord | undefined {
    return this.requireTable().get(workspaceBindingKey(platformBaseUrl, knowledgeNetworkId))
  }

  async put(input: Omit<WorkspaceBindingRecord, 'updatedAt'>): Promise<WorkspaceBindingRecord> {
    const record = workspaceBindingRecord.parse({ ...input, updatedAt: new Date().toISOString() })
    await this.requireTable().put(workspaceBindingKey(record.platformBaseUrl, record.knowledgeNetworkId), record)
    return record
  }

  private requireTable(): KvTable<string, WorkspaceBindingRecord> {
    if (this.table === undefined) throw new Error('OpenBKN workspace binding registry is not ready.')
    return this.table
  }
}

function normalizeBaseUrl(value: string): string {
  return value.trim().replace(/\/+$/, '')
}
