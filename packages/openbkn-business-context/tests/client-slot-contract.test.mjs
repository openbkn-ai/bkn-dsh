import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const source = await readFile(new URL('../src/client/index.tsx', import.meta.url), 'utf8')

test('OpenBKN UI remains additive and does not replace native DSH surfaces', () => {
  assert.match(source, /sidebar\.footer\.action/)
  assert.match(source, /shell\.overlay/)
  assert.match(source, /conversation\.session\.header\.actions/)
  assert.match(source, /conversation\.input\.dock/)
  assert.match(source, /conversation\.chat\.assistant-actions/)
  assert.match(source, /tool\.call\.toolview/)
  assert.doesNotMatch(source, /name:\s*['"]root['"]|name:\s*['"]sidebar['"]|name:\s*['"]conversation['"]|data-conversation-scroll/)
})

test('OpenBKN client mounts its generated Remote contribution before using its namespace', () => {
  assert.match(source, /import\s+openbknBusinessContextRemote\s+from\s+['"]@openbkn\/dsh-business-context\/remote['"]/,)
  assert.match(source, /await\s+ctx\.remote\.\$mount\(openbknBusinessContextRemote\)/)
  assert.match(source, /ctx\.inject\(\[[^\]]*['"]remote\.openbknBusinessContext['"]/s)
})

test('OpenBKN client bundles the Remote schema runtime instead of requiring an unmaterialized dependency', async () => {
  const bundle = await readFile(new URL('../lib/client.js', import.meta.url), 'utf8')
  assert.doesNotMatch(bundle, /require\(["']zod["']\)/)
})
