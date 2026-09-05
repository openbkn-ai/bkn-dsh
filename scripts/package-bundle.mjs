#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

const repository = resolve(import.meta.dirname, '..')
const packageDirectory = resolve(repository, 'packages/openbkn-business-context')
const required = new Set([
  'cordis.patch.yml',
  'lib/client.js',
  'lib/index.js',
  'lib/typert.host.js',
  'lib/typert.remote-client.js',
  'runner/openbkn_dsh_runner/operations.py',
  'runner/pyproject.toml',
  'schemas/runner-request.schema.json',
  'schemas/runner-response.schema.json',
])
const forbidden = [
  '.git/', '.env', 'node_modules/', 'src/', 'tests/', 'docs/',
  '.pyc', '__pycache__/', 'prototype/',
]

if (!existsSync(packageDirectory)) throw new Error(`Package directory is missing: ${packageDirectory}`)
const raw = execFileSync('pnpm', ['pack', '--dry-run', '--json'], { cwd: packageDirectory, encoding: 'utf8' })
const packed = JSON.parse(raw)
if (!Array.isArray(packed.files)) throw new Error('pnpm pack did not return a file manifest.')
const paths = packed.files.map(file => file.path)
for (const path of required) {
  if (!paths.includes(path)) throw new Error(`Release package is missing required asset: ${path}`)
}
for (const path of paths) {
  if (forbidden.some(fragment => path === fragment || path.includes(fragment))) {
    throw new Error(`Release package contains a forbidden development or secret-adjacent path: ${path}`)
  }
}
console.log(`Package audit passed: ${packed.name}@${packed.version} (${paths.length} files)`)
for (const path of required) console.log(path)
