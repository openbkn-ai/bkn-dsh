// Offline identity check only. No Host, browser, login or platform request.
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, lstatSync, mkdtempSync, rmSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { dirname, join, resolve, relative, isAbsolute } from 'node:path'
import { fileURLToPath } from 'node:url'
import { tmpdir } from 'node:os'
import { parseArgs } from 'node:util'
import { runTar } from './portable-tar.mjs'

const kit = dirname(fileURLToPath(import.meta.url))
const read = p => JSON.parse(readFileSync(p, 'utf8'))
const sha = p => createHash('sha256').update(readFileSync(p)).digest('hex')
const { values } = parseArgs({ options: { installed: { type: 'string' } } })
const wanted = read(join(kit, 'KIT-FILES.json'))
function walk(dir, prefix = '') {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const name = prefix + entry.name, file = join(dir, entry.name)
    assert(!lstatSync(file).isSymbolicLink(), 'Unexpected kit/archive link')
    return entry.isDirectory() ? walk(file, name + '/') : [name]
  })
}
assert.deepEqual(walk(kit).filter(n => n !== 'KIT-FILES.json').sort(), Object.keys(wanted).sort())
for (const [name, digest] of Object.entries(wanted)) {
  const file = resolve(kit, name), rel = relative(kit, file)
  assert(rel && !rel.startsWith('..') && !isAbsolute(rel))
  assert.equal(sha(file), digest, name)
}
const inputs = read(join(kit, 'INPUTS.json')), archive = join(kit, inputs.candidatePath)
assert.equal(inputs.sourceCommit, 'dbf53d329eae704e580e555f9da37f7c05a8111a')
assert.equal(inputs.ciRun, null); assert.equal(inputs.formalAcceptanceEligible, false)
assert.equal(sha(archive), inputs.candidateSha256)
assert.equal(readFileSync(archive).length, inputs.candidateBytes)
const expected = read(join(kit, 'CANDIDATE-FILES.json'))
assert.equal(Object.keys(expected).length, 94)
const temp = mkdtempSync(join(tmpdir(), 'bkn-auto-login-input-'))
try {
  for (const name of runTar(['-tf', archive]).trim().split(/\r?\n/)) {
    assert(name.startsWith('package/') && !name.includes('\\') && !name.split('/').includes('..'))
  }
  runTar(['-xf', archive, '-C', temp])
  const extracted = join(temp, 'package')
  assert.deepEqual(walk(extracted).sort(), Object.keys(expected).sort())
  for (const [name, digest] of Object.entries(expected)) assert.equal(sha(join(extracted, name)), digest, name)
  assert.equal(read(join(extracted, 'package.json')).version, inputs.version)
  if (values.installed) {
    for (const [name, digest] of Object.entries(expected)) assert.equal(sha(join(values.installed, name)), digest, 'installed/' + name)
  }
} finally { rmSync(temp, { recursive: true, force: true }) }
console.log(JSON.stringify({ inputVerification: 'PASS', sourceCommit: inputs.sourceCommit,
  candidateSha256: inputs.candidateSha256, candidateFilesMatched: 94,
  installedFilesMatched: values.installed ? 94 : null,
  hostStarted: false, ciRun: null, formalAcceptanceEligible: false }, null, 2))
