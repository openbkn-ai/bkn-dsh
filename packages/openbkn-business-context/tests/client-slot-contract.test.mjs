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


test('first-use configuration stays independent and the ordinary login UI uses only CLI', async () => {
  const overlay = await readFile(new URL('../src/client/OpenBknOverlay.tsx', import.meta.url), 'utf8')
  assert.match(source, /remote\.openbknConfiguration/)
  assert.match(source, /showSettings:\s*\(\)\s*=>\s*panel\.showSettings\(\)/)
  assert.match(overlay, /OpenBKN 平台地址/)
  assert.match(overlay, /保存并继续/)
  assert.match(overlay, /OpenBKN CLI 执行路径/)
  assert.match(overlay, /使用 OpenBKN CLI 登录并同步/)
  assert.doesNotMatch(overlay, /TokenForm|configureToken|手动输入 Token|兼容无 CLI/)
})
