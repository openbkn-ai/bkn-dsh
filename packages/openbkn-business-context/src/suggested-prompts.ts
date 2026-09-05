const MAX_PROMPTS = 5
const MAX_PROMPT_LENGTH = 400

/** Resolve a small deployment-configured prompt set without reading conversation content in the browser. */
export function resolveSuggestedPrompts(templates: readonly string[], networkName: string): readonly string[] {
  const network = networkName.trim()
  const prompts: string[] = []
  for (const template of templates) {
    if (prompts.length === MAX_PROMPTS || typeof template !== 'string') continue
    const prompt = template.replaceAll('{network}', network).trim()
    if (prompt.length === 0 || prompt.length > MAX_PROMPT_LENGTH || prompts.includes(prompt)) continue
    prompts.push(prompt)
  }
  return prompts
}
