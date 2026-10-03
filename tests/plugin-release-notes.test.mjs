import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { changelogSection, renderPluginReleaseNotes } from '../scripts/plugin-release-notes.mjs'

const changelog = [
  '# Changelog', '',
  '## 1.2.3-rc.1-openbkn.0.2.0-1 (2026-10-02)', '', 'Second entry.', '', '- fix A', '',
  '## 1.2.3-rc.1-openbkn.0.2.0 (2026-09-29)', '', 'First entry.', '',
].join('\n')

test('extracts exactly one version section, not a version it is a prefix of', () => {
  assert.equal(changelogSection(changelog, '1.2.3-rc.1-openbkn.0.2.0-1'), 'Second entry.\n\n- fix A')
  assert.equal(changelogSection(changelog, '1.2.3-rc.1-openbkn.0.2.0'), 'First entry.')
})

test('refuses a version with no or an empty CHANGELOG section', () => {
  assert.throws(() => changelogSection(changelog, '9.9.9'), /no "## 9\.9\.9" section/)
  assert.throws(() => changelogSection('## 1.0.0\n\n## 0.9.0\n\nx\n', '1.0.0'), /is empty/)
})

test('renders the install command for the exact package version, then the changes', () => {
  const notes = renderPluginReleaseNotes({
    version: '1.2.3-rc.1-openbkn.0.2.0-1', packageName: '@openbkn/dsh-business-context', dshTag: 'dsh-v1.2.3-rc.1', changelog,
  })
  assert.match(notes, /dsh plugin --profile <desktop\|web> add @openbkn\/dsh-business-context@1\.2\.3-rc\.1-openbkn\.0\.2\.0-1\n/)
  assert.match(notes, /## Changes\n\nSecond entry\./)
  assert.doesNotMatch(notes, /First entry/)
})

test('the committed CHANGELOG has a section for the committed plugin version', () => {
  const pkg = JSON.parse(readFileSync(new URL('../packages/openbkn-business-context/package.json', import.meta.url), 'utf8'))
  const committed = readFileSync(new URL('../CHANGELOG.md', import.meta.url), 'utf8')
  assert.ok(changelogSection(committed, pkg.version).length > 0)
})
