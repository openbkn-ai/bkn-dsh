import { cpSync, existsSync, mkdirSync, readFileSync, realpathSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const profileDirectory = home => join(resolve(home), 'profiles', 'web')

/** Return true only when the exact bundled plugin is both installed and active. */
export function pluginIsInstalled({ home, packageName, version }) {
  return pluginIsInProfile({ profile: profileDirectory(home), packageName, version })
}

function pluginIsInProfile({ profile, packageName, version }) {
  const profileManifest = join(profile, 'package.json')
  const pluginManifest = join(profile, 'node_modules', ...packageName.split('/'), 'package.json')
  if (!existsSync(profileManifest) || !existsSync(pluginManifest)) return false
  const profileJson = JSON.parse(readFileSync(profileManifest, 'utf8'))
  const pluginJson = JSON.parse(readFileSync(pluginManifest, 'utf8'))
  return pluginJson.version === version
    && profileJson.dsh?.profile?.bundles?.includes(packageName) === true
}

/**
 * Seed a new isolated home from a profile created at release time through
 * DSH's native plugin manager. End users do not need a package registry.
 */
export function initializeProfile({ home, template, packageName, version }) {
  if (pluginIsInstalled({ home, packageName, version })) return false
  const profile = profileDirectory(home)
  if (existsSync(profile)) throw new Error('OpenBKN runtime home has a web profile without the matching bundled plugin.')
  if (!pluginIsInProfile({ profile: resolve(template), packageName, version })) {
    throw new Error('OpenBKN runtime profile template is missing the matching bundled plugin.')
  }
  mkdirSync(resolve(home), { recursive: true })
  cpSync(template, profile, { recursive: true, dereference: true })
  return true
}

if (process.argv[1] !== undefined && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
  const [home, template, packageName, version] = process.argv.slice(2)
  if ([home, template, packageName, version].some(value => value === undefined)) {
    throw new Error('Usage: bootstrap-openbkn-plugin.mjs <home> <profile-template> <package-name> <version>')
  }
  initializeProfile({ home, template, packageName, version })
}
