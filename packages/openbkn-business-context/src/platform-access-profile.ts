/** Profile-owned, non-secret platform identity. OAuth tokens remain in the CLI store. */
import { Service, type Context } from '@deepseek-ai/cordis'
import { defineDomain, domainTable, type KvTable } from '@deepseek-ai/dsh-storage-domain'
import { z } from 'zod'

const recordSchema = z.object({
  generation: z.string().uuid(), origin: z.string().url(), fingerprint256: z.string(),
  spki: z.string(), pem: z.string().max(64 * 1024), remoteAddress: z.string().max(128),
  authorized: z.boolean(),
  reauthorize: z.boolean().optional(),
})
export type PlatformAccessRecord = z.infer<typeof recordSchema>
export interface PlatformAccessStore {
  get(): PlatformAccessRecord | undefined
  put(record: PlatformAccessRecord): Promise<void>
}
const domainSpec = defineDomain({ name: 'openbkn_platform_access', version: 1,
  tables: { identity: domainTable<string, PlatformAccessRecord>(recordSchema) } })

declare module '@deepseek-ai/cordis' {
  interface Context { openbknPlatformAccessProfile: OpenBknPlatformAccessProfile }
}
export class OpenBknPlatformAccessProfile extends Service implements PlatformAccessStore {
  static inject = ['storageDomain']
  private table?: KvTable<string, PlatformAccessRecord>
  constructor(ctx: Context) { super(ctx, 'openbknPlatformAccessProfile') }
  protected async [Service.init](): Promise<void> {
    const domain = await this.ctx.storageDomain.open(domainSpec)
    this.ctx.effect(() => () => domain.close(), 'OpenBKN platform identity domain')
    this.table = domain.table('identity')
  }
  get(): PlatformAccessRecord | undefined { return this.table!.get('active') }
  async put(record: PlatformAccessRecord): Promise<void> { await this.table!.put('active', record) }
}
