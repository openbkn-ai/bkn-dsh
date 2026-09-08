import { applyCompatibility, loadManifest } from '../compat/dsh-0.1.2-rc.1/apply.mjs'
import { verifyCompatibility } from '../compat/dsh-0.1.2-rc.1/verify.mjs'
import { execFileSync } from 'node:child_process'
import { relative, resolve } from 'node:path'

/**
 * Apply the release-matched compatibility series to one explicit clean DSH
 * source checkout. This helper never resolves a global installation path.
 */
export function prepareCompatibleRuntimeSource({
  target,
  packageDirectory,
  releaseManifest,
  compatibilityManifest,
}) {
  if (releaseManifest?.dsh?.baseCommit !== compatibilityManifest?.dsh?.baseCommit) {
    throw new Error('Compatible runtime release and compatibility manifests pin different DSH revisions.')
  }

  const { manifest } = loadManifest(packageDirectory, compatibilityManifest)
  applyCompatibility({ target, packageDirectory, manifest })
  return {
    compatibilityVersion: verifyCompatibility({ target, packageDirectory, manifest }),
    baseCommit: manifest.dsh.baseCommit,
  }
}

/**
 * Build and deploy the patched production closure from one explicit DSH source
 * checkout. The output must be outside that checkout so source provenance and
 * generated bundle contents cannot be confused.
 */
export function buildCompatibleRuntime({ outputDirectory, run = defaultRun, ...options }) {
  const target = resolve(options.target)
  const output = resolve(outputDirectory)
  const relativeOutput = relative(target, output)
  if (relativeOutput === '' || (!relativeOutput.startsWith('..') && !relativeOutput.includes(`..${process.platform === 'win32' ? '\\' : '/'}`))) {
    throw new Error('Compatible runtime output must be outside the DSH source checkout.')
  }

  const prepared = prepareCompatibleRuntimeSource(options)
  run('pnpm', ['install', '--frozen-lockfile'], { cwd: target })
  run('pnpm', ['run', 'build'], { cwd: target })
  run('pnpm', ['--filter', '@deepseek-ai/dsh', 'deploy', output, '--prod', '--legacy'], { cwd: target })
  return { ...prepared, outputDirectory: output }
}

function defaultRun(command, args, { cwd }) {
  execFileSync(command, args, { cwd, stdio: 'inherit' })
}
