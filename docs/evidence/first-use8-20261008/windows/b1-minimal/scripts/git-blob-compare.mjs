// C7: compare every archived diagnostic JSON's Git blob bytes (at a given commit) with the local original
// and the original in the download folder. Reads Git via `git cat-file`, never the CRLF-normalised checkout.
// usage: node git-blob-compare.mjs <repoWorktree> <commit> <outFile>
import { execFileSync } from 'node:child_process'
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { createHash } from 'node:crypto'
const [repo, commit, outFile] = process.argv.slice(2)
const base = 'docs/evidence/first-use8-20261008/windows'
const sha = (b) => createHash('sha256').update(b).digest('hex')
const git = (...a) => execFileSync('git', ['-C', repo, ...a], { maxBuffer: 64 << 20 })
const paths = git('ls-tree', '-r', '--name-only', commit, base).toString().split('\n').filter((p) => /OpenBKN-diagnostic.*\.json$/.test(p))
const localDirs = ['C:/bkn-verify/first-use8-evidence', 'C:/bkn-verify/first-use8-evidence/nolicense-129', 'C:/bkn-verify/first-use8-b1-evidence']
const dl = 'D:/mydocs/downloads'
const dlBySha = new Map()
for (const f of readdirSync(dl)) { try { dlBySha.set(sha(readFileSync(join(dl, f))), join(dl, f)) } catch {} }
const norm = (b) => b.toString('utf8').replace(/^\uFEFF/, '').replace(/\r\n/g, '\n')
const rows = []
for (const p of paths) {
  const blob = git('cat-file', '-p', `${commit}:${p}`)
  const name = p.split('/').pop()
  const local = localDirs.map((d) => join(d, name)).find((f) => existsSync(f))
  const lb = local ? readFileSync(local) : undefined
  let id = '?'; try { id = JSON.parse(norm(blob)).reportId } catch {}
  const blobSha = sha(blob)
  const vsLocal = lb === undefined ? 'unavailable' : sha(lb) === blobSha ? 'identical' : norm(lb) === norm(blob) ? 'normalized' : 'different'
  const dlHit = dlBySha.get(blobSha)
  let vsDownload = dlHit ? 'identical' : 'unavailable'
  if (!dlHit && lb && dlBySha.get(sha(lb))) vsDownload = 'normalized-or-different'
  rows.push({ path: p, reportId: id, blobBytes: blob.length, blobSha256: blobSha, localOriginal: local ?? null, vsLocal, downloadOriginal: dlHit ?? null, vsDownload })
}
writeFileSync(outFile, JSON.stringify({ commit, comparedAtUtc: new Date().toISOString(), method: 'git cat-file -p <commit>:<path> bytes vs file bytes (SHA-256); normalized = equal only after BOM strip + CRLF->LF', count: rows.length, rows }, null, 1))
console.log(`${rows.length} archived reports; vsLocal=${JSON.stringify(rows.reduce((a, r) => ({ ...a, [r.vsLocal]: (a[r.vsLocal] ?? 0) + 1 }), {}))}; vsDownload=${JSON.stringify(rows.reduce((a, r) => ({ ...a, [r.vsDownload]: (a[r.vsDownload] ?? 0) + 1 }), {}))}`)
