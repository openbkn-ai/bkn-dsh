// Start the existing signed official App against task-owned data. Never edit the App.
import { spawn, execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync, openSync, closeSync } from 'node:fs'
import { resolve, join } from 'node:path'

const root = resolve('.'), task = join(root, 'release/auto-desktop-login/rc3')
const inputs = JSON.parse(readFileSync(join(task, 'evidence/INPUTS-private.json')))
const executable = join(inputs.app, 'Contents/MacOS/DeepSeek Harness')
const stdout = openSync(join(task, 'evidence/desktop-stdout-private.log'), 'a')
const stderr = openSync(join(task, 'evidence/desktop-stderr-private.log'), 'a')
const env = { ...process.env, DSH_HOME: join(task, 'home'),
  TMPDIR: join(task, 'tmp'), BKN_CONFIG_DIR: join(task, 'unused-legacy-cli'),
  OPENBKN_AUTO_TASK: task,
  OPENBKN_AUTO_INSTALLED: join(task, 'home/profiles/desktop/node_modules/@openbkn/dsh-business-context') }
delete env.ELECTRON_RUN_AS_NODE
delete env.NODE_OPTIONS
delete env.NODE_TLS_REJECT_UNAUTHORIZED
const child = spawn(executable, ['--user-data-dir=' + join(task, 'electron-user-data')], {
  cwd: join(task, 'cwd'), env, stdio: ['ignore', stdout, stderr, 'ipc'], detached: true,
})
closeSync(stdout); closeSync(stderr)
const identity = { pid: child.pid, executable, spawnRequestedUtc: new Date().toISOString(),
  home: env.DSH_HOME, candidateCommit: inputs.candidateCommit }
try { identity.processStartLocal = execFileSync('ps', ['-p', String(child.pid), '-o', 'lstart='], { encoding: 'utf8' }).trim() } catch {}
writeFileSync(join(task, 'evidence/owned-desktop-private.json'), JSON.stringify(identity, null, 2) + '\n')
console.log(JSON.stringify({ phase: 'started-official-gui', pid: child.pid }))
child.once('exit', (code, signal) => {
  writeFileSync(join(task, 'evidence/desktop-exit.json'), JSON.stringify({ pid: child.pid, code, signal, at: new Date().toISOString() }) + '\n')
  console.log(JSON.stringify({ phase: 'official-gui-exited', code, signal }))
})
process.stdin.resume()
process.stdin.on('data', chunk => {
  if (String(chunk).trim() === 'finish' && (child.exitCode !== null || child.signalCode !== null)) process.exit(0)
})
