import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { buildCompatibleRuntime } from '../runtime/prepare-compatible-runtime.mjs'
import { loadRuntimeManifest } from '../runtime/runtime-manifest.mjs'

const repository = resolve(fileURLToPath(new URL('..', import.meta.url)))

function valueAfter(args, flag) {
  const index = args.indexOf(flag)
  return index === -1 ? undefined : args[index + 1]
}

export function runBuildCompatibleRuntime(args, { build = buildCompatibleRuntime } = {}) {
  const target = valueAfter(args, '--dsh')
  const outputDirectory = valueAfter(args, '--output')
  if (target === undefined || outputDirectory === undefined) {
    throw new Error('Usage: node scripts/build-compatible-runtime.mjs --dsh <clean-dsh-source> --output <runtime-directory>')
  }
  const releaseManifest = loadRuntimeManifest(new URL('../runtime/openbkn-dsh-runtime.manifest.json', import.meta.url))
  const packageDirectory = resolve(repository, releaseManifest.compatibility.directory)
  const compatibilityManifest = JSON.parse(readFileSync(resolve(packageDirectory, 'manifest.json'), 'utf8'))
  return build({ target, outputDirectory, releaseManifest, compatibilityManifest, packageDirectory })
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    const result = runBuildCompatibleRuntime(process.argv.slice(2))
    console.log(`OpenBKN-compatible runtime source deployed to ${result.outputDirectory}.`)
  } catch (error) {
    console.error(`OpenBKN-compatible runtime build: ${error.message}`)
    process.exitCode = 1
  }
}
