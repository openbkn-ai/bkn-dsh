// Inventory of archived product diagnostic reports vs. originals still in the download folder.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { createHash } from 'node:crypto'
const ev = 'C:/bkn-verify/first-use8-evidence'
const dl = 'D:/mydocs/downloads'
const sha = (b) => createHash('sha256').update(b).digest('hex')
const inDownloads = new Map()
for (const f of readdirSync(dl)) {
  try { inDownloads.set(sha(readFileSync(join(dl, f))), join(dl, f).replaceAll('/', '\\')) } catch {}
}
const rows = []
for (const f of readdirSync(ev).filter((n) => /^OpenBKN-diagnostic.*\.json$/.test(n)).sort()) {
  const b = readFileSync(join(ev, f))
  let id = '?'
  try { id = JSON.parse(b.toString('utf8').replace(/^\uFEFF/, '')).reportId ?? '?' } catch {}
  const h = sha(b)
  const orig = inDownloads.get(h)
  rows.push(`| ${f} | ${id} | ${orig ?? '(not in downloads; archived copy only)'} | ${b.length} / ${h} | UI export | ${orig ? 'yes' : 'no'} | ${orig ? 'identical' : 'unavailable'} |`)
}
writeFileSync(join(ev, 's3-report-inventory.md'), rows.join('\n') + '\n')
console.log(`${rows.length} reports`)
