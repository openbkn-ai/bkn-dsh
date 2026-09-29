/**
 * Strip every trailing `/` in one linear pass. The regex form
 * `value.replace(/\/+$/, '')` backtracks polynomially on long runs of `/`
 * (CodeQL js/polynomial-redos), and these values arrive from configuration,
 * CLI arguments, and persisted records.
 */
export function trimTrailingSlashes(value: string): string {
  let end = value.length
  while (end > 0 && value.charCodeAt(end - 1) === 47) end -= 1
  return end === value.length ? value : value.slice(0, end)
}
