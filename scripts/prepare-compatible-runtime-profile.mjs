import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { prepareRuntimeProfile } from '../runtime/prepare-runtime-profile.mjs'

function valueAfter(args, flag) {
  const index = args.indexOf(flag)
  return index === -1 ? undefined : args[index + 1]
}

export function runPrepareCompatibleRuntimeProfile(args, { prepare = prepareRuntimeProfile } = {}) {
  const runtimeDirectory = valueAfter(args, '--runtime')
  const pluginTarball = valueAfter(args, '--plugin')
  const outputDirectory = valueAfter(args, '--output')
  if ([runtimeDirectory, pluginTarball, outputDirectory].some(value => value === undefined)) {
    throw new Error('Usage: node scripts/prepare-compatible-runtime-profile.mjs --runtime <runtime-directory> --plugin <plugin-tgz> --output <profile-directory>')
  }
  return prepare({ runtimeDirectory: resolve(runtimeDirectory), pluginTarball: resolve(pluginTarball), outputDirectory: resolve(outputDirectory) })
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    const result = runPrepareCompatibleRuntimeProfile(process.argv.slice(2))
    console.log(`OpenBKN-compatible runtime profile prepared at ${result}.`)
  } catch (error) {
    console.error(`OpenBKN-compatible runtime profile: ${error.message}`)
    process.exitCode = 1
  }
}
