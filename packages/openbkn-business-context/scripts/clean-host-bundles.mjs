#!/usr/bin/env node
/**
 * Remove stale generated JavaScript from lib/ before a host build.
 *
 * tsdown runs with clean:false so the tsc declaration output in lib/types
 * survives, which also means a renamed hash chunk from an earlier build
 * stays behind and would ship in the package. Wipe only the generated .js
 * files (never the tsc-owned types) immediately before tsdown rewrites them.
 * Cross-platform by construction (pure node:fs).
 * @module clean-host-bundles
 */
import { readdirSync, rmSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'

const lib = fileURLToPath(new URL('../lib/', import.meta.url))
let entries
try {
  entries = readdirSync(lib, { withFileTypes: true })
} catch (error) {
  if (error && typeof error === 'object' && error.code === 'ENOENT') process.exit(0)
  throw error
}
for (const entry of entries) {
  if (entry.isFile() && entry.name.endsWith('.js')) rmSync(join(lib, entry.name))
}
