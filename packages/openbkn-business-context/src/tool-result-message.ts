/**
 * Readers for a DSH `tool/result` session message across both logged shapes.
 *
 * Session format v4 (DSH 0.2.x) stores a tool message as
 * `{ role: 'tool', toolCallId, isError, content: [{ type: 'text', text }] }`.
 * Earlier formats wrapped the payload as
 * `{ content: [{ type: 'tool-result', isError?, content: [{ type: 'text', text }] }] }`.
 * Logs of either generation stay readable, so both are accepted.
 */

/** Every text payload of one tool message, in logged order. */
export function toolResultTexts(message: Record<string, unknown> | undefined): string[] {
  if (message === undefined || !Array.isArray(message.content)) return []
  const texts: string[] = []
  for (const block of message.content) {
    const entry = record(block)
    if (entry?.type === 'text' && typeof entry.text === 'string') {
      texts.push(entry.text)
      continue
    }
    if (entry?.type !== 'tool-result' || !Array.isArray(entry.content)) continue
    for (const content of entry.content) {
      const text = record(content)
      if (text?.type === 'text' && typeof text.text === 'string') texts.push(text.text)
    }
  }
  return texts
}

/** Whether the tool message records a failed call (v4 message flag or a legacy block flag). */
export function toolResultIsError(message: Record<string, unknown> | undefined): boolean {
  if (message === undefined) return false
  if (message.isError === true) return true
  for (const block of Array.isArray(message.content) ? message.content : []) {
    if (record(block)?.isError === true) return true
  }
  return false
}

function record(value: unknown): Record<string, unknown> | undefined {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined
}
