import { createHash, randomUUID } from 'node:crypto'
import { isAbsolute } from 'node:path'
import { defineTool, type ToolExecution, type ToolExecutionResult } from '@deepseek-ai/dsh-tools'
import type { Agent } from '@deepseek-ai/dsh-agent'
import type { BusinessNetworkBinding } from './types.js'

export const CSV_EXPORT_TOOL = 'openbkn_export_csv'
export const MAX_CSV_BYTES = 512 * 1024
const RUN_CODE = 'mcp__openbkn__run_code'

interface Identity { readonly conversationId: string; readonly interactionId: string }
interface WorkingDirectory { ensure(agent: Agent, signal?: AbortSignal): Promise<string> }
interface ExportArgs { readonly kn_id: string; readonly path: string; readonly bkn_context: { readonly conversation_id: string; readonly interaction_id: string } }
interface Target { readonly displayPath: string }
interface FilePolicy { readonly mode: 'read-only' | 'workspace-write' | 'danger-full-access'; readonly workspaceRoot: string; readonly sessionId?: string }

/** Native Host filesystem ports; no Node filesystem bypass or caller-chosen destination. */
export interface CsvExportHost {
  readonly workingDirectory: WorkingDirectory
  readonly sandboxPolicy: { resolve(request: { session: Agent['session'] }): FilePolicy }
  readonly fs: {
    resolve(path: string, options?: { cwd?: string; signal?: AbortSignal }): Promise<Target>
    contains(parent: Target, child: Target): boolean
    processPath(target: Target): string
    writeText(target: Target, text: string, expected: { kind: 'createIfAbsent' }, signal: AbortSignal, policy: FilePolicy): Promise<unknown>
    readBytes(target: Target, signal: AbortSignal, maxBytes: number): Promise<Uint8Array>
  }
  readonly tools: {
    get(name: string, agent?: object): unknown
    execute(input: { callId: ToolExecution['callId']; rootCallId?: ToolExecution['rootCallId']; parent?: ToolExecution['token']; name: string; arguments: unknown; agent: Agent; signal: AbortSignal }): Promise<ToolExecutionResult>
  }
}

/** An optional native service is absent on unsupported presets; never fall back to local Node I/O. */
export function csvExportHost(context: unknown, currentDirectory: () => WorkingDirectory | undefined = () => undefined): CsvExportHost | undefined {
  const host = context as Partial<CsvExportHost>
  if (!(host.fs?.resolve !== undefined
    && host.sandboxPolicy?.resolve !== undefined
    && host.fs.contains !== undefined && host.fs.processPath !== undefined
    && host.fs.writeText !== undefined && host.fs.readBytes !== undefined
    && host.tools?.execute !== undefined)) return undefined
  return {
    fs: host.fs, sandboxPolicy: host.sandboxPolicy, tools: host.tools,
    workingDirectory: { async ensure(agent, signal) {
      // 0.2.1 owns the current directory in its native service; 0.2.0 owns it
      // in the immutable Session header (the same contract as its file tools).
      // Never substitute the server process cwd or a caller-selected path.
      const service = currentDirectory()
      if (service !== undefined) return await service.ensure(agent, signal)
      const cwd = agent.session.header?.cwd
      if (typeof cwd !== 'string' || !isAbsolute(cwd)) throw new Error('This Session has no absolute native workspace directory for CSV delivery.')
      return cwd
    } },
  }
}

export function validateCsvPath(value: string): string {
  if (value.length === 0 || value.length > 512 || /[\\\x00-\x1f\x7f:"#?<>|]/u.test(value)
    || value.startsWith('/') || value.split('/').some(part => part === '' || part === '.' || part === '..')
    || Buffer.byteLength(value.split('/').at(-1)!, 'utf8') > 120
    || !value.endsWith('.csv')) throw new Error('Export requires a relative .csv path inside the current platform conversation directory (filename at most 120 UTF-8 bytes).')
  return value
}

/**
 * Read bytes through the already-managed platform executor. Descriptor walking
 * refuses symlinks and special files, even when a model-created path races the
 * read. No session enumeration, credentials, raw HTTP, or business calculation.
 */
export function csvReadCode(path: string, conversationId: string): string {
  validateCsvPath(path)
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(conversationId)) throw new Error('CSV export requires a platform conversation identity.')
  return `import os, stat, json, base64, hashlib
from pathlib import Path
_path = ${JSON.stringify(path)}
if Path.cwd().resolve().name != ${JSON.stringify('conv-' + conversationId)}:
    raise ValueError("CSV export workspace does not match the current conversation")
_fd = os.open(".", os.O_RDONLY | os.O_DIRECTORY)
try:
    _parts = _path.split("/")
    for _part in _parts[:-1]:
        _next = os.open(_part, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW, dir_fd=_fd)
        os.close(_fd)
        _fd = _next
    _file = os.open(_parts[-1], os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK, dir_fd=_fd)
    try:
        _before = os.fstat(_file)
        if not stat.S_ISREG(_before.st_mode) or _before.st_size > ${MAX_CSV_BYTES}:
            raise ValueError("CSV export requires a regular file within the size limit")
        with os.fdopen(_file, "rb", closefd=False) as _stream:
            _data = _stream.read(${MAX_CSV_BYTES + 1})
        _after = os.fstat(_file)
        if len(_data) > ${MAX_CSV_BYTES} or (_before.st_size, _before.st_mtime_ns) != (_after.st_size, _after.st_mtime_ns):
            raise ValueError("CSV export source changed or exceeds the size limit")
        _data.decode("utf-8")
        print(json.dumps({"schema":"openbkn.csv.v1", "path":_path, "size":len(_data), "sha256":hashlib.sha256(_data).hexdigest(), "data_base64":base64.b64encode(_data).decode("ascii")}))
    finally:
        os.close(_file)
finally:
    os.close(_fd)
`
}

function record(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : undefined
}

/** Prefer the canonical MCP value: the Host may abbreviate only its rendered text. */
function executorBody(result: ToolExecutionResult): Record<string, unknown> {
  if (result.isError === true) throw new Error('Platform CSV retrieval failed; no local file was delivered.')
  const value = record(result.value)
  const structured = record(value?.structuredContent)
  const canonical = record(structured?.value)
  if (canonical !== undefined) return canonical
  for (const block of (Array.isArray(value?.content) ? value.content : result.content)) {
    const text = record(block)?.text
    if (typeof text !== 'string' || text.length > MAX_CSV_BYTES * 2) continue
    try { const parsed = record(JSON.parse(text)); if (parsed !== undefined) return parsed } catch { /* other MCP content */ }
  }
  throw new Error('Platform CSV retrieval returned no complete executor result.')
}

export function decodeCsvResult(result: ToolExecutionResult, path: string): { bytes: Buffer; sha256: string } {
  const body = executorBody(result)
  if (body.exit_code !== 0 || typeof body.stdout !== 'string' || body.stdout.length > MAX_CSV_BYTES * 2) {
    throw new Error('Platform CSV retrieval failed or exceeded the transfer limit; no local file was delivered.')
  }
  let manifest: Record<string, unknown> | undefined
  try { manifest = record(JSON.parse(body.stdout)) } catch { /* fail closed without echoing stdout */ }
  if (manifest?.schema !== 'openbkn.csv.v1' || manifest.path !== path || typeof manifest.data_base64 !== 'string'
    || !Number.isSafeInteger(manifest.size) || (manifest.size as number) < 0 || (manifest.size as number) > MAX_CSV_BYTES
    || typeof manifest.sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(manifest.sha256)) throw new Error('Invalid platform CSV manifest.')
  const bytes = Buffer.from(manifest.data_base64, 'base64')
  const sha256 = createHash('sha256').update(bytes).digest('hex')
  if (bytes.length > MAX_CSV_BYTES || bytes.length !== manifest.size || sha256 !== manifest.sha256
    || bytes.toString('base64') !== manifest.data_base64
    || !Buffer.from(bytes.toString('utf8'), 'utf8').equals(bytes) || bytes.includes(0)) throw new Error('CSV content failed size, UTF-8, or digest verification.')
  return { bytes, sha256 }
}

/** Only a model-invoked, scoped delivery operation; it never edits an answer. */
export function createCsvExportTool(host: CsvExportHost, binding: BusinessNetworkBinding, owner: Agent, activeIdentity: () => Identity | undefined) {
  return defineTool({
    name: CSV_EXPORT_TOOL,
    description: 'Export an existing UTF-8 CSV from the current OpenBKN platform conversation to a new file in this DSH Session workspace, preserving its exact bytes. Call after creating the remote CSV and before finishing the Interaction. No arbitrary local read, destination, URL, or remote session selection. Maximum 512 KiB. After success, copy markdown_link into the final answer after finish; earlier progress messages may be collapsed.',
    parameters: {
      kn_id: { type: 'string', required: true, description: 'The bound knowledge network.' },
      path: { type: 'string', required: true, description: 'Existing .csv path relative to the current platform conversation working directory.' },
      bkn_context: { type: 'object', required: true, additionalProperties: false, properties: {
        conversation_id: { type: 'string', required: true }, interaction_id: { type: 'string', required: true },
      } },
    },
    output: {
      schema: { type: 'object', additionalProperties: false, properties: { path: { type: 'string', required: true }, markdown_link: { type: 'string', required: true }, bytes: { type: 'integer', required: true }, sha256: { type: 'string', required: true }, source_path: { type: 'string', required: true } } },
      render: (_args, value) => [{ type: 'text', text: JSON.stringify(value) }],
    },
    async execute(args: ExportArgs, exec) {
      const assertIdentity = (): Identity => {
        const identity = activeIdentity()
        if (identity === undefined || exec.agent !== owner || args.kn_id !== binding.knowledgeNetworkId
          || args.bkn_context.conversation_id !== identity.conversationId || args.bkn_context.interaction_id !== identity.interactionId) {
          throw new Error('CSV export requires this Session\'s open Interaction and bound network.')
        }
        return identity
      }
      const identity = assertIdentity()
      const path = validateCsvPath(args.path)
      if (host.sandboxPolicy.resolve({ session: exec.agent!.session }).mode === 'read-only') throw new Error('CSV export requires workspace write access; the Session is read-only.')
      if (host.tools.get(RUN_CODE, exec.agent) === undefined) throw new Error('This platform does not offer the managed CSV transfer route.')
      exec.signal.throwIfAborted()
      const result = await host.tools.execute({ name: RUN_CODE, callId: `${exec.callId}:csv-transfer` as ToolExecution['callId'], rootCallId: exec.rootCallId ?? exec.callId, parent: exec.token,
        arguments: { code: csvReadCode(path, identity.conversationId), bkn_context: args.bkn_context }, agent: exec.agent!, signal: exec.signal })
      const { bytes, sha256 } = decodeCsvResult(result, path)
      assertIdentity()
      const cwd = await host.workingDirectory.ensure(exec.agent!, exec.signal)
      const parent = await host.fs.resolve(cwd, { signal: exec.signal })
      const filename = 'openbkn-' + randomUUID() + '-' + path.split('/').at(-1)!
      const target = await host.fs.resolve(filename, { cwd, signal: exec.signal })
      if (!host.fs.contains(parent, target)) throw new Error('CSV destination is outside this Session workspace.')
      const policy = host.sandboxPolicy.resolve({ session: exec.agent!.session })
      if (policy.mode === 'read-only') throw new Error('CSV export requires workspace write access; the Session is read-only.')
      if (policy.mode === 'workspace-write' && !host.fs.contains(await host.fs.resolve(policy.workspaceRoot, { signal: exec.signal }), target)) {
        throw new Error('CSV destination is outside the Session write boundary.')
      }
      assertIdentity()
      exec.signal.throwIfAborted()
      await host.fs.writeText(target, bytes.toString('utf8'), { kind: 'createIfAbsent' }, exec.signal, policy)
      const saved = await host.fs.readBytes(target, exec.signal, MAX_CSV_BYTES)
      if (!Buffer.from(saved).equals(bytes)) throw new Error('Saved CSV verification failed; no successful delivery is claimed.')
      exec.signal.throwIfAborted()
      const deliveredPath = host.fs.processPath(target)
      // Both supported Hosts decode Markdown file destinations before opening.
      // A workspace-relative destination avoids asking the model to transcribe
      // machine-specific directory prefixes; the Host resolves it in this Session.
      const destination = encodeURIComponent(filename).replace(/[()]/gu, value => '%' + value.charCodeAt(0).toString(16).toUpperCase())
      return { path: deliveredPath, markdown_link: `[CSV](<${destination}>)`, bytes: bytes.length, sha256, source_path: path }
    },
  })
}
