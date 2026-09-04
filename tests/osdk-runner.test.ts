import assert from 'node:assert/strict'
import test from 'node:test'
import { OsdkRunnerClient, OsdkRunnerError } from '../src/osdk-runner.ts'

const binding = {
  platformBaseUrl: 'https://poc.openbkn.ai',
  knowledgeNetworkId: 'kn-supply',
  displayName: '供应链风险网络',
}

function successfulRuntime(result: unknown) {
  let spec: unknown
  return {
    runtime: {
      spawn(next: unknown) {
        spec = next
        return {
          done: Promise.resolve({ exitCode: 0, signal: null }),
          collected: {
            stdout: { readFrom: () => ({ text: JSON.stringify({ version: 1, ok: true, result }), nextOffset: 0, lossy: false }) },
            stderr: { readFrom: () => ({ text: '', nextOffset: 0, lossy: false }) },
          },
        }
      },
    },
    spec: () => spec as {
      argv: readonly string[]
      env: Record<string, string>
      stdio: { stdout: { maxBytes: number }; stderr: { maxBytes: number } }
    },
  }
}

test('runs only the fixed platform runner operation with a host-derived knowledge network id', async () => {
  const fake = successfulRuntime({ id: 'kn-supply', name: '供应链风险网络' })
  const client = new OsdkRunnerClient(fake.runtime, {
    baseUrl: 'https://poc.openbkn.ai/',
    runnerPath: '/opt/openbkn-runner/bin/python',
    requestTimeoutMs: 30_000,
    maxResultBytes: 1_024,
    allowInsecureTls: false,
  })

  const result = await client.getKnowledgeNetworkDetail(binding, AbortSignal.timeout(1_000), '/workspace')

  assert.deepEqual(result, { id: 'kn-supply', name: '供应链风险网络' })
  const spec = fake.spec()
  assert.deepEqual(spec.argv, ['/opt/openbkn-runner/bin/python', '-m', 'openbkn_dsh_runner'])
  assert.equal(spec.env.BKN_BASE_URL, 'https://poc.openbkn.ai')
  assert.equal(spec.env.OPENBKN_DSH_INSECURE_TLS, 'false')
  assert.equal(spec.env.OPENBKN_DSH_REQUEST_TIMEOUT_MS, '30000')
  assert.equal('BKN_TOKEN' in spec.env, false)
  assert.equal(spec.stdio.stdout.maxBytes, 1_024)
  assert.match((spec as { stdio: { stdin: { data: string } } }).stdio.stdin.data, /"knowledge_network_id":"kn-supply"/)
  assert.doesNotMatch((spec as { stdio: { stdin: { data: string } } }).stdio.stdin.data, /"kn_id"/)
})

test('fails closed when the DSH session binding is for another configured platform', async () => {
  const fake = successfulRuntime({})
  const client = new OsdkRunnerClient(fake.runtime, {
    baseUrl: 'https://poc.openbkn.ai', runnerPath: 'python3', requestTimeoutMs: 30_000,
    maxResultBytes: 1_024, allowInsecureTls: false,
  })

  await assert.rejects(
    client.getKnowledgeNetworkDetail({ ...binding, platformBaseUrl: 'https://other.openbkn.ai' }, AbortSignal.timeout(1_000), '/workspace'),
    (error: unknown) => error instanceof OsdkRunnerError && error.code === 'PLATFORM_MISMATCH',
  )
  assert.equal(fake.spec(), undefined)
})

test('does not pass malformed or truncated runner output into DSH context', async () => {
  const runtime = {
    spawn() {
      return {
        done: Promise.resolve({ exitCode: 0, signal: null }),
        collected: {
          stdout: { readFrom: () => ({ text: '{', nextOffset: 0, lossy: true }) },
          stderr: { readFrom: () => ({ text: 'sensitive diagnostic', nextOffset: 0, lossy: false }) },
        },
      }
    },
  }
  const client = new OsdkRunnerClient(runtime, {
    baseUrl: 'https://poc.openbkn.ai', runnerPath: 'python3', requestTimeoutMs: 30_000,
    maxResultBytes: 1_024, allowInsecureTls: false,
  })

  await assert.rejects(
    client.getKnowledgeNetworkDetail(binding, AbortSignal.timeout(1_000), '/workspace'),
    (error: unknown) => error instanceof OsdkRunnerError && error.code === 'OUTPUT_OVERFLOW' && !error.message.includes('sensitive'),
  )
})
