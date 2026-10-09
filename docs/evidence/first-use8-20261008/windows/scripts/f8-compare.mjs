// Compare two f8 snapshots: node f8-compare.mjs <a.json> <b.json>
import { readFileSync } from 'node:fs'
const load = (p) => JSON.parse(readFileSync(p, 'utf8').replace(/^\uFEFF/, ''))
const a = load(process.argv[2]), b = load(process.argv[3])
const map = (x) => Object.fromEntries(x.files.map((f) => [f.path, f.sha256]))
const A = map(a), B = map(b)
let same = 0, diff = 0
for (const k of new Set([...Object.keys(A), ...Object.keys(B)])) {
  const ok = A[k] === B[k]
  ok ? same++ : diff++
  console.log(ok ? 'SAME' : 'DIFF', k.split('\\').slice(-3).join('/'), (A[k] ?? 'missing').slice(0, 12), '->', (B[k] ?? 'missing').slice(0, 12))
}
console.log(`files same=${same} diff=${diff}`)
console.log('profile package.json', a.profilePackageJsonSha.slice(0, 12), '->', b.profilePackageJsonSha.slice(0, 12))
console.log('dependencies', JSON.stringify(a.dependencies ?? null), '->', JSON.stringify(b.dependencies ?? null))
console.log('pluginDirPresent', a.pluginDirPresent, '->', b.pluginDirPresent)
