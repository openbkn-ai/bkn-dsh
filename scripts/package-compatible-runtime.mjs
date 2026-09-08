import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { assembleCompatibleRuntimeBundle } from '../runtime/assemble-compatible-runtime-bundle.mjs'
import { loadRuntimeManifest } from '../runtime/runtime-manifest.mjs'

const repository = resolve(fileURLToPath(new URL('..', import.meta.url)))

function archiveFor(manifest, platform) {
  const archive = manifest.bundle.archives.find(entry => entry.platform === platform)
  if (archive === undefined) throw new Error(`Compatible runtime manifest does not support ${platform}.`)
  return archive
}

export function windowsCompressArchiveCommand(directory, destination) {
  const quote = (value) => `'${value.replaceAll("'", "''")}'`
  return `Compress-Archive -LiteralPath ${quote(directory)} -DestinationPath ${quote(destination)} -Force`
}

function defaultArchive({ directory, destination, format }) {
  if (format === 'tar.gz') {
    execFileSync('tar', ['-C', resolve(directory, '..'), '-czf', destination, basename(directory)], { stdio: 'inherit' })
    return
  }
  if (format === 'zip') {
    if (process.platform === 'win32') {
      execFileSync('powershell.exe', ['-NoProfile', '-Command', windowsCompressArchiveCommand(directory, destination)], { stdio: 'inherit' })
      return
    }
    execFileSync('zip', ['-qr', destination, basename(directory)], { cwd: resolve(directory, '..'), stdio: 'inherit' })
    return
  }
  throw new Error(`Unsupported compatible runtime archive format: ${format}.`)
}

/** Assemble exactly one declared platform bundle and publish its SHA-256 sidecar. */
export function packageCompatibleRuntime({
  runtimeDirectory,
  profileDirectory,
  pluginTarball,
  outputDirectory,
  platform,
  manifest,
  assemble = assembleCompatibleRuntimeBundle,
  archive = defaultArchive,
}) {
  const declared = archiveFor(manifest, platform)
  const output = resolve(outputDirectory)
  mkdirSync(output, { recursive: true })
  const bundle = assemble({ runtimeDirectory, profileDirectory, outputDirectory: output, pluginTarball, manifest, platform })
  const destination = join(output, declared.file)
  if (existsSync(destination)) throw new Error(`Compatible runtime archive already exists: ${destination}`)
  const format = declared.file.endsWith('.tar.gz') ? 'tar.gz' : declared.file.endsWith('.zip') ? 'zip' : undefined
  if (format === undefined) throw new Error(`Compatible runtime archive has an unsupported suffix: ${declared.file}`)
  archive({ directory: bundle.directory, destination, format })
  const digest = createHash('sha256').update(readFileSync(destination)).digest('hex')
  const checksum = `${destination}.sha256`
  writeFileSync(checksum, `${digest}  ${declared.file}\n`)
  return { directory: bundle.directory, archive: destination, checksum }
}

function valueAfter(args, flag) {
  const index = args.indexOf(flag)
  return index === -1 ? undefined : args[index + 1]
}

export function runPackageCompatibleRuntime(args, { packageRuntime = packageCompatibleRuntime } = {}) {
  const runtimeDirectory = valueAfter(args, '--runtime')
  const profileDirectory = valueAfter(args, '--profile')
  const pluginTarball = valueAfter(args, '--plugin')
  const outputDirectory = valueAfter(args, '--output')
  const platform = valueAfter(args, '--platform')
  if ([runtimeDirectory, profileDirectory, pluginTarball, outputDirectory, platform].some(value => value === undefined)) {
    throw new Error('Usage: node scripts/package-compatible-runtime.mjs --runtime <runtime-directory> --profile <native-plugin-managed-web-profile> --plugin <plugin-tgz> --output <release-directory> --platform <darwin-arm64|darwin-x64|win32-x64>')
  }
  const manifest = loadRuntimeManifest(new URL('../runtime/openbkn-dsh-runtime.manifest.json', import.meta.url))
  return packageRuntime({ runtimeDirectory, profileDirectory, pluginTarball, outputDirectory, platform, manifest })
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    const result = runPackageCompatibleRuntime(process.argv.slice(2))
    console.log(`OpenBKN-compatible runtime archive: ${result.archive}`)
    console.log(`SHA-256: ${result.checksum}`)
  } catch (error) {
    console.error(`OpenBKN-compatible runtime packaging: ${error.message}`)
    process.exitCode = 1
  }
}
