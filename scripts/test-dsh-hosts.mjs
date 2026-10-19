import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import { readDshHosts } from './dsh-host-compatibility.mjs'

const repository = fileURLToPath(new URL('..', import.meta.url))
const probeDirectory = join(repository, 'packages/openbkn-business-context/tests/probes')
const additionalPackages = ['llm', 'agent-loop', 'session-projection', 'api-gateway', 'typert-registry', 'client-locale', 'client-connection']

/** Inspect the resolved runtime closure, including nested copies hidden by a top-level pin. */
export function inspectDshClosure(directory, version, cordis) {
  const visited = new Set(), found = new Map()
  const rootRequire = createRequire(resolve(directory, 'package.json'))
  const cordisPath = cordis === undefined ? undefined : rootRequire.resolve('@deepseek-ai/cordis/package.json')
  if (cordisPath && JSON.parse(readFileSync(cordisPath, 'utf8')).version !== cordis) throw new Error(`Unexpected host Cordis; expected ${cordis}`)
  function visit(manifestPath) {
    if (visited.has(manifestPath)) return
    visited.add(manifestPath)
    const pkg = JSON.parse(readFileSync(manifestPath, 'utf8'))
    if (pkg.name?.startsWith('@deepseek-ai/dsh-')) {
      if (pkg.version !== version) throw new Error(`Mixed DSH runtime: ${pkg.name}@${pkg.version}; expected ${version}`)
      found.set(pkg.name, pkg.version)
    }
    const require = createRequire(manifestPath)
    if (cordisPath && (pkg.dependencies?.['@deepseek-ai/cordis'] || pkg.peerDependencies?.['@deepseek-ai/cordis'])
      && require.resolve('@deepseek-ai/cordis/package.json') !== cordisPath) throw new Error(`Split Cordis runtime from ${manifestPath}`)
    for (const name of Object.keys({ ...pkg.dependencies, ...pkg.peerDependencies })) {
      // Runtime identity matters here; optional platform packages may be absent.
      if (!name.startsWith('@deepseek-ai/dsh-')) continue
      let dependency
      try { dependency = require.resolve(`${name}/package.json`) }
      catch (error) {
        if (pkg.peerDependenciesMeta?.[name]?.optional) continue
        throw new Error(`Cannot inspect ${name} from ${manifestPath}`, { cause: error })
      }
      visit(dependency)
    }
  }
  visit(resolve(directory, 'package.json'))
  const require = createRequire(resolve(directory, 'package.json'))
  visit(require.resolve('@openbkn/dsh-business-context/package.json'))
  return Object.fromEntries([...found].sort(([left], [right]) => left.localeCompare(right)))
}

function run(command, args, options) {
  const { log, ...spawnOptions } = options
  const result = spawnSync(command, args, {
    timeout: 600_000, ...spawnOptions, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024,
    shell: process.platform === 'win32' && command === 'corepack',
  })
  if (log) writeFileSync(log, `${result.stdout ?? ''}${result.stderr ?? ''}`)
  if (result.error || result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed; inspect ${options.log}`, { cause: result.error })
  }
  return result.stdout
}

/** Controlled npm-package runtime checks, never a Desktop/platform/model acceptance run. */
export function testDshHosts({ plugin, output }) {
  const matrix = readDshHosts()
  const source = resolve(plugin), target = resolve(output)
  const bytes = readFileSync(source)
  if (existsSync(target)) throw new Error(`Use a fresh output directory; refusing to overwrite ${target}`)
  mkdirSync(target, { recursive: true })
  const artifact = join(target, 'candidate.tgz')
  copyFileSync(source, artifact)
  const report = {
    evidence: 'controlled official npm runtime; stand-in platform and scripted model only',
    artifact: { sha256: createHash('sha256').update(bytes).digest('hex') },
    node: process.version, platform: process.platform, arch: process.arch, hosts: [],
  }
  writeFileSync(join(target, 'report.json'), JSON.stringify(report, null, 2) + '\n')
  // Read candidate metadata without executing package code.
  const packed = JSON.parse(run('tar', ['-xzOf', artifact, 'package/package.json'], { cwd: target, log: join(target, 'package.log') }))
  report.artifact.version = packed.version
  for (const host of matrix.hosts) {
    const directory = join(target, host.version)
    mkdirSync(directory)
    const dependencies = {
      '@deepseek-ai/cordis': host.cordis,
      '@deepseek-ai/schemastery': host.schemastery,
      ...Object.fromEntries(Object.keys(packed.peerDependencies ?? {})
        .filter(name => name.startsWith('@deepseek-ai/dsh-')).map(name => [name, host.version])),
      ...Object.fromEntries(additionalPackages.map(name => [`@deepseek-ai/dsh-${name}`, host.version])),
      ...(host.version === '0.2.1-rc.2' ? { '@deepseek-ai/dsh-api-remote-access': host.version } : {}),
      '@openbkn/dsh-business-context': 'file:../candidate.tgz',
      zod: '4.4.3',
    }
    writeFileSync(join(directory, 'package.json'), JSON.stringify({
      name: `bkn-dsh-host-${host.version}`, private: true, type: 'module',
      packageManager: host.packageManager, dependencies,
    }, null, 2) + '\n')
    writeFileSync(join(directory, 'pnpm-workspace.yaml'), 'packages: []\noverrides:\n  zod: 4.4.3\n')
    const entry = { ...host, checks: {}, status: 'running' }
    report.hosts.push(entry)
    try {
      run('corepack', [host.packageManager, 'install', '--ignore-scripts', '--strict-peer-dependencies'], {
        cwd: directory, log: join(directory, 'install.log'),
      })
      entry.resolvedDsh = inspectDshClosure(directory, host.version, host.cordis)
      const require = createRequire(join(directory, 'package.json'))
      entry.resolvedSchemaVersion = require('@deepseek-ai/schemastery/package.json').version
      entry.resolvedZodVersion = require('zod/package.json').version
      if (entry.resolvedSchemaVersion !== host.schemastery || entry.resolvedZodVersion !== '4.4.3') throw new Error('Runtime schema dependencies disagree with the reviewed host')
      const candidate = resolve(require.resolve('@openbkn/dsh-business-context/package.json'), '..')
      const env = { ...process.env, DSH_HOME: join(directory, 'home') }
      for (const [name, script, args] of [
        ['guard-formal', 'guard-runtime.probe.mjs', ['--runtime', directory, '--plugin', candidate, '--contract', 'formal']],
        ['guard-formal-disabled', 'guard-runtime.probe.mjs', ['--runtime', directory, '--plugin', candidate, '--contract', 'formal', '--capture', 'disabled']],
        ['guard-legacy', 'guard-runtime.probe.mjs', ['--runtime', directory, '--plugin', candidate]],
        ['native-output', 'native-output-runtime.probe.mjs', ['--runtime', directory, '--plugin', candidate]],
        ['remote', 'remote-host.probe.mjs', ['--runtime', directory, '--plugin', candidate]],
      ]) {
        run(process.execPath, [join(probeDirectory, script), ...args], { cwd: directory, env, timeout: 120_000, log: join(directory, `${name}.log`) })
        entry.checks[name] = 'pass'
      }
      entry.status = 'pass'
    } catch (error) {
      entry.status = 'fail'
      entry.error = error.message
    } finally {
      writeFileSync(join(target, 'report.json'), JSON.stringify(report, null, 2) + '\n')
    }
  }
  return report
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { values } = parseArgs({ options: { plugin: { type: 'string' }, output: { type: 'string' } } })
  if (!values.plugin || !values.output) throw new Error('Usage: node scripts/test-dsh-hosts.mjs --plugin <tgz> --output <fresh directory>')
  const report = testDshHosts(values)
  console.log(JSON.stringify(report, null, 2))
  if (report.hosts.some(host => host.status !== 'pass')) process.exitCode = 1
}
