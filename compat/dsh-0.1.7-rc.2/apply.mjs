import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { copyFileSync, existsSync, mkdtempSync, readFileSync, realpathSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const packageRoot = resolve(fileURLToPath(new URL('.', import.meta.url)))

function git(target, args) {
  try {
    return execFileSync('git', args, { cwd: target, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
  } catch (error) {
    const detail = error.stderr?.toString().trim() || error.message
    throw new Error(detail)
  }
}

function gitResult(target, args, env) {
  const result = execFileSync('git', args, {
    cwd: target,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    env,
  })
  return result.trim()
}

/** Read only enough target state to reject anything but the supported source checkout. */
export function inspectTarget(targetPath, { expectedBaseCommit }) {
  const target = resolve(targetPath)
  if (!existsSync(target)) throw new Error(`DSH target is not a Git worktree: ${target}`)

  let isWorktree
  try {
    isWorktree = git(target, ['rev-parse', '--is-inside-work-tree'])
  } catch {
    throw new Error(`DSH target is not a Git worktree: ${target}`)
  }
  if (isWorktree !== 'true') throw new Error(`DSH target is not a Git worktree: ${target}`)

  const head = git(target, ['rev-parse', 'HEAD'])
  if (head !== expectedBaseCommit) {
    throw new Error(`Unsupported DSH revision ${head}; expected ${expectedBaseCommit}.`)
  }

  return { target: realpathSync(target), head }
}

export function loadManifest(packageDirectory, suppliedManifest) {
  const root = resolve(packageDirectory)
  const manifest = suppliedManifest ?? JSON.parse(readFileSync(resolve(root, 'manifest.json'), 'utf8'))
  if (typeof manifest?.dsh?.baseCommit !== 'string' || !Array.isArray(manifest?.patches) || manifest.patches.length === 0) {
    throw new Error('Compatibility manifest is invalid.')
  }
  const patches = manifest.patches.map((entry) => {
    if (typeof entry?.file !== 'string' || typeof entry?.sha256 !== 'string' || !Array.isArray(entry?.files)) {
      throw new Error('Compatibility manifest contains an invalid patch entry.')
    }
    const path = resolve(root, entry.file)
    if (relative(root, path).startsWith('..')) throw new Error(`Compatibility patch escapes its package: ${entry.file}`)
    const digest = createHash('sha256').update(readFileSync(path)).digest('hex')
    if (digest !== entry.sha256) throw new Error(`Compatibility patch digest does not match: ${entry.file}`)
    return { ...entry, path }
  })
  return { manifest, patches }
}

function status(target) {
  return git(target, ['status', '--porcelain'])
}

function changedFiles(target) {
  return git(target, ['diff', '--name-only']).split('\n').filter(Boolean).sort()
}

function hasExactlyExpectedFiles(target, patches) {
  const expected = patches.flatMap((patch) => patch.files).sort()
  const actual = changedFiles(target)
  return actual.length === expected.length && actual.every((file, index) => file === expected[index])
}

export function isExactlyApplied(target, patches) {
  if (status(target) === '' || !hasExactlyExpectedFiles(target, patches)) return false
  const indexPath = git(target, ['rev-parse', '--git-path', 'index'])
  const temporaryDirectory = mkdtempSync(resolve(tmpdir(), 'openbkn-dsh-index-'))
  const temporaryIndex = resolve(temporaryDirectory, 'index')
  try {
    copyFileSync(resolve(target, indexPath), temporaryIndex)
    const env = { ...process.env, GIT_INDEX_FILE: temporaryIndex }
    gitResult(target, ['add', '-u'], env)
    try {
      gitResult(target, ['apply', '--cached', '--unidiff-zero', '--reverse', ...patches.slice().reverse().map((patch) => patch.path)], env)
    } catch {
      return false
    }
    try {
      gitResult(target, ['diff', '--cached', '--quiet', 'HEAD'], env)
      return true
    } catch {
      return false
    }
  } finally {
    rmSync(temporaryDirectory, { recursive: true, force: true })
  }
}

/** Apply or remove the immutable series without accepting a dirty or version-skewed target. */
export function applyCompatibility({ target: targetPath, packageDirectory = packageRoot, manifest: suppliedManifest, revert = false }) {
  const { manifest, patches } = loadManifest(packageDirectory, suppliedManifest)
  const { target } = inspectTarget(targetPath, { expectedBaseCommit: manifest.dsh.baseCommit })
  const applied = isExactlyApplied(target, patches)

  if (revert) {
    if (!applied) throw new Error('Target does not contain exactly this compatibility series; refusing to revert.')
    git(target, ['apply', '--unidiff-zero', '--reverse', ...patches.slice().reverse().map((patch) => patch.path)])
    return 'reverted'
  }
  if (applied) return 'already-applied'
  if (status(target) !== '') throw new Error('DSH target is dirty or contains a different patch series; refusing to apply.')

  git(target, ['apply', '--check', '--unidiff-zero', ...patches.map((patch) => patch.path)])
  git(target, ['apply', '--unidiff-zero', ...patches.map((patch) => patch.path)])
  return 'applied'
}

function main() {
  const targetFlag = process.argv.indexOf('--dsh')
  if (targetFlag === -1 || process.argv[targetFlag + 1] === undefined) {
    throw new Error('Usage: node apply.mjs --dsh <clean-dsh-source-checkout> [--revert]')
  }
  const result = applyCompatibility({
    target: process.argv[targetFlag + 1],
    revert: process.argv.includes('--revert'),
  })
  console.log(`OpenBKN DSH compatibility: ${result}.`)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    main()
  } catch (error) {
    console.error(`OpenBKN DSH compatibility: ${error.message}`)
    process.exitCode = 1
  }
}
