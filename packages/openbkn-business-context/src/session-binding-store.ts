import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { mkdir, open, readdir, rename, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { parseBinding } from './session-binding.js'
import type { BusinessNetworkBinding } from './types.js'

/**
 * One DSH session's immutable OpenBKN binding, kept outside the session log.
 *
 * DSH hosts without a write path for ignorable plugin session events (the
 * official desktop app, stock source builds) refuse to reload a log that holds
 * a plugin-owned event, so the binding lives in one plugin-owned file per
 * session instead. DSH's per-session cross-process write lease means only the
 * host that has the session live ever writes that session's file.
 */
export interface SessionBindingRecord {
  readonly schemaVersion: 1
  readonly sessionId: string
  readonly binding: BusinessNetworkBinding
  /**
   * Session log length when the binding was written. A fork inherits the
   * binding only when its copied prefix reaches this point.
   */
  readonly boundAtSeq: number
  readonly recordedAt: string
}

const SESSION_ID = /^[A-Za-z0-9_-]{1,200}$/

/** File-per-session binding records under one plugin-owned directory. */
export class SessionBindingStore {
  constructor(readonly root: string) {}

  /**
   * Read one session's record synchronously (callers sit on DSH's synchronous
   * turn and guard paths). A missing file is "not bound"; anything unreadable
   * or malformed fails closed with the file path.
   */
  read(sessionId: string): SessionBindingRecord | undefined {
    const path = this.pathFor(sessionId)
    let text: string
    try {
      text = readFileSync(path, 'utf8')
    } catch (error: unknown) {
      if ((error as NodeJS.ErrnoException | null)?.code === 'ENOENT') return undefined
      throw new Error(`OpenBKN session binding ${path} is unreadable`, { cause: error })
    }
    try {
      return parseRecord(JSON.parse(text), sessionId)
    } catch (error: unknown) {
      throw new Error(`OpenBKN session binding ${path} is malformed; move it aside to rebind the session`, { cause: error })
    }
  }

  /**
   * Durably write one record: a synced temporary file renamed over the target,
   * so a crash leaves either the previous state or the complete record.
   * Resolves only after the rename; a rejection means nothing new is readable.
   */
  async write(record: SessionBindingRecord): Promise<void> {
    const target = this.pathFor(record.sessionId)
    await mkdir(this.root, { recursive: true, mode: 0o700 })
    const temporary = `${target}.${process.pid}.${randomUUID()}.tmp`
    const handle = await open(temporary, 'wx', 0o600)
    try {
      await handle.writeFile(`${JSON.stringify(record)}\n`, 'utf8')
      await handle.sync()
    } finally {
      await handle.close()
    }
    try {
      await rename(temporary, target)
    } catch (error: unknown) {
      await rm(temporary, { force: true })
      throw error
    }
  }

  /**
   * Remove records whose session DSH no longer stores. DSH has no session
   * delete verb, so a record only outlives its session when the log was
   * removed outside DSH. Sessions materialize lazily and an unmaterialized
   * one is visible only to the process that created it, so a record is
   * removed only when it is older than `recordedBefore` and `exists` answers
   * false; a malformed record or a failing `exists` is left alone.
   * @returns the session ids whose records were removed.
   */
  async pruneOrphans(exists: (sessionId: string) => Promise<boolean>, recordedBefore: Date): Promise<string[]> {
    let names: string[]
    try {
      names = await readdir(this.root)
    } catch (error: unknown) {
      if ((error as NodeJS.ErrnoException | null)?.code === 'ENOENT') return []
      throw error
    }
    const removed: string[] = []
    for (const name of names) {
      if (!name.endsWith('.json')) continue
      const sessionId = name.slice(0, -'.json'.length)
      if (!SESSION_ID.test(sessionId)) continue
      try {
        const record = this.read(sessionId)
        if (record === undefined || !(Date.parse(record.recordedAt) < recordedBefore.getTime())) continue
        if (await exists(sessionId)) continue
        await rm(this.pathFor(sessionId), { force: true })
        removed.push(sessionId)
      } catch {
        // Unreadable, malformed, or unverifiable: keep the record.
      }
    }
    return removed
  }

  private pathFor(sessionId: string): string {
    if (!SESSION_ID.test(sessionId)) throw new TypeError(`OpenBKN session binding id ${JSON.stringify(sessionId)} is not path-safe`)
    return join(this.root, `${sessionId}.json`)
  }
}

function parseRecord(value: unknown, sessionId: string): SessionBindingRecord {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new TypeError('record is not an object')
  const candidate = value as Record<string, unknown>
  if (candidate.schemaVersion !== 1) throw new TypeError(`unsupported schemaVersion ${String(candidate.schemaVersion)}`)
  if (candidate.sessionId !== sessionId) throw new TypeError('record belongs to a different session')
  const boundAtSeq = candidate.boundAtSeq
  if (typeof boundAtSeq !== 'number' || !Number.isSafeInteger(boundAtSeq) || boundAtSeq < 0) throw new TypeError('boundAtSeq is invalid')
  if (typeof candidate.recordedAt !== 'string') throw new TypeError('recordedAt is missing')
  return {
    schemaVersion: 1,
    sessionId,
    binding: parseBinding(candidate.binding),
    boundAtSeq,
    recordedAt: candidate.recordedAt,
  }
}
