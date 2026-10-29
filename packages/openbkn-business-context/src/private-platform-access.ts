import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { observePlatform, platformPinFetch, samePlatformPin, type PlatformPin } from './platform-pin.js'
import type { PlatformAccessRecord, PlatformAccessStore } from './platform-access-profile.js'
import { PlatformConnectionError } from './platform-trust.js'

/** One existing profile store and one owner lifetime, without changing Host configuration. */
export class PrivatePlatformAccess {
  private checking?: Promise<PlatformAccessRecord>
  private selected?: PlatformAccessRecord
  private connection?: ReturnType<typeof platformPinFetch>
  private disposed = false
  private readonly lifetime = new AbortController()
  constructor(private readonly baseUrl: string, private readonly store: PlatformAccessStore, private readonly root: string,
    private readonly observe: typeof observePlatform = observePlatform) {}

  async inspect(signal?: AbortSignal): Promise<PlatformAccessRecord> {
    if (this.disposed) throw new PlatformConnectionError('TRUST_SCOPE_MISMATCH')
    signal?.throwIfAborted()
    if (!this.checking) this.checking = this.check(this.lifetime.signal).finally(() => { this.checking = undefined })
    const record = await this.checking
    signal?.throwIfAborted()
    return record
  }
  private async check(signal?: AbortSignal): Promise<PlatformAccessRecord> {
    const peer = await this.observe(this.baseUrl, signal)
    signal?.throwIfAborted()
    if (this.disposed) throw new PlatformConnectionError('TRUST_SCOPE_MISMATCH')
    let record = this.store.get()
    if (!record || !samePlatformPin(record, peer)) {
      record = { ...peer, generation: randomUUID(), authorized: false, reauthorize: record !== undefined }
      await this.store.put(record)
    }
    if (this.disposed) throw new PlatformConnectionError('TRUST_SCOPE_MISMATCH')
    if (this.selected?.generation !== record.generation) {
      await this.connection?.dispose()
      this.connection = platformPinFetch(record)
    }
    this.selected = record
    return record
  }
  async requireAuthorization(signal?: AbortSignal): Promise<PlatformAccessRecord> {
    const record = await this.inspect(signal)
    if (!record.authorized) throw new PlatformConnectionError('PLATFORM_REAUTHORIZATION_REQUIRED')
    return record
  }
  async authorize(generation: string, signal?: AbortSignal): Promise<void> {
    const record = await this.inspect(signal)
    if (record.generation !== generation) throw new PlatformConnectionError('PLATFORM_IDENTITY_CHANGED')
    const next = { ...record, authorized: true }
    signal?.throwIfAborted()
    await this.store.put(next); this.selected = next
  }
  async cliSettings(login: boolean, signal?: AbortSignal): Promise<{ record: PlatformAccessRecord; directory: string; pinFile: string }> {
    const record = login ? await this.inspect(signal) : await this.requireAuthorization(signal)
    const directory = join(this.root, record.generation)
    await mkdir(directory, { recursive: true, mode: 0o700 })
    const pinFile = join(directory, 'platform-pin.json')
    await writeFile(pinFile, JSON.stringify(record), { mode: 0o600 })
    return { record, directory, pinFile }
  }
  // The marker requests the already-reviewed connection-scoped MCP fetch capability.
  get certificate(): PlatformPin | { automaticPrivateTrust: true } { return this.selected ?? { automaticPrivateTrust: true } }
  readonly fetch: typeof fetch = async (input, init) => {
    await this.requireAuthorization(init?.signal ?? undefined)
    return await this.connection!.fetch(input, init)
  }
  async dispose(): Promise<void> { this.disposed = true; this.lifetime.abort(); await this.connection?.dispose() }
}
