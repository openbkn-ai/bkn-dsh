// Test-only CLI boundary: do not point a daily profile at this executable.
// It leaves the authorized CLI store intact and substitutes a public invalid
// token only while a flag exists in the tester's explicitly named test root.
import {spawnSync} from 'node:child_process'
import {existsSync,unlinkSync} from 'node:fs'
import {dirname,isAbsolute,join,resolve} from 'node:path'

const cli = process.env.BKN_AUTH_FIXTURE_CLI_ENTRY
const root = process.env.BKN_AUTH_FIXTURE_ROOT
const store = process.env.BKN_CONFIG_DIR
if (!cli || !root || !isAbsolute(cli) || !isAbsolute(root) || !existsSync(cli) || !existsSync(root)) {
  console.error('Set absolute BKN_AUTH_FIXTURE_CLI_ENTRY and BKN_AUTH_FIXTURE_ROOT to existing isolated test paths.')
  process.exit(2)
}
// The standard prepare helper places bkn-config beside auth-fault. Refuse an
// unset or other-form store so this wrapper cannot silently use the daily CLI.
if (!store || !isAbsolute(store) || !existsSync(store) || resolve(store) !== resolve(join(dirname(root), 'bkn-config'))) {
  console.error('BKN_CONFIG_DIR must be the existing bkn-config in this fixture TestRoot.')
  process.exit(2)
}
const args = process.argv.slice(2)
const status = args.length === 3 && args.join(' ') === 'auth status --json'
const token = args.length === 2 && args.join(' ') === 'auth token'
const login = args.length === 3 && args[0] === 'auth' && args[1] === 'login'
if (!status && !token && !login) {
  console.error('Only the plugin authentication CLI contract is allowed.')
  process.exit(2)
}
const flag = join(root, 'reject-token.flag')
if (token && existsSync(flag)) {
  console.log('bkn-dsh-public-invalid-auth-fixture')
  process.exit(0)
}
const result = spawnSync(process.execPath, [cli, ...args], {stdio: 'inherit', env: process.env})
// Only a completed real CLI login clears the controlled refusal. This fixture
// never copies a token between stores or writes token values to a file.
if (login && result.status === 0 && existsSync(flag)) unlinkSync(flag)
process.exit(result.status ?? 1)
