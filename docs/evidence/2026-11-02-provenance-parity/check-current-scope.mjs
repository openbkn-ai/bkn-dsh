import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile, readdir } from 'node:fs/promises'
import { test } from 'node:test'

const root = new URL('../../../', import.meta.url)
const baseline = JSON.parse(await readFile(new URL('packages/openbkn-business-context/tests/fixtures/provenance-parity/protected-source-files.json', root), 'utf8'))

test('provenance parity keeps unrelated plugin source byte-for-byte at the local baseline', async () => {
  const changed = []
  for (const entry of baseline.protectedFiles) {
    const bytes = await readFile(new URL(entry.path, root))
    const actual = createHash('sha256').update(bytes).digest('hex')
    if (actual !== entry.sha256) changed.push(entry.path)
  }
  assert.deepEqual(changed, [], `Unrelated source changed from ${baseline.baselineCommit}`)
  assert.ok(baseline.protectedFiles.some(entry => /authentication|auth|login/.test(entry.path)), 'Authentication must remain protected')
  assert.ok(baseline.protectedFiles.some(entry => /mcp/.test(entry.path)), 'MCP must remain protected')
})

test('new source files remain confined to the provenance detail surface and its Host transport', async()=>{
  const known=new Set([...baseline.protectedFiles.map(entry=>entry.path),...Object.keys(baseline.allowedExistingFiles)])
  const allowed=/^packages\/openbkn-business-context\/src\/(?:provenance-detail[^/]*\.ts|client\/provenance-(?:browser-actions|detail-bridge)\.ts|client\/platform-provenance\/.+)$/
  const unexpected=[]
  const scan=async(directory,prefix)=>{
    for(const entry of await readdir(directory,{withFileTypes:true})) {
      const relative=`${prefix}/${entry.name}`
      if(entry.isDirectory())await scan(new URL(`${entry.name}/`,directory),relative)
      else if(!known.has(relative)&&!allowed.test(relative))unexpected.push(relative)
    }
  }
  await scan(new URL('packages/openbkn-business-context/src/',root),'packages/openbkn-business-context/src')
  assert.deepEqual(unexpected,[],'New unrelated plugin source must not be introduced by the provenance work')
})
