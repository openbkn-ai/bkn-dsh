import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { absolutizeRepositoryLinks, changelogSection, renderPluginReleaseNotes } from '../scripts/plugin-release-notes.mjs'

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

test('relative links resolve against the released ref; absolute, anchor and rooted links stay', () => {
  const input = 'see [review](docs/reviews/r.md), [x](./CHANGELOG.md), [pr](https://github.com/o/r/pull/1), [top](#changes), [root](/abs)'
  assert.equal(absolutizeRepositoryLinks(input, 'v1.0.0'),
    'see [review](https://github.com/openbkn-ai/bkn-dsh/blob/v1.0.0/docs/reviews/r.md), [x](https://github.com/openbkn-ai/bkn-dsh/blob/v1.0.0/CHANGELOG.md), [pr](https://github.com/o/r/pull/1), [top](#changes), [root](/abs)')
})

test('rendered notes carry no relative link and no unconditional provenance claim', () => {
  const notes = renderPluginReleaseNotes({
    version: '1.0.0', packageName: '@openbkn/dsh-business-context', dshTag: 'dsh-v1.0.0',
    changelog: '## 1.0.0\n\nFixed, see [review](docs/reviews/r.md).\n',
  })
  assert.match(notes, /\]\(https:\/\/github\.com\/openbkn-ai\/bkn-dsh\/blob\/v1\.0\.0\/docs\/reviews\/r\.md\)/)
  assert.doesNotMatch(notes, /provenance/)
})
