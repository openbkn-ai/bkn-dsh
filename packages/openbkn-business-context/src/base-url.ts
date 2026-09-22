/** Normalize a platform base URL: trim whitespace and strip all trailing slashes.
 * Linear by design — the previous regex form (`/\\/+$/`) was flagged by CodeQL
 * as js/polynomial-redos on library input. */
export function normalizeBaseUrl(value: string): string {
  const trimmed = value.trim()
  let end = trimmed.length
  while (end > 0 && trimmed.charCodeAt(end - 1) === 47) end -= 1
  return end === trimmed.length ? trimmed : trimmed.slice(0, end)
}
