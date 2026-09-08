import { spawnSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync } from 'node:fs'
import { join, resolve } from 'node:path'

const cliPath = runtime => join(resolve(runtime), 'node_modules', '@deepseek-ai', 'dsh', 'lib', 'bin.js')

/** Create a release-only web profile through DSH's own plugin command. */
export function prepareRuntimeProfile({ runtimeDirectory, pluginTarball, outputDirectory, run = defaultRun }) {
  const runtime = resolve(runtimeDirectory)
  const output = resolve(outputDirectory)
  const cli = cliPath(runtime)
  if (!existsSync(cli)) throw new Error('Compatible runtime is missing its DSH CLI.')
  if (!existsSync(resolve(pluginTarball))) throw new Error('Compatible runtime plugin tarball does not exist.')
  if (existsSync(output)) throw new Error(`Compatible runtime profile output already exists: ${output}`)
  const home = join(output, 'home')
  mkdirSync(home, { recursive: true })
  const result = run(process.execPath, [cli, 'plugin', '--profile', 'web', 'add', `file:${resolve(pluginTarball)}`], {
    env: { ...process.env, DSH_HOME: home }, stdio: 'inherit',
  })
  if (result.status !== 0) throw new Error(`DSH native plugin manager failed while preparing the runtime profile (exit ${result.status}).`)
  const profile = join(home, 'profiles', 'web')
  if (!existsSync(join(profile, 'package.json'))) throw new Error('DSH native plugin manager did not create a web profile.')
  cpSync(profile, output, { recursive: true, dereference: true })
  return output
}

function defaultRun(command, args, options) {
  const result = spawnSync(command, args, options)
  if (result.error !== undefined) throw result.error
  return result
}
