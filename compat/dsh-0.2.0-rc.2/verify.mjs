import { fileURLToPath } from 'node:url'
import { inspectTarget, isExactlyApplied, loadManifest, packageRoot } from './apply.mjs'

/** Verify the full compatibility series without reading credentials or changing the target. */
export function verifyCompatibility({ target: targetPath, packageDirectory = packageRoot, manifest: suppliedManifest }) {
  const { manifest, patches } = loadManifest(packageDirectory, suppliedManifest)
  const { target } = inspectTarget(targetPath, { expectedBaseCommit: manifest.dsh.baseCommit })
  if (!isExactlyApplied(target, patches)) {
    throw new Error('OpenBKN DSH compatibility is not applied exactly; refusing to infer support.')
  }
  return manifest.compatibilityVersion
}

function main() {
  const targetFlag = process.argv.indexOf('--dsh')
  if (targetFlag === -1 || process.argv[targetFlag + 1] === undefined) {
    throw new Error('Usage: node verify.mjs --dsh <patched-dsh-source-checkout>')
  }
  const version = verifyCompatibility({ target: process.argv[targetFlag + 1] })
  console.log(`OpenBKN DSH compatibility verified: ${version}.`)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    main()
  } catch (error) {
    console.error(`OpenBKN DSH compatibility: ${error.message}`)
    process.exitCode = 1
  }
}
