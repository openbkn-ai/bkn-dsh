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
  assert.match(spec.env.PYTHONPATH, /openbkn-business-context\/runner$/)
  assert.equal('BKN_TOKEN' in spec.env, false)
  assert.equal(spec.stdio.stdout.maxBytes, 1_024)
  assert.match((spec as { stdio: { stdin: { data: string } } }).stdio.stdin.data, /"knowledge_network_id":"kn-supply"/)
  assert.doesNotMatch((spec as { stdio: { stdin: { data: string } } }).stdio.stdin.data, /"kn_id"/)
})

test('passes a resolved managed credential only to the one-shot OSDK subprocess', async () => {
  const fake = successfulRuntime({ entries: [] })
  const client = new OsdkRunnerClient(fake.runtime, {
    baseUrl: 'https://poc.openbkn.ai', runnerPath: 'python3', requestTimeoutMs: 30_000,
    maxResultBytes: 1_024, allowInsecureTls: false,
    resolveToken: async () => 'managed-token-value',
  })

  await client.listKnowledgeNetworks(AbortSignal.timeout(1_000), '/workspace')

  assert.equal(fake.spec().env.BKN_TOKEN, 'managed-token-value')
  assert.doesNotMatch((fake.spec() as { stdio: { stdin: { data: string } } }).stdio.stdin.data, /managed-token-value/)
})

test('lists the current CLI identity network catalogue without accepting a client-supplied network id', async () => {
  const fake = successfulRuntime({ entries: [{ id: 'kn-supply', name: 'Supply risk' }] })
  const client = new OsdkRunnerClient(fake.runtime, {
    baseUrl: 'https://poc.openbkn.ai', runnerPath: 'python3', requestTimeoutMs: 30_000,
    maxResultBytes: 1_024, allowInsecureTls: false,
  })

  assert.deepEqual(
    await client.listKnowledgeNetworks(AbortSignal.timeout(1_000), '/workspace'),
    { entries: [{ id: 'kn-supply', name: 'Supply risk' }] },
  )
  const request = JSON.parse((fake.spec() as { stdio: { stdin: { data: string } } }).stdio.stdin.data) as Record<string, unknown>
  assert.equal(request.operation, 'list_knowledge_networks')
  assert.deepEqual(request.context, {})
  assert.equal(JSON.stringify(request).includes('kn-supply'), false)
})

test('reads provenance only through fixed host-bound interaction operations', async () => {
  const fake = successfulRuntime({ entries: [] })
  const client = new OsdkRunnerClient(fake.runtime, {
    baseUrl: 'https://poc.openbkn.ai', runnerPath: 'python3', requestTimeoutMs: 30_000,
    maxResultBytes: 1_024, allowInsecureTls: false,
  })

  await client.getInteractionOperations('int-123', AbortSignal.timeout(1_000), '/workspace')

  const request = JSON.parse((fake.spec() as { stdio: { stdin: { data: string } } }).stdio.stdin.data) as Record<string, unknown>
  assert.equal(request.operation, 'get_interaction_operations')
  assert.deepEqual(request.context, { interaction_id: 'int-123' })
  assert.equal(JSON.stringify(request).includes('knowledge_network_id'), false)
})

test('uses only the fixed Enterprise interaction projection operation', async () => {
  const fake = successfulRuntime({ operations: [] })
  const client = new OsdkRunnerClient(fake.runtime, {
    baseUrl: 'https://poc.openbkn.ai', runnerPath: 'python3', requestTimeoutMs: 30_000,
    maxResultBytes: 1_024, allowInsecureTls: false,
  })

  await client.getInteractionBusinessProvenance('int-123', AbortSignal.timeout(1_000), '/workspace')
  const request = JSON.parse((fake.spec() as { stdio: { stdin: { data: string } } }).stdio.stdin.data) as Record<string, unknown>
  assert.equal(request.operation, 'get_interaction_business_provenance')
  assert.deepEqual(request.context, { interaction_id: 'int-123' })
})

test('bypasses a system proxy only for a loopback OpenBKN platform', async () => {
  const fake = successfulRuntime({ entries: [] })
  const client = new OsdkRunnerClient(fake.runtime, {
    baseUrl: 'http://localhost:8081', runnerPath: 'python3', requestTimeoutMs: 30_000,
    maxResultBytes: 1_024, allowInsecureTls: false,
  })

  await client.listKnowledgeNetworks(AbortSignal.timeout(1_000), '/workspace')

  assert.match(fake.spec().env.NO_PROXY, /(^|,)localhost(,|$)/)
  assert.match(fake.spec().env.NO_PROXY, /(^|,)127\.0\.0\.1(,|$)/)
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

test('preserves the runner authentication classification without exposing diagnostics', async () => {
  const runtime = {
    spawn() {
      return {
        done: Promise.resolve({ exitCode: 1, signal: null }),
        collected: {
          stdout: { readFrom: () => ({
            text: JSON.stringify({ version: 1, ok: false, error: { code: 'authentication_required', message: 'OpenBKN authentication is required' } }),
            nextOffset: 0,
            lossy: false,
          }) },
          stderr: { readFrom: () => ({ text: 'private platform diagnostic', nextOffset: 0, lossy: false }) },
        },
      }
    },
  }
  const client = new OsdkRunnerClient(runtime, {
    baseUrl: 'https://poc.openbkn.ai', runnerPath: 'python3', requestTimeoutMs: 30_000,
    maxResultBytes: 1_024, allowInsecureTls: false,
  })

  await assert.rejects(
    client.listKnowledgeNetworks(AbortSignal.timeout(1_000), '/workspace'),
    (error: unknown) => error instanceof OsdkRunnerError
      && error.code === 'AUTHENTICATION_REQUIRED'
      && !error.message.includes('private platform diagnostic'),
  )
})

test('preserves an unavailable platform classification without exposing diagnostics', async () => {
  const runtime = {
    spawn() {
      return {
        done: Promise.resolve({ exitCode: 1, signal: null }),
        collected: {
          stdout: { readFrom: () => ({
            text: JSON.stringify({ version: 1, ok: false, error: { code: 'platform_unavailable', message: 'private gateway diagnostic' } }),
            nextOffset: 0, lossy: false,
          }) },
          stderr: { readFrom: () => ({ text: 'private platform diagnostic', nextOffset: 0, lossy: false }) },
        },
      }
    },
  }
  const client = new OsdkRunnerClient(runtime, {
    baseUrl: 'https://poc.openbkn.ai', runnerPath: 'python3', requestTimeoutMs: 30_000,
    maxResultBytes: 1_024, allowInsecureTls: false,
  })

  await assert.rejects(
    client.listKnowledgeNetworks(AbortSignal.timeout(1_000), '/workspace'),
    (error: unknown) => error instanceof OsdkRunnerError
      && error.code === 'PLATFORM_UNAVAILABLE'
      && !error.message.includes('private'),
  )
})
