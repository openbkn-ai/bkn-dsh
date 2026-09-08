import { applyCompatibility, loadManifest } from '../compat/dsh-0.1.2-rc.1/apply.mjs'
import { verifyCompatibility } from '../compat/dsh-0.1.2-rc.1/verify.mjs'
import { execFileSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, readFileSync } from 'node:fs'
import { dirname, join, relative, resolve, sep } from 'node:path'

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
  run(pnpmCommand(), ['install', '--frozen-lockfile'], { cwd: target })
  run(pnpmCommand(), ['run', 'build'], { cwd: target })
  run(pnpmCommand(), [
    '--filter',
    'dsh-python-runtime-closure',
    'deploy',
    output,
    '--legacy',
    '--prod',
    '--config.node-linker=hoisted',
    '--config.auto-install-peers=false',
    '--config.link-workspace-packages=true',
  ], { cwd: target })
  restoreLegacyDeployHoists({ target, outputDirectory: output })
  return { ...prepared, outputDirectory: output }
}

function pnpmCommand() {
  return process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'
}

/**
 * pnpm legacy deploy may leave direct closure dependencies next to the source
 * closure rather than in its target. Restore only those declared dependencies
 * from the explicit build source; nested dependency trees stay owned by the
 * deployed closure and are never copied.
 */
export function restoreLegacyDeployHoists({ target, outputDirectory }) {
  const output = resolve(outputDirectory)
  const packageJson = join(output, 'package.json')
  if (!existsSync(packageJson)) throw new Error('Runtime closure deploy did not produce package.json.')
  const manifest = JSON.parse(readFileSync(packageJson, 'utf8'))
  const sourceNodeModules = join(resolve(target), 'python', 'sdk-runtime', 'node_modules')
  for (const dependency of Object.keys(manifest.dependencies ?? {}).sort()) {
    const destination = join(output, 'node_modules', dependency)
    if (existsSync(destination)) continue
    const source = join(sourceNodeModules, dependency)
    if (!existsSync(source)) throw new Error(`Runtime closure dependency is missing from deploy and source: ${dependency}.`)
    mkdirSync(dirname(destination), { recursive: true })
    const nestedNodeModules = join(source, 'node_modules')
    cpSync(source, destination, {
      recursive: true,
      dereference: true,
      filter: path => path !== nestedNodeModules && !path.startsWith(`${nestedNodeModules}${sep}`),
    })
  }
}

function defaultRun(command, args, { cwd }) {
  // Node cannot execute a Windows .cmd shim directly without a shell.
  execFileSync(command, args, { cwd, stdio: 'inherit', shell: process.platform === 'win32' })
}
