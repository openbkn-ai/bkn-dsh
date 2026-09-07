const MAX_NETWORK_NAME_LENGTH = 400

/** The only prompt shown before a bound business session has a completed answer. */
export function emptyBusinessSessionPrompt(displayName: string): string {
  const name = displayName.trim()
  if (name.length === 0 || name.length > MAX_NETWORK_NAME_LENGTH || /[\u0000-\u001F\u007F]/.test(name)) {
    throw new TypeError('OpenBKN business network name is invalid.')
  }
  return `了解「${name}」知识网络。`
}
