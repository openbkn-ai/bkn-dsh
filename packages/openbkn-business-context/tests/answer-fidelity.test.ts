import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { AnswerFidelityError, detailRowsOf, inspectAnswerFidelity, renderDetail, type FidelityEvent } from '../src/answer-fidelity.ts'

const HEADER = 'level|parent|child_code|child_name|std_usage|available_qty|uom'
const ROWS = '1|parent-a|shared-child|widget|1.00|12|个\n2|parent-b|shared-child|widget|2|0*|?'

function detail(text = ROWS, count = text.split('\n').length): string {
  return `DETAIL_ROWS: ${count}\n${HEADER}\n${text}\nEMITTED: ${text.split('\n').length}`
}

function events(stdout: string, answer: string, question = '完整 BOM 清单，每个物料的使用量和库存', turn = 1): FidelityEvent[] {
  return [
    { type: 'turn/start', data: { turn } },
    { type: 'user/message', data: { role: 'user', source: { kind: 'user' }, content: [{ type: 'text', text: question }] } },
    { type: 'tool/call', data: { turn, callId: 'detail', name: 'mcp__openbkn__run_code' } },
    { type: 'tool/result', data: { turn, message: { toolCallId: 'detail', content: [{ type: 'text', text: JSON.stringify({ exit_code: 0, stdout, stderr: '' }) }] } } },
    { type: 'assistant/message', data: { turn, message: { content: [{ type: 'text', text: answer }] } } },
  ]
}

function captured(name: string, folder = 'unified-7-acceptance-20261006', answerIndex?: number): { readonly events: FidelityEvent[]; readonly answer: string } {
  const raw = JSON.parse(readFileSync(new URL(`../../../docs/evidence/${folder}/${name}.json`, import.meta.url), 'utf8'))
  const answer = answerIndex === undefined ? raw.assistantText.join('\n') : raw.assistantText[answerIndex]
  return { answer, events: [
    { type: 'turn/start', data: { turn: 1 } },
    { type: 'user/message', data: { source: { kind: 'user' }, content: [{ type: 'text', text: Array.isArray(raw.question) ? raw.question.join('\n') : raw.question }] } },
    ...raw.toolEvents.map((e: Record<string, unknown>) => e.type === 'tool/call'
      ? { type: e.type, data: e }
      : { type: e.type, data: { turn: e.turn, message: { toolCallId: e.callId, isError: e.hostErrorFlag === true, content: e.content } } }),
    { type: 'assistant/message', data: { turn: 1, message: { content: [{ type: 'text', text: answer }] } } },
  ] }
}

test('live empty-stock handoff rejects the excerpt but accepts all 313 faithfully copied rows', () => {
  const excerpt = captured('ci-2abd71d-bom-failed', 'answer-fidelity-20261006', 0)
  const issue = inspectAnswerFidelity(excerpt.events, 1)
  assert.equal(issue?.code, 'detail-mismatch')
  const rows = detailRowsOf(issue!.correction)
  assert.equal(rows.length, 313)
  assert.equal(rows.filter(row => row.stock === '0*' && row.unit === '?').length, 48)
  const replacement = captured('ci-2abd71d-bom-failed', 'answer-fidelity-20261006', 1)
  assert.equal(inspectAnswerFidelity(replacement.events, 1), undefined)
})

test('explicit missing-stock words retain absence, while unknown stock and nonnumeric usage fail closed', () => {
  for (const absent of ['无合格库存行', '无库存行', '无库存记录', '无记录', 'NO_ROW', 'no_row', 'No_Row']) {
    const handoff = detail(`1|parent-a|child|widget|1|${absent}|未提供`)
    const rows = detailRowsOf(handoff)
    assert.deepEqual(rows.map(row => [row.stock, row.unit]), [['0*', '?']])
    assert.match(renderDetail(rows), /\* 表示本次查询范围内未查到该物料的库存行/)
    assert.match(renderDetail(rows), /\? 表示库存单位未提供/)
    assert.equal(inspectAnswerFidelity(events(handoff, renderDetail(rows)), 1), undefined)
    assert.equal(inspectAnswerFidelity(events(handoff, renderDetail(rows).replace('0*', '0')), 1)?.code, 'detail-mismatch')
  }
  for (const row of ['1|parent-a|child|widget|1|未提供|?', '1|parent-a|child|widget|无合格库存行|0*|?']) {
    assert.equal(inspectAnswerFidelity(events(detail(row), '完整明细已交付'), 1)?.code, 'tool-detail-incomplete')
  }
})

test('real 313-row tool result rejects the captured 314-row final answer', () => {
  const run = captured('bom-usage-inventory')
  const issue = inspectAnswerFidelity(run.events, 1)
  assert.equal(issue?.code, 'detail-mismatch')
  assert.match(issue!.reason, /314 rows.*313/)
  const rows = detailRowsOf(issue!.correction)
  assert.equal(rows.length, 313)
  assert.equal(rows.filter(row => row.level === '3' && row.parent === '791-000012' && row.child === '165-002371').length, 0)
  assert.equal(rows.filter(row => row.level === '4' && row.parent === '791-000012' && row.child === '165-002371').length, 1)
  const corrected = [...run.events.slice(0, -1), { type: 'assistant/message', data: { turn: 1, message: { content: [{ type: 'text', text: renderDetail(rows) }] } } }]
  assert.equal(inspectAnswerFidelity(corrected, 1), undefined)
})

test('real no-data answer rejects the physical source invented after correct TOON metadata', () => {
  const run = captured('missing-object')
  const issue = inspectAnswerFidelity(run.events, 1)
  assert.equal(issue?.code, 'source-name-mismatch')
  assert.match(issue!.correction, /supply_demo_hand\.erp_material/)
  const answer = run.answer.replace('supply_ontology_hand.erp_material', 'supply_demo_hand.erp_material')
  const corrected = [...run.events.slice(0, -1), { type: 'assistant/message', data: { turn: 1, message: { content: [{ type: 'text', text: answer }] } } }]
  assert.equal(inspectAnswerFidelity(corrected, 1), undefined)
})

test('preserves repeated children and legitimate repeated rows, quantities, units and absence markers', () => {
  const text = `${ROWS}\n${ROWS.split('\n')[0]}`
  const rows = detailRowsOf(detail(text))
  assert.equal(rows.length, 3)
  assert.equal(inspectAnswerFidelity(events(detail(text), renderDetail(rows)), 1), undefined)
  assert.equal(inspectAnswerFidelity(events(detail(text), renderDetail(rows.slice(0, 2))), 1)?.code, 'detail-mismatch')
  assert.equal(inspectAnswerFidelity(events(detail(text), renderDetail(rows).replace('0*', '0')), 1)?.code, 'detail-mismatch')
  assert.equal(inspectAnswerFidelity(events(detail(text), renderDetail(rows).replace('个', '公斤')), 1)?.code, 'detail-mismatch')
})

test('accepts explicit heading levels but does not inherit them through an unrelated heading', () => {
  const text = '### 第 1 层\n|父件|子件编码|子件名称|单耗|可用量|单位|\n|---|---|---|---|---|---|\n|parent-a|shared-child|widget|1|12|个|'
  assert.equal(detailRowsOf(text)[0]?.level, '1')
  assert.equal(detailRowsOf(text.replace('### 第 1 层', '### 第 1 层\n### 其他摘要')).length, 0)
})

test('final malformed rows cannot hide behind otherwise matching parsed rows', () => {
  const rows = detailRowsOf(detail())
  const answer = `${renderDetail(rows)}\n| invalid | parent-x | child-x | widget | bogus | 99 | 个 |`
  assert.equal(inspectAnswerFidelity(events(detail(), answer), 1)?.code, 'detail-mismatch')
  const summary = `${renderDetail(rows)}\n\n| 项目 | 数量 |\n|---|---|\n| 完整明细 | 2 |`
  assert.equal(inspectAnswerFidelity(events(detail(), summary), 1), undefined)
})

test('a later partial preview does not replace the explicitly complete detail', () => {
  const rows = detailRowsOf(detail())
  const log = events(detail(), renderDetail(rows))
  log.splice(-1, 0,
    { type: 'tool/call', data: { turn: 1, callId: 'preview', name: 'mcp__openbkn__run_code' } },
    { type: 'tool/result', data: { turn: 1, message: { toolCallId: 'preview', content: [{ type: 'text', text: JSON.stringify({ exit_code: 0, stdout: detail(ROWS.split('\n')[0]!, 2) }) }] } } },
  )
  assert.equal(inspectAnswerFidelity(log, 1), undefined)
})

test('an incomplete declared handoff cannot accept a complete-answer claim', () => {
  const stdout = detail(ROWS.split('\n')[0]!, 2)
  assert.equal(inspectAnswerFidelity(events(stdout, '完整结果已交付。'), 1)?.code, 'tool-detail-incomplete')
})

test('conflicting self-declared complete batches fail closed instead of shrinking a correct full answer', () => {
  const rows = detailRowsOf(detail())
  const log = events(detail(), renderDetail(rows))
  log.splice(-1, 0,
    { type: 'tool/call', data: { turn: 1, callId: 'spot-check', name: 'mcp__openbkn__run_code' } },
    { type: 'tool/result', data: { turn: 1, message: { toolCallId: 'spot-check', content: [{ type: 'text', text: JSON.stringify({ exit_code: 0, stdout: detail(ROWS.split('\n')[0]!) }) }] } } },
  )
  const issue = inspectAnswerFidelity(log, 1)
  assert.equal(issue?.code, 'detail-handoff-conflict')
  assert.match(issue!.correction, /Do not silently select a smaller batch/)
  assert.equal(detailRowsOf(issue!.correction).length, 0, 'conflicting data is not chosen as an authoritative replacement')
})

test('failed tools and failed run_code stdout never become authoritative detail', () => {
  const log = events(detail(), 'No result')
  const message = (log[3]!.data as { message: { isError?: boolean } }).message
  message.isError = true
  assert.equal(inspectAnswerFidelity(log, 1), undefined)
  const failed = events(detail(), 'No result')
  ;(failed[3]!.data as { message: { content: { text: string }[] } }).message.content[0]!.text = JSON.stringify({ stdout: detail(), exit_code: 1 })
  assert.equal(inspectAnswerFidelity(failed, 1), undefined)
  const unsupported = events(detail(), 'No result')
  ;(unsupported[3]!.data as { message: { content: { text: string }[] } }).message.content[0]!.text = detail()
  assert.equal(inspectAnswerFidelity(unsupported, 1), undefined)
})

test('a lifecycle echo of the model answer cannot replace tool-supplied rows', () => {
  const rows = detailRowsOf(detail())
  const answer = renderDetail(rows).replace('12 |', '99 |')
  const log = events(detail(), answer)
  log.splice(-1, 0,
    { type: 'tool/call', data: { turn: 1, callId: 'finish', name: 'mcp__openbkn__bkn_finish_interaction' } },
    { type: 'tool/result', data: { turn: 1, message: { toolCallId: 'finish', content: [{ type: 'text', text: JSON.stringify({ exit_code: 0, stdout: detail().replace('|12|', '|99|') }) }] } } },
  )
  assert.equal(inspectAnswerFidelity(log, 1)?.code, 'detail-mismatch')
})

test('an intentional subset is allowed, but invented rows in that subset are refused', () => {
  const rows = detailRowsOf(detail())
  const answer = renderDetail(rows.slice(0, 1))
  assert.equal(inspectAnswerFidelity(events(detail(), answer, '只看第一层'), 1), undefined)
  assert.equal(inspectAnswerFidelity(events(detail(), answer.replace('12 |', '99 |'), '只看第一层'), 1)?.code, 'detail-mismatch')
})

test('a full-detail request cannot complete with only a summary', () => {
  assert.equal(inspectAnswerFidelity(events(detail(), '已经查到了完整的两行。'), 1)?.code, 'detail-mismatch')
  assert.equal(inspectAnswerFidelity(events(detail(), '统计共两行。', '只给总数'), 1), undefined)
  assert.equal(inspectAnswerFidelity(events(detail(), 'One small part.', 'Show the small material example'), 1), undefined)
})

test('isolates old turns, excludes plugin notices from the human request and validates explicit level counts', () => {
  const rows = detailRowsOf(detail())
  const old = events(detail(), 'bad old answer')
  old.push({ type: 'turn/end', data: { turn: 1 } })
  const current = events(detail(), renderDetail(rows), undefined, 2)
  current.splice(-1, 0, { type: 'user/message', data: { source: { kind: 'openbkn-answer-fidelity' }, content: [{ type: 'text', text: 'only summarize' }] } })
  assert.equal(inspectAnswerFidelity([...old, ...current], 2), undefined)
  const badCounts = events(detail(), renderDetail(rows).replace('L2: 1', 'L2: 7'))
  assert.equal(inspectAnswerFidelity(badCounts, 1)?.code, 'detail-count-mismatch')
})

test('fidelity failure metadata contains no business rows, values or private locations', () => {
  const issue = inspectAnswerFidelity(events(detail(), 'incorrect'), 1)!
  const error = new AnswerFidelityError(issue)
  assert.equal(error.code, 'answer-fidelity-failed')
  assert.doesNotMatch(error.message, /parent-a|shared-child|widget/)
})

test('an intermediate text plus pending tool call is not a final answer, including after an older final-form message', () => {
  const log = events(detail(), 'Retrieving additional detail.')
  ;(log[4]!.data as { message: { content: unknown[] } }).message.content.push({ type: 'tool-call', name: 'mcp__openbkn__run_code', id: 'pending', arguments: '{}' })
  assert.equal(inspectAnswerFidelity(log, 1), undefined)
  const olderFinal = events(detail(), 'Earlier incorrect final-form answer.')[4]!
  log.splice(4, 0, olderFinal)
  assert.equal(inspectAnswerFidelity(log, 1), undefined)
})

test('a trailing interrupted message clears an older final-form answer instead of revalidating it', () => {
  const log = events(detail(), 'Earlier incorrect final-form answer.')
  log.push({ type: 'assistant/message', data: { turn: 1, interrupted: true, message: { content: [{ type: 'text', text: 'Interrupted replacement.' }] } } })
  assert.equal(inspectAnswerFidelity(log, 1), undefined)
  assert.equal(log.filter(event => event.type === 'assistant/message').length, 2, 'both attempts remain in the input log')
})
