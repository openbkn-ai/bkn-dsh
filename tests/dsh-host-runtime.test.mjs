import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { inspectDshClosure } from '../scripts/test-dsh-hosts.mjs'

test('runtime identity inspection refuses a nested DSH copy even when direct pins agree', () => {
  const directory = mkdtempSync(join(tmpdir(), 'dsh-runtime-identity-'))
  const write = (path, value) => {
    mkdirSync(path, { recursive: true })
    writeFileSync(join(path, 'package.json'), JSON.stringify(value))
  }
  try {
    write(directory, { dependencies: { '@deepseek-ai/dsh-a': '0.2.0-rc.2' } })
    write(join(directory, 'node_modules/@openbkn/dsh-business-context'), { name: '@openbkn/dsh-business-context' })
    const a = join(directory, 'node_modules/@deepseek-ai/dsh-a')
    write(a, { name: '@deepseek-ai/dsh-a', version: '0.2.0-rc.2', dependencies: { '@deepseek-ai/dsh-b': '0.2.0-rc.2' } })
    write(join(directory, 'node_modules/@deepseek-ai/dsh-b'), { name: '@deepseek-ai/dsh-b', version: '0.2.0-rc.2' })
    write(join(a, 'node_modules/@deepseek-ai/dsh-b'), { name: '@deepseek-ai/dsh-b', version: '0.2.0-rc.2' })
    assert.equal(Object.keys(inspectDshClosure(directory, '0.2.0-rc.2')).length, 2)
    write(join(a, 'node_modules/@deepseek-ai/dsh-b'), { name: '@deepseek-ai/dsh-b', version: '0.2.1-rc.3' })
    assert.throws(() => inspectDshClosure(directory, '0.2.0-rc.2'), /Mixed DSH runtime/)
  } finally { rmSync(directory, { recursive: true, force: true }) }
})
