import assert from 'node:assert/strict'
import test from 'node:test'

import { replaceGeneratorOverride } from '../scripts/configure-pinned-dsh-generator.mjs'

const workspace = `packages:\n  - packages/*\n\noverrides:\n  '@deepseek-ai/dsh-typert-generator': link:../../../../../DSH/deepseek-harness/packages/typert/generator\n`

test('replaces exactly the development-only generator override', () => {
  assert.equal(
    replaceGeneratorOverride(workspace, 'link:release/deepseek-harness/packages/typert/generator'),
    workspace.replace('../../../../../DSH/deepseek-harness', 'release/deepseek-harness'),
  )
})

test('refuses an unexpected workspace override shape', () => {
  assert.throws(() => replaceGeneratorOverride('packages: []\n', 'link:release/deepseek-harness/packages/typert/generator'), /exactly one/)
})
