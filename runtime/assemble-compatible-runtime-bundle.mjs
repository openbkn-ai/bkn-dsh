import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync, chmodSync } from 'node:fs'
import { basename, join, resolve } from 'node:path'

const patchedDependencies = [
  '@deepseek-ai/dsh-mcp-client',
  '@deepseek-ai/dsh-session',
  '@deepseek-ai/dsh-typert-generator',
]

function assertFile(path, message) {
  if (!existsSync(path)) throw new Error(message)
}

function archiveFor(manifest, platform) {
  const archive = manifest?.bundle?.archives?.find((entry) => entry.platform === platform)
  if (archive === undefined) throw new Error(`Compatible runtime manifest does not support ${platform}.`)
  return archive
}

function launcher() {
  return `#!/usr/bin/env sh
set -eu
bundle_dir=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
: "\${OPENBKN_DSH_HOME:=\${XDG_DATA_HOME:-$HOME/.local/share}/openbkn-dsh}"
export DSH_HOME="$OPENBKN_DSH_HOME"
exec node "$bundle_dir/runtime/lib/bin.js" "$@"
`
}

function windowsLauncher() {
  return `@echo off
setlocal
if "%OPENBKN_DSH_HOME%"=="" set "OPENBKN_DSH_HOME=%LOCALAPPDATA%\\OpenBKN\\dsh"
set "DSH_HOME=%OPENBKN_DSH_HOME%"
node "%~dp0..\\runtime\\lib\\bin.js" %*
`
}

/**
 * Copy a pre-deployed DSH CLI and its patched production closure into one
 * user-unpackable bundle. It deliberately accepts no global DSH path.
 */
export function assembleCompatibleRuntimeBundle({ runtimeDirectory, outputDirectory, pluginTarball, manifest, platform }) {
  const runtime = resolve(runtimeDirectory)
  const output = resolve(outputDirectory)
  const plugin = resolve(pluginTarball)
  const archive = archiveFor(manifest, platform)
  assertFile(join(runtime, 'lib', 'bin.js'), 'Compatible runtime source is missing its built DSH CLI.')
  for (const dependency of patchedDependencies) {
    assertFile(join(runtime, 'node_modules', dependency), `Compatible runtime source is missing patched dependency closure: ${dependency}`)
  }
  assertFile(plugin, 'Compatible runtime plugin tarball does not exist.')

  const directory = join(output, basename(archive.file).replace(/\.(tar\.gz|zip)$/, ''))
  if (existsSync(directory)) throw new Error(`Compatible runtime bundle already exists: ${directory}`)
  mkdirSync(join(directory, 'bin'), { recursive: true })
  cpSync(runtime, join(directory, 'runtime'), { recursive: true, dereference: true })
  mkdirSync(join(directory, 'plugins'), { recursive: true })
  cpSync(plugin, join(directory, 'plugins', manifest.plugin.artifact))
  writeFileSync(join(directory, 'runtime-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`)
  const launcherPath = join(directory, 'bin', 'dsh')
  writeFileSync(launcherPath, launcher())
  chmodSync(launcherPath, 0o755)
  if (platform.startsWith('win32-')) {
    writeFileSync(join(directory, 'bin', 'dsh.cmd'), windowsLauncher())
  }
  return { directory, archive }
}
