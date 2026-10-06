#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const repository = resolve(import.meta.dirname, '..')
const packageDirectory = resolve(repository, 'packages/openbkn-business-context')
const required = new Set([
  'cordis.patch.yml',
  'lib/client.js',
  'lib/index.js',
  'lib/business.js',
  'lib/diagnostics.js',
  'lib/typert.host.js',
  'lib/typert.remote-client.js',
])
const forbidden = [
  '.git/', '.env', 'node_modules/', 'src/', 'tests/', 'docs/',
  '.pyc', '__pycache__/', 'prototype/',
]

if (!existsSync(packageDirectory)) throw new Error(`Package directory is missing: ${packageDirectory}`)
/** Enumerate every file path the manifest's identity fields point at. */
export function declaredTargets(manifest) {
  const targets = []
  if (typeof manifest.main === 'string') targets.push(manifest.main)
  if (typeof manifest.types === 'string') targets.push(manifest.types)
  // Export conditions nest (e.g. import -> default); walk the whole tree so
  // a dangling pointer cannot hide on an inner level.
  const walk = node => {
    if (typeof node === 'string') { targets.push(node); return }
    if (node === null || typeof node !== 'object') return
    for (const value of Object.values(node)) walk(value)
  }
  walk(manifest.exports)
  // Only the self-referential ./package.json escape hatch is guaranteed by
  // npm itself; a target that merely starts with it must be audited.
  return targets.filter(target => target !== './package.json')
}

export function parsePackManifest(raw, cwd) {
  try {
    return JSON.parse(raw)
  } catch (error) {
    // pnpm emitting anything other than the promised JSON (warnings, prompts,
    // registry errors) must abort the audit, not be mistaken for a manifest.
    throw new Error(`pnpm pack --dry-run output is not the expected JSON manifest; run it manually in ${cwd} to inspect what pnpm printed. (${String(error)})`, { cause: error })
  }
}

// Spawning a .cmd through Node requires a shell since the 2024 security
// change; plain `pnpm` resolves inside that shell on Windows.
if (process.argv[1] === import.meta.filename || process.argv[1] === resolve(import.meta.dirname, 'package-bundle.mjs')) {
const raw = execFileSync('pnpm', ['pack', '--dry-run', '--json'], {
  cwd: packageDirectory,
  encoding: 'utf8',
  shell: process.platform === 'win32',
})
const packed = parsePackManifest(raw, packageDirectory)
if (!Array.isArray(packed.files)) throw new Error('pnpm pack did not return a file manifest.')
const paths = packed.files.map(file => file.path)
for (const path of required) {
  if (!paths.includes(path)) throw new Error(`Release package is missing required asset: ${path}`)
}
// Every target the manifest itself declares (main, top-level types, and each
// exports subpath's types/default) must be inside the tarball; a dangling
// declaration fails downstream consumers exactly like a missing file.
const manifest = JSON.parse(readFileSync(join(packageDirectory, 'package.json'), 'utf8'))
for (const target of declaredTargets(manifest)) {
  const normalized = target.replace(/^\.\//, '')
  if (!paths.includes(normalized)) throw new Error(`package.json declares ${target} but the tarball does not contain it`)
}

for (const path of paths) {
  if (forbidden.some(fragment => path === fragment || path.includes(fragment))) {
    throw new Error(`Release package contains a forbidden development or secret-adjacent path: ${path}`)
  }
}
console.log(`Package audit passed: ${packed.name}@${packed.version} (${paths.length} files)`)
for (const path of required) console.log(path)
}
