import assert from 'node:assert/strict'
import test from 'node:test'
import { execFileSync } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, unlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve, sep } from 'node:path'

import { assertPortableBundle, dereferenceSymlinks, mirrorRelativeFor, prefixForms, scrubAbsolutePaths, stripInstallMetadata } from '../runtime/bundle-portability.mjs'

function fresh(name) {
  const root = join(tmpdir(), `openbkn-portability-${name}-${process.pid}`)
  rmSync(root, { recursive: true, force: true })
  mkdirSync(root, { recursive: true })
  return root
}

/** Outside-the-bundle target directory for escape fixtures (real on every platform). */
function outsideDir(name) {
  return mkdtempSync(join(tmpdir(), `openbkn-outside-${name}-`))
}

/** Create symlinks when the platform allows it; otherwise skip the test honestly. */
function canCreateSymlinks() {
  const probe = join(tmpdir(), `openbkn-symlink-probe-${process.pid}`)
  removeLink(probe)
  try {
    symlinkSync(join(tmpdir(), '.'), probe, 'dir')
  } catch {
    return false
  }
  removeLink(probe)
  return true
}

/**
 * Remove the probe link itself, never its target. Node 24's rmSync rejects a
 * directory symlink with ERR_FS_EISDIR, so unlink it directly.
 */
function removeLink(path) {
  try {
    unlinkSync(path)
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error
  }
}

const j = (...parts) => join(...parts)

test('flags build-machine paths in hidden and multi-dot text files (native separators)', () => {
  const root = fresh('hidden')
  const home = fresh('leaky-home')
  writeFileSync(join(root, '.modules.yaml'), `virtualStoreDir: ${join(home, '.pnpm')}\n`)
  writeFileSync(join(root, 'client.terminal.js'), `// sourcemapping ${join(home, 'src')}\n`)
  assert.throws(() => assertPortableBundle({ directory: root, home }), /build-machine path[\s\S]*\.modules\.yaml[\s\S]*client\.terminal\.js/)
  rmSync(root, { recursive: true, force: true })
  rmSync(home, { recursive: true, force: true })
})

test('flags build-time file: references across YAML, JSON, and Windows forms', () => {
  const root = fresh('filedeps')
  writeFileSync(join(root, 'pnpm-lock.yaml'), 'dependencies:\n  specifier: file:/plugin/x.tgz\n')
  writeFileSync(join(root, 'package-lock.json'), '{"dependencies":{"x":"file:../x.tgz"}}')
  writeFileSync(join(root, 'windows-deps.json'), '{"dependencies":{"x":"file:C:/build/plugin.tgz"}}')
  writeFileSync(join(root, 'windows-escaped.json'), '{"dependencies":{"x":"file:C:\\\\build\\\\plugin.tgz"}}')
  writeFileSync(join(root, 'unc-deps.yaml'), "dependencies:\n  specifier: 'file:\\\\\\\\server\\\\share\\\\plugin.tgz'\n")
  assert.throws(() => assertPortableBundle({ directory: root, home: '/nonexistent-home' }), (error) => {
    const hits = [...error.message.matchAll(/file: reference in ([^\n]+)/g)].map(match => match[1])
    const expected = ['pnpm-lock.yaml', 'package-lock.json', 'windows-deps.json', 'windows-escaped.json', 'unc-deps.yaml']
    return expected.every(name => hits.some(hit => hit.endsWith(name)))
  }, 'every dependency form must be flagged')
  rmSync(root, { recursive: true, force: true })
})

test('removes pnpm install metadata from the bundle', () => {
  const root = fresh('metadata')
  writeFileSync(join(root, 'pnpm-lock.yaml'), 'locked\n')
  writeFileSync(join(root, '.modules.yaml'), 'store\n')
  writeFileSync(join(root, '.pnpm-workspace-state-v1.json'), '{}')
  mkdirSync(join(root, '.pnpm'), { recursive: true })
  writeFileSync(join(root, '.pnpm', 'lock.yaml'), 'virtual store\n')
  writeFileSync(join(root, 'package.json'), '{"name":"keep"}')
  const removed = stripInstallMetadata(root)
  const names = [...removed].map(path => path.split(sep).pop()).sort()
  assert.deepEqual(names, ['.modules.yaml', '.pnpm-workspace-state-v1.json', 'lock.yaml', 'pnpm-lock.yaml'])
  rmSync(root, { recursive: true, force: true })
})

test('keeps stored-relative in-bundle links and rejects escaping and absolute-stored ones', { skip: !canCreateSymlinks() && 'platform refuses symlink creation' }, () => {
  const root = fresh('links')
  const outside = outsideDir('links')
  mkdirSync(join(root, 'pkg'))
  writeFileSync(join(root, 'pkg', 'a.js'), 'module.exports = 1\n')
  mkdirSync(join(root, '.bin'))
  symlinkSync(j('..', 'pkg', 'a.js'), join(root, '.bin', 'a')) // relative, in-bundle
  assertPortableBundle({ directory: root, home: '/nonexistent-home' })

  const escapeTarget = join(outside, 'escape.txt')
  writeFileSync(escapeTarget, 'outside\n')
  symlinkSync(escapeTarget, join(root, '.bin', 'escape')) // absolute, escaping
  // the stored-form rule fires first; an escaping link is necessarily absolute-stored
  assert.throws(() => assertPortableBundle({ directory: root, home: '/nonexistent-home' }), /symlink (escapes the bundle|with absolute stored target)/)

  // absolute stored target that still resolves inside the bundle: rejected by the gate
  symlinkSync(join(root, 'pkg', 'a.js'), join(root, '.bin', 'absolute-inside'))
  assert.throws(() => assertPortableBundle({ directory: root, home: '/nonexistent-home' }), /symlink with absolute stored target/)

  rmSync(root, { recursive: true, force: true })
  rmSync(outside, { recursive: true, force: true })
})

test('rebases absolute-stored in-bundle links to relative ones', { skip: !canCreateSymlinks() && 'platform refuses symlink creation' }, () => {
  const root = fresh('rebase')
  mkdirSync(join(root, 'pkg'))
  writeFileSync(join(root, 'pkg', 'a.js'), 'module.exports = 1\n')
  symlinkSync(join(root, 'pkg', 'a.js'), join(root, 'tool')) // absolute, in-bundle
  const replaced = dereferenceSymlinks(root)
  assert.equal(replaced.find(entry => entry.link === 'tool').kind, 'rebased-link')
  assertPortableBundle({ directory: root, home: '/nonexistent-home' })
  rmSync(root, { recursive: true, force: true })
})

test('re-points source-tree links to mirrored bundle paths and copies external ones', { skip: !canCreateSymlinks() && 'platform refuses symlink creation' }, () => {
  const source = fresh('src')
  const external = outsideDir('vendor')
  mkdirSync(join(source, 'pkg'), { recursive: true })
  writeFileSync(join(source, 'pkg', 'real.js'), 'module.exports = 42\n')
  mkdirSync(external, { recursive: true })
  writeFileSync(join(external, 'v.txt'), 'vendored\n')

  const root = fresh('mirror')
  mkdirSync(join(root, 'pkg'), { recursive: true })
  writeFileSync(join(root, 'pkg', 'real.js'), 'module.exports = 42\n')
  mkdirSync(join(root, 'bin'), { recursive: true })
  symlinkSync(join(source, 'pkg', 'real.js'), join(root, 'bin', 'tool')) // absolute, into mirrored area
  symlinkSync(external, join(root, 'vendored')) // absolute, external directory

  const replaced = dereferenceSymlinks(root, [source])
  const byLink = new Map(replaced.map(entry => [entry.link, entry]))
  assert.equal(byLink.get(j('bin', 'tool')).kind, 'relative-link')
  assert.equal(byLink.get('vendored').kind, 'copy')
  assertPortableBundle({ directory: root, home: '/nonexistent-home' })

  rmSync(source, { recursive: true, force: true })
  rmSync(external, { recursive: true, force: true })
  rmSync(root, { recursive: true, force: true })
})

test('a mirrored .bin entry keeps resolving modules relative to its real file', { skip: !canCreateSymlinks() && 'platform refuses symlink creation' }, () => {
  const source = fresh('binsrc')
  mkdirSync(join(source, 'semver'), { recursive: true })
  writeFileSync(join(source, 'semver', 'package.json'), '{"name":"semver","version":"1.0.0"}\n')
  mkdirSync(join(source, 'semver', 'bin'))
  // A bin script that resolves a sibling of its own real location, exactly
  // like real .bin entries that require('../package.json').
  writeFileSync(join(source, 'semver', 'bin', 'semver.js'), 'const p = require("../package.json")\nconsole.log(p.name)\n')
  mkdirSync(join(source, 'node_modules', '.bin'), { recursive: true })

  // Node's cpSync rewrites/materializes absolute symlinks differently per
  // platform (macOS rebases to absolute source paths, Windows rewrites them
  // in place), so the bundle shape is constructed explicitly: a plain copied
  // tree plus the production link form the sweep must handle — an absolute
  // symlink into the source tree.
  const root = fresh('binmirror')
  cpSync(source, root, { recursive: true })
  symlinkSync(join(source, 'semver', 'bin', 'semver.js'), join(root, 'node_modules', '.bin', 'semver'))

  const replaced = dereferenceSymlinks(root, [source])
  const link = join(root, 'node_modules', '.bin', 'semver')
  const realpaths = {
    target: realpathSync(link),
    root: realpathSync(root),
    sourceReal: realpathSync(source),
    sourceRaw: resolve(source),
  }
  const entry = replaced.find(item => item.link.endsWith(j('.bin', 'semver')))
  assert.equal(entry?.kind, 'relative-link', `platform=${process.platform} realpaths=${JSON.stringify(realpaths)} replaced=${JSON.stringify(replaced)}`)
  const output = execFileSync(process.execPath, [join(root, 'node_modules', '.bin', 'semver')], { encoding: 'utf8' })
  assert.equal(output.trim(), 'semver')

  rmSync(source, { recursive: true, force: true })
  rmSync(root, { recursive: true, force: true })
})

test('maps links through a bundle subdirectory prefix (runtime shape)', { skip: !canCreateSymlinks() && 'platform refuses symlink creation' }, () => {
  const source = fresh('prefix-src')
  mkdirSync(join(source, 'node_modules', 'semver'), { recursive: true })
  writeFileSync(join(source, 'node_modules', 'semver', 'package.json'), '{"name":"semver"}')
  mkdirSync(join(source, 'node_modules', 'semver', 'bin'))
  writeFileSync(join(source, 'node_modules', 'semver', 'bin', 'semver.js'), 'const p = require("../package.json")\nconsole.log(p.name)\n')
  mkdirSync(join(source, 'node_modules', '.bin'))

  // same as above: construct the production link shape explicitly
  const root = fresh('prefix-root')
  cpSync(source, join(root, 'runtime'), { recursive: true })
  symlinkSync(join(source, 'node_modules', 'semver', 'bin', 'semver.js'), join(root, 'runtime', 'node_modules', '.bin', 'semver'))

  const replaced = dereferenceSymlinks(root, [{ source, into: 'runtime' }])
  const link = join(root, 'runtime', 'node_modules', '.bin', 'semver')
  const realpaths = {
    target: realpathSync(link),
    root: realpathSync(root),
    sourceReal: realpathSync(source),
    sourceRaw: resolve(source),
  }
  const entry = replaced.find(item => item.link.endsWith(j('.bin', 'semver')))
  assert.equal(entry?.kind, 'relative-link', `platform=${process.platform} realpaths=${JSON.stringify(realpaths)} replaced=${JSON.stringify(replaced)}`)
  const output = execFileSync(process.execPath, [join(root, 'runtime', 'node_modules', '.bin', 'semver')], { encoding: 'utf8' })
  assert.equal(output.trim(), 'semver')

  rmSync(source, { recursive: true, force: true })
  rmSync(root, { recursive: true, force: true })
})

test('mirror matching follows platform identity rules (pure)', () => {
  const root = process.platform === 'win32'
    ? 'C:\\Users\\Builder\\src'
    : '/Users/build-machine/src'
  // same root, native match; the pure core speaks normalized separators
  assert.equal(mirrorRelativeFor([root], `${root}${sep}pkg${sep}a.js`), 'pkg/a.js')
  // a different tree under a same-named prefix never matches
  assert.equal(mirrorRelativeFor([root], `${root}-other${sep}pkg${sep}a.js`), undefined)
  // case-different roots only mirror each other on win32
  const upper = root.toUpperCase()
  const caseVariantTarget = `${root}${sep}pkg${sep}a.js`
  assert.equal(
    mirrorRelativeFor([upper], caseVariantTarget) !== undefined,
    process.platform === 'win32',
  )
})

test('in-bundle directory links pass scanning without EISDIR and keep their contents scanned', { skip: !canCreateSymlinks() && 'platform refuses symlink creation' }, () => {
  const root = fresh('dirlink')
  const home = fresh('dirlink-home')
  mkdirSync(join(root, 'real'), { recursive: true })
  writeFileSync(join(root, 'real', 'leak.js'), `// ${home}\n`)
  symlinkSync(join(root, 'real'), join(root, 'alias')) // absolute-stored directory link, in-bundle

  const replaced = dereferenceSymlinks(root)
  assert.equal(replaced.find(entry => entry.link === 'alias').kind, 'rebased-link')
  // scanning follows real directories only; the leak inside the target is found
  assert.throws(() => assertPortableBundle({ directory: root, home }), /build-machine path/)
  // after scrubbing the payload the same tree passes
  scrubAbsolutePaths(root, [home])
  assertPortableBundle({ directory: root, home })

  rmSync(root, { recursive: true, force: true })
  rmSync(home, { recursive: true, force: true })
})

test('prefixForms covers windows-native, forward-slash, and escaped serializations', () => {
  const windows = prefixForms('C:' + String.fromCharCode(92) + 'Users' + String.fromCharCode(92) + 'builder')
  const bs = String.fromCharCode(92) // backslash
  assert.deepEqual([...windows].sort(), [
    'C:/Users/builder',
    'C:' + bs + bs + 'Users' + bs + bs + 'builder', // JSON/YAML escaped
    'C:' + bs + 'Users' + bs + 'builder', // platform native
  ].sort())
  const unc = prefixForms(bs + bs + 'server' + bs + 'share')
  assert.deepEqual([...unc].sort(), [
    '//server/share',
    bs + bs + bs + bs + 'server' + bs + bs + 'share',
    bs + bs + 'server' + bs + 'share',
  ].sort())
  // no backslashes: every form collapses onto the native one
  assert.deepEqual(prefixForms('/Users/build-machine'), ['/Users/build-machine'])
})

test('scrubs serialized build roots (native JSON, escaped, and forward forms) and keeps payloads valid', () => {
  const root = fresh('scrub')
  const home = fresh('scrub-home')

  // JSON.stringify serialization stays valid JSON on every platform and
  // produces the escaped-backslash form on Windows.
  writeFileSync(join(root, 'a.map'), JSON.stringify({ sources: [join(home, 'x.ts')], keep: 'sentinel-not-a-path' }))
  // Tools that emit forward slashes on Windows.
  const forwardHome = home.split(sep).join('/')
  writeFileSync(join(root, 'b.map'), JSON.stringify({ sources: [`${forwardHome}/y.ts`] }))

  // the gate rejects the tree BEFORE scrubbing (proves the fixtures really leak)
  assert.throws(() => assertPortableBundle({ directory: root, home }), /build-machine path/)

  const scrubbed = scrubAbsolutePaths(root, [home])
  assert.deepEqual([...scrubbed].sort(), ['a.map', 'b.map'])

  const a = JSON.parse(readFileSync(join(root, 'a.map'), 'utf8'))
  assert.equal(a.sources[0].startsWith(home), false)
  assert.equal(a.keep, 'sentinel-not-a-path') // non-path content untouched
  const b = JSON.parse(readFileSync(join(root, 'b.map'), 'utf8'))
  assert.equal(b.sources[0].startsWith(forwardHome), false)

  // the whole gate passes on the scrubbed tree for every serialization form
  assertPortableBundle({ directory: root, home })
  // and would have rejected it before scrubbing (forward form leaks natively
  // only on Windows; assert via the escaped/native probe file)
  rmSync(root, { recursive: true, force: true })
  rmSync(home, { recursive: true, force: true })
})
