import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { appendFileSync, existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const [packageInput, tgzInput, expectedSha, sourceCommit, ciRun, evidenceInput] = process.argv.slice(2)
if (![packageInput, tgzInput, expectedSha, sourceCommit, ciRun, evidenceInput].every(Boolean)) {
  throw new Error('Required input: package, tgz, SHA-256, source commit, CI run, output JSONL')
}
const packagePath = resolve(packageInput)
const tgzPath = resolve(tgzInput)
const evidencePath = resolve(evidenceInput)
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const record = row => {
  const line = JSON.stringify({ timestamp: new Date().toISOString(), ...row }) + '\n'
  appendFileSync(evidencePath, line)
  process.stdout.write(line)
}
writeFileSync(evidencePath, '')

try {
  const tgzSha256 = sha256(readFileSync(tgzPath))
  assert.equal(tgzSha256, expectedSha)
  const manifest = JSON.parse(readFileSync(join(packagePath, 'package.json'), 'utf8'))
  assert.equal(manifest.version, '0.2.0-rc.2-openbkn.0.2.0-8')
  const packedRequire = createRequire(join(packagePath, 'package.json'))
  const peerEntry = name => packedRequire.resolve(name)
  const importPeer = name => import(pathToFileURL(peerEntry(name)).href)
  const peerVersion = name => {
    let directory = dirname(peerEntry(name))
    while (true) {
      const file = join(directory, 'package.json')
      if (existsSync(file)) {
        const value = JSON.parse(readFileSync(file, 'utf8'))
        if (value.name === name) return value.version
      }
      const parent = dirname(directory)
      if (parent === directory) throw new Error('Peer package metadata unavailable')
      directory = parent
    }
  }
  const { Context } = await importPeer('@deepseek-ai/cordis')
  const { default: SystemPrompt, renderPrompt } = await importPeer('@deepseek-ai/dsh-system-prompt')
  const { default: ToolRuntime } = await importPeer('@deepseek-ai/dsh-tools')
  const toolRequire = createRequire(peerEntry('@deepseek-ai/dsh-tools'))
  const { ToolCallId } = await import(pathToFileURL(toolRequire.resolve('@deepseek-ai/dsh-llm')).href)
  const { createScope } = await import(pathToFileURL(toolRequire.resolve('@deepseek-ai/dsh-scope')).href)
  const businessPath = join(packagePath, 'lib/business.js')
  const { mountBoundBusinessNetworkTool } = await import(pathToFileURL(businessPath).href)
  const libFiles = readdirSync(join(packagePath, 'lib')).filter(name => statSync(join(packagePath, 'lib', name)).isFile()).length
  record({ scenario: 'identity', passed: true, packagePath, tgzPath, version: manifest.version, tgzSha256,
    businessSha256: sha256(readFileSync(businessPath)), libFileCount: libFiles, sourceCommit, ciRun,
    nodeVersion: process.version, cordisVersion: peerVersion('@deepseek-ai/cordis'),
    toolsVersion: peerVersion('@deepseek-ai/dsh-tools'), systemPromptVersion: peerVersion('@deepseek-ai/dsh-system-prompt') })

  const binding = { platformBaseUrl: 'https://platform.example', knowledgeNetworkId: 'kn-lifecycle', displayName: 'Lifecycle fixture' }
  const config = { baseUrl: binding.platformBaseUrl, requestTimeoutMs: 30000, maxResultBytes: 1024, allowInsecureTls: false }
  const ctx = new Context()
  try {
    await ctx.plugin(SystemPrompt, {})
    await ctx.plugin(ToolRuntime)
    const agent = { id: 'packed-policy-lifecycle', session: { snapshotEvents: () => [] } }
    let scope
    await ctx.plugin({ inject: ['tools', 'systemPrompt'], apply(inner) { scope = createScope(inner, agent) } })
    agent.ctx = scope.ctx
    ctx.tools.register({ name: 'lifecycle_local_read', description: 'Local fixture result', parameters: { type: 'object', properties: {} },
      output: { schema: { type: 'string' }, render: (_args, value) => [{ type: 'text', text: String(value) }] }, execute: async () => 'native-local-result' })
    const call = () => ctx.tools.execute({ signal: new AbortController().signal, callId: ToolCallId('packed-lifecycle-call'), name: 'lifecycle_local_read', arguments: {}, agent })
    const policyText = async () => renderPrompt(await ctx.systemPrompt.assemble({ scope: agent }))
    const effectCount = (context, label) => context.fiber.getEffects().filter(effect => effect.label === label).length
    const owner = async () => {
      let context
      const fiber = await ctx.plugin({ apply(inner) { context = inner } })
      return { context, dispose: () => fiber.dispose() }
    }
    const first = await owner()
    assert.equal(mountBoundBusinessNetworkTool(agent, config, binding, undefined, first.context), true)
    assert.match(await policyText(), /OpenBKN knowledge network/)
    assert.match(JSON.stringify(await call()), /only permits managed OpenBKN tools/)
    assert.equal(effectCount(first.context, 'openbkn.businessPolicyCleanup'), 1)
    record({ scenario: 'first-mount', passed: true, policyPresent: true, scopedGuardDeniesNativeTool: true, ownerRegistrationCount: 1 })

    await first.dispose()
    assert.doesNotMatch(await policyText(), /OpenBKN knowledge network/)
    assert.match(JSON.stringify(await call()), /native-local-result/)
    assert.equal(effectCount(agent.ctx, 'openbkn.agentPolicyCleanup'), 0)
    assert.equal(agent.ctx.fiber.getEffects().filter(effect => effect.label.includes('ctx.on(')).length, 0)
    record({ scenario: 'owner-reload-cleanup', passed: true, oldPolicyPresent: false, nativeToolRestored: true, agentCleanupCount: 0, oldListenerCount: 0 })

    const replacement = await owner()
    assert.equal(mountBoundBusinessNetworkTool(agent, config, binding, undefined, replacement.context), true)
    assert.match(await policyText(), /OpenBKN knowledge network/)
    assert.match(JSON.stringify(await call()), /only permits managed OpenBKN tools/)
    assert.equal(effectCount(replacement.context, 'openbkn.businessPolicyCleanup'), 1)
    assert.equal(effectCount(agent.ctx, 'openbkn.agentPolicyCleanup'), 1)
    record({ scenario: 'same-live-agent-remount', passed: true, duplicateRegistration: false, scopedGuardActive: true, ownerRegistrationCount: 1, agentCleanupCount: 1 })

    await scope.dispose()
    assert.doesNotMatch(await policyText(), /OpenBKN knowledge network/)
    assert.equal(effectCount(replacement.context, 'openbkn.businessPolicyCleanup'), 0)
    record({ scenario: 'agent-dispose-detaches-owner', passed: true, oldPolicyPresent: false, ownerRegistrationCount: 0 })
    await replacement.dispose()
    record({ scenario: 'later-owner-dispose', passed: true, duplicateCleanupError: false })
  } finally { await ctx.fiber.dispose() }
} catch (error) {
  record({ scenario: 'failure', passed: false, errorName: error?.name ?? 'unknown' })
  process.exitCode = 1
}
