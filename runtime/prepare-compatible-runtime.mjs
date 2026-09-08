import { applyCompatibility, loadManifest } from '../compat/dsh-0.1.2-rc.1/apply.mjs'
import { verifyCompatibility } from '../compat/dsh-0.1.2-rc.1/verify.mjs'

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
