/**
 * Compare a final answer with detail actually returned by this turn's tools.
 * This checks transcription, not the correctness of the platform calculation.
 * Unsupported result formats are not promoted to verified business data.
 */
export interface FidelityEvent {
  readonly type: string
  readonly data: unknown
}

export interface DetailRow {
  readonly level: string
  readonly parent: string
  readonly child: string
  readonly name: string
  readonly usage: string
  readonly stock: string
  readonly unit: string
}

export interface AnswerFidelityIssue {
  readonly code: 'detail-mismatch' | 'source-name-mismatch' | 'detail-count-mismatch' | 'tool-detail-incomplete' | 'detail-handoff-conflict' | 'inventory-scope-mismatch' | 'inventory-semantics-mismatch'
  readonly reason: string
  readonly correction: string
}

const MAX_TEXT_CHARS = 1_000_000
const MAX_DETAIL_ROWS = 10_000
const DETAIL_KEYS = ['level', 'parent', 'child', 'name', 'usage', 'stock', 'unit'] as const
type DetailKey = typeof DETAIL_KEYS[number]
type Columns = Partial<Record<DetailKey, number>>

const aliases: Record<DetailKey, readonly string[]> = {
  level: ['level', 'bom_level', '层级', '层'],
  parent: ['parent', 'parent_code', 'parent_material_code', '父件', '父件编码', '父料'],
  child: ['child', 'child_code', 'material_code', '子件', '子件编码', '子料', '子料编码'],
  name: ['child_name', 'material_name', '子件名称', '物料名称', '名称'],
  usage: ['std_usage', 'standard_usage', '单耗', '标准用量', '用量', '使用量'],
  stock: ['available_qty', 'available_inventory', 'available_inventory_qty', '可用量', '可用库存', '库存', '库存数量'],
  unit: ['uom', 'inventory_uom', '单位', '库存单位'],
}

function record(value: unknown): Record<string, unknown> | undefined {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : undefined
}

function textOf(content: unknown): string {
  if (!Array.isArray(content)) return ''
  return content.flatMap(block => {
    const row = record(block)
    return row?.type === 'text' && typeof row.text === 'string' ? [row.text] : []
  }).join('\n')
}

function cell(value: string): string {
  return value.trim().replace(/^\*\*(.*)\*\*$/, '$1').replace(/^`(.*)`$/, '$1')
    .replace(/\\\|/g, '|').replace(/\\\\/g, '\\')
}

/** Exact decimal normalization without a floating-point round trip. */
function quantity(value: string): string | undefined {
  const match = /^(-?)(\d+)(?:\.(\d+))?(\*)?$/.exec(cell(value).replace(/,/g, ''))
  if (match === null) return undefined
  const integer = match[2]!.replace(/^0+(?=\d)/, '')
  const fraction = (match[3] ?? '').replace(/0+$/, '')
  const negative = match[1] === '-' && (integer !== '0' || fraction.length > 0) ? '-' : ''
  return `${negative}${integer}${fraction.length === 0 ? '' : `.${fraction}`}${match[4] ?? ''}`
}

function stockQuantity(value: string): string | undefined {
  // A successful live handoff can explicitly state that the scoped query
  // returned no stock row. Keep that absence distinct from measured zero;
  // unknown/missing quantities and nonnumeric usage are never inferred.
  const cleaned = cell(value)
  if (['无合格库存行', '无库存行', '无库存记录', '无记录', 'no_row'].includes(cleaned.toLowerCase())) return '0*'
  return quantity(cleaned)
}

function unit(value: string): string {
  const cleaned = cell(value)
  return ['?', '—', '-', '未知', '未提供'].includes(cleaned) ? '?' : cleaned
}

/** Read explicit columns/level headings only; never infer levels from IDs. */
export function detailRowsOf(text: string): readonly DetailRow[] {
  return parseDetail(text).rows
}

function parseDetail(text: string): { readonly rows: readonly DetailRow[]; readonly malformed: boolean; readonly hasColumns: boolean } {
  if (text.length > MAX_TEXT_CHARS) return { rows: [], malformed: true, hasColumns: false }
  let columns: Columns | undefined
  let heading: string | undefined
  let malformed = false
  let hasColumns = false
  const result: DetailRow[] = []
  const lines = text.split('\n')
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const raw = lines[lineIndex]!
    const line = raw.trim()
    if (/^#{1,6}\s/.test(line)) {
      heading = /^#{1,6}\s+第\s*(\d+)\s*层(?:\s|（|\(|$)/.exec(line)?.[1]
      columns = undefined
    }
    if (!line.includes('|')) continue
    const parts = line.split(/(?<!\\)\|/)
    if (line.startsWith('|')) parts.shift()
    if (line.endsWith('|')) parts.pop()
    const values = parts.map(cell)
    const candidate: Columns = {}
    for (const key of DETAIL_KEYS) {
      const index = values.findIndex(value => aliases[key].includes(value.toLowerCase()))
      if (index >= 0) candidate[key] = index
    }
    if (candidate.parent !== undefined && candidate.child !== undefined) {
      columns = DETAIL_KEYS.every(key => key === 'level' && heading !== undefined || candidate[key] !== undefined) ? candidate : undefined
      if (columns !== undefined) hasColumns = true
      continue
    }
    // A separate summary table must not inherit detail columns. Its Markdown
    // separator explicitly identifies a new header even without a heading.
    if (/^\s*\|?\s*:?-{3,}:?\s*\|/.test(lines[lineIndex + 1] ?? '')) {
      columns = undefined
      continue
    }
    if (columns === undefined || values.every(value => /^:?-+:?$/.test(value))) continue
    if (values.length <= Math.max(...Object.values(columns))) {
      if (line.startsWith('|')) malformed = true
      continue
    }
    const level = columns.level === undefined ? heading : values[columns.level]?.replace(/^L/i, '')
    const usage = quantity(values[columns.usage!] ?? '')
    const stock = stockQuantity(values[columns.stock!] ?? '')
    if (level === undefined || !/^\d+$/.test(level) || usage === undefined || stock === undefined) {
      if (line.startsWith('|')) malformed = true
      continue
    }
    result.push({
      level: String(Number(level)), parent: values[columns.parent!]!, child: values[columns.child!]!,
      name: values[columns.name!]!, usage, stock, unit: unit(values[columns.unit!]!),
    })
    if (result.length > MAX_DETAIL_ROWS) return { rows: [], malformed: true, hasColumns }
  }
  return { rows: result, malformed, hasColumns }
}

function markdownCell(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\|/g, '\\|').replace(/[\r\n]/g, ' ')
}

/** A deterministic transcription of the observed rows, including repetitions. */
export function renderDetail(rows: readonly DetailRow[]): string {
  const counts = new Map<string, number>()
  for (const row of rows) counts.set(row.level, (counts.get(row.level) ?? 0) + 1)
  return [
    `明细共 ${rows.length} 行；层级行数：${[...counts].map(([level, count]) => `L${level}: ${count}`).join('，')}。`,
    '| 层级 | 父件 | 子件编码 | 子件名称 | 单耗 | 可用库存 | 库存单位 |',
    '|---|---|---|---|---|---|---|',
    ...rows.map(row => `| ${DETAIL_KEYS.map(key => markdownCell(row[key])).join(' | ')} |`),
    ...(rows.some(row => row.stock.endsWith('*')) ? ['* 表示本次查询范围内未查到该物料的库存行，不能据此断言范围外实际库存为零。'] : []),
    ...(rows.some(row => row.unit === '?') ? ['? 表示库存单位未提供。'] : []),
  ].join('\n')
}

function signature(row: DetailRow): string {
  return JSON.stringify(DETAIL_KEYS.map(key => row[key]))
}

function multiset(rows: readonly DetailRow[]): Map<string, number> {
  const result = new Map<string, number>()
  for (const row of rows) result.set(signature(row), (result.get(signature(row)) ?? 0) + 1)
  return result
}

function sameRows(expected: readonly DetailRow[], actual: readonly DetailRow[], complete: boolean): boolean {
  if (complete && expected.length !== actual.length) return false
  const a = multiset(expected), b = multiset(actual)
  return complete
    ? a.size === b.size && [...a].every(([key, count]) => b.get(key) === count)
    : [...b].every(([key, count]) => count <= (a.get(key) ?? 0))
}

function sourceNames(text: string): readonly string[] {
  const names = new Set<string>()
  const collect = (value: unknown, depth: number): void => {
    if (depth > 8) return
    if (Array.isArray(value)) {
      for (const child of value) collect(child, depth + 1)
      return
    }
    const object = record(value)
    if (object === undefined) return
    const source = record(object.data_source)
    if (typeof source?.name === 'string') names.add(source.name)
    for (const child of Object.values(object)) collect(child, depth + 1)
  }
  try { collect(JSON.parse(text), 0) } catch { /* Context Loader may render TOON. */ }
  const lines = text.split('\n')
  for (let i = 0; i < lines.length; i++) {
    const match = /^(\s*)data_source:\s*$/.exec(lines[i]!)
    if (match === null) continue
    const indent = match[1]!.length
    for (let j = i + 1; j < lines.length; j++) {
      const line = lines[j]!
      if (line.trim().length === 0) continue
      if (line.length - line.trimStart().length <= indent) break
      const name = /^\s+name:\s*(.+)$/.exec(line)?.[1]?.trim()
      if (name !== undefined) {
        try { names.add(JSON.parse(name) as string) } catch { names.add(name) }
      }
    }
  }
  // Physical source names only. No namespace is manufactured from a kn_id.
  return [...names].filter(name => typeof name === 'string' && /^[\w]+(?:\.[\w]+)+$/.test(name))
}

function stdoutOf(text: string): string {
  try {
    const envelope = record(JSON.parse(text))
    if (typeof envelope?.stdout === 'string') return envelope.exit_code === 0 ? envelope.stdout : ''
  } catch { /* Unsupported run_code envelopes are not authoritative. */ }
  return ''
}

function fullDetailRequested(question: string): boolean {
  return /(?:完整|全部|每个|逐项|清单|\b(?:full|complete|every|all)\b).{0,40}(?:BOM|明细|物料|material|detail)|(?:BOM|物料|material).{0,80}(?:清单|每个|全部|完整|\b(?:every|all)\b)/i.test(question)
}

/** Audit disclosed fallback metadata; never infer absence from a zero sum. */
function inventoryScopeIssue(detail: string): AnswerFidelityIssue | undefined {
  if (!/^INVENTORY_FALLBACK:\s*scoped-stock-rows\s*$/m.test(detail)) return undefined
  const header = /^level\|parent\|child_code\|child_name\|std_usage\|available_qty\|uom\|scoped_stock_rows\s*$/m.exec(detail)
  const rows = parseDetail(detail).rows
  const total = /^DETAIL_ROWS:\s*(\d+)\s*$/m.exec(detail)?.[1]
  const emitted = /^EMITTED:\s*(\d+)\s*$/m.exec(detail)?.[1]
  let valid = header !== null && rows.length > 0 && Number(total) === rows.length && Number(emitted) === rows.length
  if (header !== null) {
    const lines = detail.slice(header.index + header[0].length).trimStart().split('\n')
    const counts = new Map<string, string>()
    for (let i = 0; i < rows.length; i++) {
      const parts = lines[i]?.trim().split(/(?<!\\)\|/) ?? []
      const count = parts[7]?.trim() ?? ''
      const row = rows[i]!
      if (parts.length !== 8 || !/^\d+$/.test(count) || !Number.isSafeInteger(Number(count))
        || (counts.has(row.child) && counts.get(row.child) !== String(Number(count)))
        || (Number(count) === 0 ? row.stock !== '0*' || row.unit !== '?' : row.stock.endsWith('*'))) valid = false
      counts.set(row.child, String(Number(count)))
    }
  }
  return valid ? undefined : {
    code: 'inventory-scope-mismatch',
    reason: 'The complete inventory fallback has missing or inconsistent scoped_stock_rows evidence. Global record existence does not establish eligible stock rows.',
    correction: 'Before bkn_finish_interaction, rebuild only the handoff from the already retrieved cached inventory records in this same Interaction. Filter by the verified warehouse and stock_status rules before grouping. For each material, count those eligible rows separately from their available-stock sum: count 0 requires 0* and ?, while a positive count requires the measured quantity, including plain 0. Print INVENTORY_FALLBACK: scoped-stock-rows, DETAIL_ROWS, the literal header level|parent|child_code|child_name|std_usage|available_qty|uom|scoped_stock_rows, every row, and EMITTED. Reuse cached records only; do not repeat business queries, change scope or start another Interaction. Do not invent counts. If the cached records or scope cannot be recovered, finish as failed. Preserve the original failed output; a separately audited repair can supply the authoritative handoff.',
  }
}

function reservationAlreadyDeducted(text: string): boolean {
  let found = false
  const visit = (value: unknown, depth: number): void => {
    if (depth > 8) return
    if (Array.isArray(value)) { for (const child of value) visit(child, depth + 1); return }
    const object = record(value)
    if (object === undefined) return
    if (object.name === 'available_inventory_qty' && typeof object.comment === 'string'
      && /可用库存数量\s*=\s*库存数量\s*[-−]\s*预留库存数量/.test(object.comment)) found = true
    for (const child of Object.values(object)) visit(child, depth + 1)
  }
  try { visit(JSON.parse(text), 0) } catch { /* Undisclosed formulas are not inferred. */ }
  return found
}

/** A narrow producer check, while the original Interaction is still open.
 * Never infer the meaning of headerless positional values. One notice may
 * request a labelled reprint of cached rows, without new business retrieval.
 */
export function inspectToolDetailHandoff(events: readonly FidelityEvent[], toolText: string): { readonly turn: number; readonly issue: AnswerFidelityIssue } | undefined {
  let turn: number | undefined
  let question = ''
  for (const event of events) {
    const data = record(event.data)
    if (event.type === 'turn/start' && typeof data?.turn === 'number') { turn = data.turn; question = '' }
    if (event.type === 'turn/end') { turn = undefined; question = '' }
    if (event.type === 'user/message' && turn !== undefined && record(data?.source)?.kind === 'user') question = textOf(data?.content)
  }
  if (turn === undefined || !fullDetailRequested(question) || toolText.length > MAX_TEXT_CHARS) return undefined
  const detail = stdoutOf(toolText)
  const total = /^(?:DETAIL_ROWS|TOTAL_ROWS|BOM_ROWS):\s*(\d+)/m.exec(detail)?.[1]
  const emitted = /^EMITTED:\s*(\d+)/m.exec(detail)?.[1]
  const scopeIssue = inventoryScopeIssue(detail)
  if (scopeIssue !== undefined && total !== undefined && emitted !== undefined && Number(total) > 0 && Number(total) === Number(emitted)) return { turn, issue: scopeIssue }
  // Partial pages, unknown quantities and conflicting headed batches remain
  // governed by the final checker. This check only repairs missing metadata.
  if (total === undefined || emitted === undefined || Number(total) <= 0 || Number(total) !== Number(emitted) || parseDetail(detail).hasColumns) return undefined
  return { turn, issue: {
    code: 'tool-detail-incomplete',
    reason: 'The declared complete tool handoff has no explicit column header; positional values are not authoritative.',
    correction: 'Before bkn_finish_interaction, reprint the previously computed complete rows in this same Interaction with their verified column meanings. Use the literal header level|parent|child_code|child_name|std_usage|available_qty|uom after DETAIL_ROWS and before the rows, then EMITTED. Reuse the saved handoff or existing sandbox data only; do not repeat business queries, capabilities, metrics or start another Interaction. Preserve every original row, quantity, unit and absent-row marker. Never guess a column order. If the original data or column meanings cannot be recovered, finish as failed and disclose the missing handoff.',
  } }
}

/**
 * Inspect only this turn, matching tool calls to successful logged outcomes.
 * The final answer is read-only; a caller may steer a correction or fail closed.
 */
export function inspectAnswerFidelity(events: readonly FidelityEvent[], turn: number): AnswerFidelityIssue | undefined {
  const calls = new Map<string, string>()
  const sources = new Set<string>()
  let expected: readonly DetailRow[] = []
  let sourceCall = ''
  let question = ''
  let answer = ''
  let activeTurn: number | undefined
  let incomplete = false
  let handoffConflict = false
  let invalidScope: AnswerFidelityIssue | undefined
  let reservationDeducted = false
  for (const event of events) {
    const data = record(event.data)
    if (event.type === 'turn/start' && typeof data?.turn === 'number') activeTurn = data.turn
    if (event.type === 'turn/end') activeTurn = undefined
    // Native user/message holds the UserMessage directly, without turn/step.
    if (event.type === 'user/message' && activeTurn === turn && record(data?.source)?.kind === 'user') question = textOf(data?.content)
    if (data?.turn !== turn) continue
    const message = record(data.message)
    if (event.type === 'assistant/message') {
      // A capped/error turn may stop on an intermediate text + tool-call
      // message. It is not a deliverable, and must not leave an older answer
      // selected after a newer pending tool call.
      const pendingTool = Array.isArray(message?.content) && message.content.some(block => record(block)?.type === 'tool-call')
      answer = data.interrupted === true || pendingTool ? '' : textOf(message?.content)
    }
    if (event.type === 'tool/call' && typeof data.callId === 'string' && typeof data.name === 'string') calls.set(data.callId, data.name)
    if (event.type !== 'tool/result' || message?.isError === true || typeof message?.toolCallId !== 'string') continue
    const name = calls.get(message.toolCallId)
    if (name === undefined || !name.startsWith('mcp__openbkn__')) continue
    const text = textOf(message.content)
    if (text.length > MAX_TEXT_CHARS) continue
    if (['mcp__openbkn__get_kn_detail', 'mcp__openbkn__get_object_types'].includes(name)) {
      for (const source of sourceNames(text)) sources.add(source)
      reservationDeducted ||= reservationAlreadyDeducted(text)
    }
    // Lifecycle results can echo model-written answers. They must never
    // replace the successful data handoff with the model's own transcription.
    if (name !== 'mcp__openbkn__run_code') continue
    const detail = stdoutOf(text)
    const parsed = parseDetail(detail)
    const rows = parsed.rows
    // A page or preview must never replace a complete detail. This is an
    // explicit handoff contract, not a guess based on the largest table.
    const total = /^(?:DETAIL_ROWS|TOTAL_ROWS|BOM_ROWS):\s*(\d+)/m.exec(detail)?.[1]
    const emitted = /^EMITTED:\s*(\d+)/m.exec(detail)?.[1]
    const scopeIssue = inventoryScopeIssue(detail)
    if (scopeIssue !== undefined) { invalidScope = scopeIssue; continue }
    if (rows.length > 0 && !parsed.malformed && Number(total) === rows.length && Number(emitted) === rows.length) {
      // An invalid audited candidate is never promoted to authoritative rows.
      // Only a separately valid audited repair can clear its scope failure.
      if (/^INVENTORY_FALLBACK:\s*scoped-stock-rows\s*$/m.test(detail)) invalidScope = undefined
      if (expected.length === 0) { expected = rows; sourceCall = message.toolCallId }
      else if (!sameRows(expected, rows, true)) handoffConflict = true
    } else if (total !== undefined && emitted !== undefined) {
      incomplete = true
    }
  }
  if (answer.length === 0) return undefined
  if (invalidScope !== undefined) return { ...invalidScope, correction: 'The tool inventory scope audit failed. Do not claim a verified complete result or invent a repair after the Interaction has closed. State the unresolved scoped row evidence; a new business query requires a new user turn.' }
  const reservationIssue: AnswerFidelityIssue | undefined = reservationDeducted && /预留未从可用(?:量|库存)中扣除|预留(?:库存)?(?:数量)?未从可用(?:量|库存)(?:数量)?中扣(?:减|除)/.test(answer) ? {
    code: 'inventory-semantics-mismatch', reason: 'The reservation explanation contradicts the explicitly returned available_inventory_qty property comment.',
    correction: 'Correct only the reservation explanation: the disclosed available_inventory_qty field is inventory minus reserved, so reservation is already deducted in that field and must not be deducted again. A capability display-only/P0 rule does not undo the field formula. Preserve every checked detail row and the established scope; do not perform new business retrieval.',
  } : undefined
  if (handoffConflict) return {
    code: 'detail-handoff-conflict', reason: 'Successful tool results claim conflicting complete details in this turn.',
    correction: 'A single complete detail handoff cannot be established: two successful outputs both claim completeness but contain different rows or values. Do not silently select a smaller batch, infer that the largest is correct, or claim completeness. State that complete-detail validation failed. A new, explicitly scoped query is required; do not start another Interaction in this turn.',
  }
  const wrongSources = [...answer.matchAll(/\b\w+(?:\.\w+)+\b/g)].map(match => match[0]).filter(name => {
    if (sources.has(name)) return false
    const suffix = name.slice(name.lastIndexOf('.'))
    return [...sources].some(source => source.endsWith(suffix))
  })
  const sourceIssue: AnswerFidelityIssue | undefined = wrongSources.length === 0 ? undefined : {
      code: 'source-name-mismatch', reason: 'The final physical source name contradicts this turn\'s schema tool result.',
      correction: `Use only the physical source names explicitly returned by schema tools: ${JSON.stringify([...sources])}. The final answer contains an unsupported name: ${JSON.stringify([...new Set(wrongSources)])}. Do not turn kn_id into a database schema. Restate the answer concisely with the disclosed source or only the known object type; do not invent a physical name.`,
  }
  if (expected.length === 0) return sourceIssue ?? reservationIssue ?? (incomplete && fullDetailRequested(question) ? {
    code: 'tool-detail-incomplete', reason: 'The tool\'s declared complete and emitted counts do not match a parseable complete detail.',
    correction: 'The complete detail handoff cannot be verified. State that this answer failed completeness validation; do not claim a preview or malformed table is a complete result.',
  } : undefined)
  const parsedAnswer = parseDetail(answer)
  const actual = parsedAnswer.rows
  const complete = fullDetailRequested(question)
  if (actual.length === 0 && !complete) return sourceIssue ?? reservationIssue
  const rendered = renderDetail(expected)
  const correction = `The final detail must match successful tool call ${JSON.stringify(sourceCall)}. Retain the established scope, inventory caveats and source facts. Copy the tool-data transcription without adding, dropping, regrouping or changing rows. Preserve units and '*' absent-row markers; do not replace them with an assertion of zero stock everywhere.${rendered.length <= 64_000 ? `\n\n${rendered}` : '\nThe complete transcription exceeds the correction-context limit. Refer to that original tool result; do not claim an incomplete answer is complete.'}`
  if (parsedAnswer.malformed || !sameRows(expected, actual, complete)) return {
    code: 'detail-mismatch', reason: `The final detail has ${actual.length} rows; the tool supplied ${expected.length}. Rows, repetitions, levels, quantities and units must all match.`,
    correction: [sourceIssue?.correction, reservationIssue?.correction, correction].filter(Boolean).join('\n\n'),
  }
  const counts = new Map<string, number>()
  for (const row of expected) counts.set(row.level, (counts.get(row.level) ?? 0) + 1)
  for (const match of answer.matchAll(/\bL(\d+)\s*[:：=]\s*(\d+)\b/g)) {
    if (complete && counts.get(match[1]!) !== Number(match[2])) return { code: 'detail-count-mismatch', reason: 'The final level count contradicts its complete tool detail.', correction: [sourceIssue?.correction, reservationIssue?.correction, correction].filter(Boolean).join('\n\n') }
  }
  return sourceIssue ?? reservationIssue
}

export class AnswerFidelityError extends Error {
  readonly code = 'answer-fidelity-failed'
  constructor(issue: AnswerFidelityIssue) {
    super(`OpenBKN answer validation failed after one correction (${issue.code}). The answer is not verified; inspect the tool result before using it.`)
    this.name = 'AnswerFidelityError'
  }
}
