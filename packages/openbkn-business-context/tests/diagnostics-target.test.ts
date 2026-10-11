import assert from 'node:assert/strict'
import test from 'node:test'
import { diagnosticsTargetRows } from '../src/client/diagnostics-target.ts'
import type { DiagnosticsTarget } from '../src/diagnostics-contract.ts'

const target: DiagnosticsTarget = {
  hostForm: 'unknown', platform: 'win32', dshVersion: null,
  pluginDiskVersion: 'installed-version', pluginLoadedVersion: null,
}

test('Windows platform name is friendly without claiming OS bitness or host form', () => {
  const rows = diagnosticsTargetRows(target)
  assert.equal(rows.find(row => row.label === '操作系统')?.value, 'Windows')
  assert.match(rows[0]!.value, /未识别.*宿主未提供/)
  assert.equal(target.platform, 'win32')
})

test('missing runtime versions remain missing even when a disk version is known', () => {
  const rows = diagnosticsTargetRows(target)
  assert.match(rows.find(row => row.label === 'DSH 版本')!.value, /未采集.*宿主未提供/)
  assert.match(rows.find(row => row.label === '插件（已加载）')!.value, /未采集.*无法确认/)
  assert.equal(target.pluginLoadedVersion, null)
  assert.equal(target.dshVersion, null)
})

test('known runtime and disk versions remain independently visible', () => {
  const rows = diagnosticsTargetRows({ ...target, hostForm: 'desktop', platform: 'darwin',
    dshVersion: 'host-version', pluginLoadedVersion: 'running-version' })
  assert.deepEqual(rows.map(row => row.value), ['桌面版', 'macOS', 'host-version', 'installed-version', 'running-version'])
  assert.equal(diagnosticsTargetRows({ ...target, hostForm: 'npm', platform: 'linux' })[1]!.value, 'Linux')
  assert.equal(diagnosticsTargetRows({ ...target, platform: null })[1]!.value, '未采集')
})
