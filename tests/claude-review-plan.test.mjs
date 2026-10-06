import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const workflow = readFileSync(new URL('../.github/workflows/automation-claude-review.yml', import.meta.url), 'utf8')
const plan = workflow.split('- name: Plan shards')[1].split("python3 - <<'PY'")[1].split('\n          PY')[0]
  .split('\n').slice(1).map(line => line.startsWith('          ') ? line.slice(10) : line).join('\n')
const pythonAvailable = spawnSync('python3', ['--version']).status === 0

function runPlan(total) {
  const paths = ['README.md', ...Array.from({ length: 539 }, (_, index) => `docs/evidence/row-${index}.json`), 'packages/openbkn-business-context/src/auth.ts']
  const harness = `import json, os, subprocess, types\npaths = json.loads(${JSON.stringify(JSON.stringify(paths))})\ndef run(args, **kwargs):\n    if args[:3] == ['gh', 'pr', 'view']:\n        if 'files,changedFiles' in args:\n            return types.SimpleNamespace(returncode=0, stdout=str(${total})+'\\n'+'\\n'.join(paths[:100]))\n        return types.SimpleNamespace(returncode=0, stdout=json.dumps({'changedFiles': ${total}}))\n    if '/files' in args[2]:\n        assert '--paginate' in args, 'all files must be requested'\n        return types.SimpleNamespace(returncode=0, stdout='\\n'.join(paths)+'\\n')\n    return types.SimpleNamespace(returncode=0, stdout='[]')\nsubprocess.run = run\nexec(compile(${JSON.stringify(plan)}, '<workflow-plan>', 'exec'))\n`
  return spawnSync('python3', ['-c', harness], {
    encoding: 'utf8', env: { ...process.env, GH_REPO: 'openbkn-ai/bkn-dsh', PR_NUMBER: '64', GITHUB_EVENT_NAME: 'pull_request' },
  })
}

test('review planner includes every file beyond the first 100 and retains late auth changes', { skip: !pythonAvailable }, () => {
  const result = runPlan(541)
  assert.equal(result.status, 0, result.stderr)
  assert.match(result.stdout, /file_listed=541/)
  assert.match(result.stdout, /packages\/openbkn-business-context\/src\/auth\.ts/)
  assert.match(result.stdout, /docs\/evidence\/row-538\.json/)
})

test('review planner rejects an incomplete paginated list instead of claiming full review', { skip: !pythonAvailable }, () => {
  const result = runPlan(542)
  assert.notEqual(result.status, 0)
  assert.match(result.stderr, /file list.*incomplete/i)
})
