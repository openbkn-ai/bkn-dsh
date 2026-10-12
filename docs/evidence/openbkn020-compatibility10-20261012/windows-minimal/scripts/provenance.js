// Map every committed windows-minimal file to its local original and record raw-byte size/SHA-256 on both sides.
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const R = 'C:/bkn-verify/compat10-minimal';
const W = 'C:/bkn-verify/compat10-wt/docs/evidence/openbkn020-compatibility10-20261012/windows-minimal';
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
function source(rel) {
  const b = path.posix.basename(rel);
  if (rel.startsWith('evidence/f97/')) return [R + '/evidence/f97/' + b, 'stop-helper record / canonical helper native output'];
  if (/^evidence\/OpenBKN-diagnostic-npm-v1/.test(rel)) return [R + '/evidence/' + b, 'product UI export copy; download original D:/mydocs/downloads/957a000f-501c-4772-b5d1-0ef754f17ee4.tmp (temp name, see reports.txt)'];
  if (/^evidence\/OpenBKN-diagnostic-desktop-v1/.test(rel)) return [R + '/evidence/' + b, 'product UI export copy; download original D:/mydocs/downloads/OpenBKN-diagnostic-20261012T160923679Z-2c354224.json'];
  if (rel.startsWith('evidence/')) return [R + '/evidence/' + b, /host\.json$|daily-/.test(b) ? 'helper record' : /probe-phases/.test(b) ? 'phase lines extracted (UTF-16 -> UTF-8) from private probe full stream' : /v1-v2-/.test(b) ? 'operator record (DOM text / screenshot transcription)' : 'native output / operator record'];
  if (rel.startsWith('scripts/')) return [R + '/scripts/' + b, 'helper script as executed'];
  if (rel === 'verifier/verify-native.txt' || rel === 'verifier/verify-native-exit.txt') return [R + '/' + b, 'native verifier full stream (PowerShell > , UTF-16) / exit code'];
  if (rel.startsWith('verifier/')) return [R + '/' + b, 'wrapper script as executed'];
  if (rel === 'patches/npm-patch-after-v2.yml') return [R + '/npm/private/patch-after-v2.yml', 'cp of npm cordis.patch.yml right after V2 save'];
  if (rel === 'patches/desktop-patch-after-v2.yml') return [R + '/desktop/patch-after-v2.yml', 'cp of Desktop cordis.patch.yml right after V2 save'];
  return [null, 'unmapped'];
}
const rows = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else {
      const rel = path.relative(W, p).split(path.sep).join('/');
      if (rel === 'RESULTS.md' || rel === 'LOCAL-PROVENANCE.json' || rel === 'GIT-BLOB-CONSISTENCY.json') continue;
      const [src, note] = source(rel);
      const c = fs.readFileSync(p);
      const o = src && fs.existsSync(src) ? fs.readFileSync(src) : null;
      rows.push({ path: rel, sourcePath: src, sourceNote: note, originalPresent: !!o, originalBytes: o ? o.length : null, originalSha256: o ? sha(o) : null, committedFileBytes: c.length, committedFileSha256: sha(c), copyByteIdentical: o ? o.equals(c) : false });
    }
  }
})(W);
rows.sort((a, b) => a.path.localeCompare(b.path));
fs.writeFileSync(W + '/LOCAL-PROVENANCE.json', JSON.stringify({ generatedUtc: new Date().toISOString(), note: 'Local original vs evidence copy, raw bytes. Excludes RESULTS.md, this file and GIT-BLOB-CONSISTENCY.json. Directory is -text, so committed blobs must equal these copies (verified separately).', total: rows.length, allCopiesByteIdentical: rows.every((r) => r.copyByteIdentical), files: rows }, null, 2) + '\n');
console.log(rows.length, rows.every((r) => r.copyByteIdentical), rows.filter((r) => !r.copyByteIdentical).map((r) => r.path));
