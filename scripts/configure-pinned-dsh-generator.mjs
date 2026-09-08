import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const developmentOverride = 'link:../../../../../DSH/deepseek-harness/packages/typert/generator'

function valueAfter(args, flag) {
  const index = args.indexOf(flag)
  return index === -1 ? undefined : args[index + 1]
}

export function replaceGeneratorOverride(workspace, target) {
  const occurrences = workspace.split(developmentOverride).length - 1
  if (occurrences !== 1) {
    throw new Error('Expected exactly one local DSH generator override in pnpm-workspace.yaml.')
  }
  return workspace.replace(developmentOverride, target)
}

export function configurePinnedDshGenerator(args, {
  read = readFileSync,
  write = writeFileSync,
  workspaceFile = resolve('pnpm-workspace.yaml'),
} = {}) {
  const dshDirectory = valueAfter(args, '--dsh')
  if (!dshDirectory) {
    throw new Error('Usage: node scripts/configure-pinned-dsh-generator.mjs --dsh <pinned-dsh-source-directory>')
  }

  const generatorDirectory = resolve(dshDirectory, 'packages/typert/generator')
  const relativeGeneratorDirectory = relative(dirname(workspaceFile), generatorDirectory).replaceAll('\\', '/')
  const configured = replaceGeneratorOverride(read(workspaceFile, 'utf8'), `link:${relativeGeneratorDirectory || '.'}`)
  write(workspaceFile, configured)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    configurePinnedDshGenerator(process.argv.slice(2))
  } catch (error) {
    console.error(`Pinned DSH generator configuration: ${error.message}`)
    process.exitCode = 1
  }
}
