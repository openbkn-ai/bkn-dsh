import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import { initializeProfile, pluginIsInstalled } from '../runtime/bootstrap-openbkn-plugin.mjs'

test('recognizes only an exact bundled plugin installed as a web profile layer', () => {
  const home = mkdtempSync(join(tmpdir(), 'openbkn-runtime-home-'))
  assert.equal(pluginIsInstalled({ home, packageName: '@openbkn/dsh-business-context', version: '0.1.3' }), false)

  const profile = join(home, 'profiles', 'web')
  mkdirSync(join(profile, 'node_modules', '@openbkn', 'dsh-business-context'), { recursive: true })
  writeFileSync(join(profile, 'package.json'), JSON.stringify({
    dsh: { profile: { bundles: ['@openbkn/dsh-business-context'] } },
  }))
  writeFileSync(join(profile, 'node_modules', '@openbkn', 'dsh-business-context', 'package.json'), JSON.stringify({ version: '0.1.3' }))

  assert.equal(pluginIsInstalled({ home, packageName: '@openbkn/dsh-business-context', version: '0.1.3' }), true)
  assert.equal(pluginIsInstalled({ home, packageName: '@openbkn/dsh-business-context', version: '0.1.4' }), false)
})

test('copies the release-built, native-plugin-managed profile without network access', () => {
  const home = mkdtempSync(join(tmpdir(), 'openbkn-runtime-home-'))
  const template = mkdtempSync(join(tmpdir(), 'openbkn-runtime-profile-'))
  mkdirSync(join(template, 'node_modules', '@openbkn', 'dsh-business-context'), { recursive: true })
  writeFileSync(join(template, 'package.json'), JSON.stringify({
    dsh: { profile: { bundles: ['@openbkn/dsh-business-context'] } },
  }))
  writeFileSync(join(template, 'node_modules', '@openbkn', 'dsh-business-context', 'package.json'), JSON.stringify({ version: '0.1.3' }))

  assert.equal(initializeProfile({
    home,
    template,
    packageName: '@openbkn/dsh-business-context',
    version: '0.1.3',
  }), true)
  assert.equal(pluginIsInstalled({ home, packageName: '@openbkn/dsh-business-context', version: '0.1.3' }), true)
  assert.equal(initializeProfile({ home, template, packageName: '@openbkn/dsh-business-context', version: '0.1.3' }), false)
})
