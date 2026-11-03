#!/usr/bin/env node
/**
 * Opt-in, offline package contract probe. Not part of the normal test suite.
 * Exact registry 0.2.0/0.2.1-rc.1 packages, synthetic loopback only; the latter
 * is not formal 0.2.1 acceptance. No plugin SDK dependency or global CLI change.
 *
 * node scripts/probe-openbkn-sdk021-contract.mjs \
 *   --archives release/sdk021-impact-20261103 \
 *   --dependencies /path/to/installed/bkn-sdk/node_modules \
 *   --output release/sdk021-impact-20261103/contract-probe-1
 *
 * Acquire the exact archives using the public URLs in the metadata fixture.
 * The dependency directory contains public package code, never a config/store.
 * Its compatible installed dependency closure is copied and hashed, not claimed
 * registry-attested. No package install or npm lifecycle script is executed.
 */
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  cpSync, existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, writeFileSync,
} from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const script = fileURLToPath(import.meta.url);
const fixturePath = path.resolve(path.dirname(script), '../tests/fixtures/openbkn-sdk021-package-metadata.json');
const sha = (bytes, algorithm = 'sha256', encoding = 'hex') => createHash(algorithm).update(bytes).digest(encoding);
const json = (name) => JSON.parse(readFileSync(name, 'utf8'));
const jwt = (seconds) => [
  { alg: 'none', typ: 'JWT' },
  { sub: 'synthetic-sdk-contract-user', preferred_username: 'synthetic-probe', exp: seconds },
].map((part) => Buffer.from(JSON.stringify(part)).toString('base64url')).join('.') + '.synthetic-signature';

function filesUnder(root, prefix = '') {
  return readdirSync(root).sort().flatMap((name) => {
    if (name === '.bin') return [];
    const relative = path.posix.join(prefix, name);
    const location = path.join(root, name);
    const stat = lstatSync(location);
    assert(!stat.isSymbolicLink(), `Dependency/archive symlink not allowed: ${relative}`);
    return stat.isDirectory() ? filesUnder(location, relative) : [{
      path: relative, bytes: stat.size, sha256: sha(readFileSync(location)),
    }];
  });
}

function verifyArchive(entry, archives, destination) {
  const location = path.join(archives, entry.archiveName);
  const bytes = readFileSync(location);
  assert.equal(bytes.length, entry.archiveBytes, `Archive size: ${entry.version}`);
  assert.equal(sha(bytes), entry.sha256, `Archive SHA256: ${entry.version}`);
  assert.equal(sha(bytes, 'sha1'), entry.shasum, `Registry SHA1: ${entry.version}`);
  assert.equal(`sha512-${sha(bytes, 'sha512', 'base64')}`, entry.integrity, `Registry integrity: ${entry.version}`);
  const listing = spawnSync('tar', ['-tzf', location], { encoding: 'utf8' });
  assert.equal(listing.status, 0, listing.stderr);
  const names = listing.stdout.trim().split('\n').sort();
  assert.deepEqual(names, Object.keys(entry.files).sort(), 'Exact safe archive entries');
  for (const name of names) assert(/^package\/(?!.*(?:^|\/)\.\.(?:\/|$))[^\\]+$/.test(name));
  mkdirSync(destination);
  const unpack = spawnSync('tar', ['-xzf', location, '-C', destination], { encoding: 'utf8' });
  assert.equal(unpack.status, 0, unpack.stderr);
  const files = filesUnder(destination);
  assert.equal(files.length, entry.fileCount);
  for (const file of files) assert.deepEqual(
    { bytes: file.bytes, sha256: file.sha256 }, entry.files[file.path], `Unpacked bytes: ${file.path}`,
  );
  const manifest = json(path.join(destination, 'package/package.json'));
  assert.equal(manifest.name, entry.name);
  assert.equal(manifest.version, entry.version);
  assert.deepEqual(manifest.dependencies, entry.dependencies);
  return { version: entry.version, archiveSha256: sha(bytes), integrityVerified: true,
    sha1Verified: true, fileCount: files.length, gitHead: entry.gitHead };
}

// Only the fixed fixture's simple caret ranges are needed for this opt-in probe.
function satisfiesDeclaredCaret(actual, wanted) {
  assert(/^\^\d+\.\d+\.\d+$/.test(wanted), `Review new dependency range: ${wanted}`);
  const a = actual.split('.').map(Number);
  const b = wanted.slice(1).split('.').map(Number);
  assert(a.length === 3 && a.every(Number.isInteger), `Review prerelease dependency: ${actual}`);
  const atLeast = a[0] > b[0] || (a[0] === b[0] && (a[1] > b[1] || (a[1] === b[1] && a[2] >= b[2])));
  return atLeast && a[0] === b[0] && (b[0] !== 0 || a[1] === b[1]);
}

function childEnv(config, origin) {
  // Deliberate allowlist: no inherited BKN_*, NODE_OPTIONS, TLS opt-outs,
  // proxies, npm config or credentials. HOME is neither changed nor needed.
  return {
    PATH: path.dirname(process.execPath),
    ...(process.env.SystemRoot ? { SystemRoot: process.env.SystemRoot } : {}),
    BKN_CONFIG_DIR: config,
    SDK_CONTRACT_ORIGIN: origin,
  };
}

async function runProcess(args, env, cwd) {
  return await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, { env, cwd, stdio: ['ignore', 'pipe', 'pipe'] });
    const output = { stdout: '', stderr: '' };
    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; child.kill('SIGKILL'); }, 15000);
    for (const stream of ['stdout', 'stderr']) child[stream].on('data', (chunk) => {
      output[stream] += chunk;
      if (output[stream].length > 100000) child.kill('SIGKILL');
    });
    child.once('error', reject);
    child.once('exit', (code, signal) => {
      clearTimeout(timer);
      resolve({ code, signal, timedOut, ...output });
    });
  });
}

async function libraryWorker() {
  const [packageRoot, action, origin, payload] = process.argv.slice(3);
  assert.equal(new URL(origin).hostname, '127.0.0.1');
  assert(process.env.BKN_CONFIG_DIR);
  const sdk = await import(pathToFileURL(path.join(packageRoot, 'dist/index.js')).href);
  if (action === 'seed') {
    const { accessToken, ...options } = JSON.parse(payload);
    sdk.auth.attachToken(origin, accessToken, options);
    process.stdout.write(JSON.stringify(sdk.auth.status()) + '\n');
    return;
  }
  assert.equal(action, 'request');
  try {
    const ctx = sdk.resolveContext({ baseUrl: origin, token: 'synthetic-request-token', retry: false });
    const result = await sdk.request(ctx, '/probe/read');
    process.stdout.write(JSON.stringify({ accepted: true, result }) + '\n');
  } catch (error) {
    process.stdout.write(JSON.stringify({ accepted: false, error: { name: error.name, message: error.message } }) + '\n');
  }
}

async function main() {
  const opts = {};
  for (let i = 2; i < process.argv.length; i += 2) {
    const key = process.argv[i];
    assert(['--archives', '--dependencies', '--output'].includes(key), `Unknown argument: ${key}`);
    assert(process.argv[i + 1], `Missing ${key}`);
    opts[key.slice(2)] = path.resolve(process.argv[i + 1]);
  }
  for (const name of ['archives', 'dependencies', 'output']) assert(opts[name], `Required --${name}`);
  const major = Number(process.versions.node.split('.')[0]);
  assert(major >= 24, 'Use Node >=24, matching the published SDK build target');
  assert(!existsSync(opts.output), 'Refusing to overwrite an earlier probe/receipt');
  assert(opts.output.split(path.sep).includes('release'), 'Output must be under an ignored release directory');
  const fixture = json(fixturePath);
  mkdirSync(opts.output, { recursive: true });
  mkdirSync(path.join(opts.output, 'cases'));
  const report = {
    schemaVersion: 1, startedAt: new Date().toISOString(), status: 'RUNNING',
    scope: fixture.scope, node: process.version, fixtureSha256: sha(readFileSync(fixturePath)),
    network: 'Synthetic HTTP loopback only; no CA/TLS, browser, real user or platform acceptance.',
    dependencyProvenance: 'Copied installed public package-code closure; not a registry-attested dependency snapshot.',
    packages: [], cases: [],
  };
  let active;
  const server = http.createServer(async (request, response) => {
    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    const body = Buffer.concat(chunks).toString('utf8');
    const form = new URLSearchParams(body);
    const record = { method: request.method, path: request.url, formKeys: [...form.keys()].sort() };
    active?.requests.push(record);
    response.setHeader('Content-Type', 'application/json');
    try {
      assert(active, 'No active case');
      if (request.url === '/api/bkn-backend/v1/health' && request.method === 'GET') {
        response.end(JSON.stringify({ ServerVersion: active.platformVersion }));
      } else if (request.url === '/probe/read' && request.method === 'GET') {
        assert.equal(request.headers.authorization, 'Bearer synthetic-request-token');
        response.end(JSON.stringify({ synthetic: true }));
      } else if (request.url === '/oauth2/token' && request.method === 'POST' && active.kind === 'refresh') {
        assert.deepEqual(Object.fromEntries(form), {
          grant_type: 'refresh_token', refresh_token: 'synthetic-refresh-old', client_id: 'openbkn-sdk',
        });
        response.end(JSON.stringify({ access_token: active.freshToken, refresh_token: 'synthetic-refresh-new', expires_in: 3600 }));
      } else if (request.url === '/oauth2/device/auth' && request.method === 'POST' && active.kind === 'device') {
        assert.deepEqual(Object.fromEntries(form), { client_id: 'openbkn-sdk', scope: 'openid offline', audience: 'bkn-safe' });
        response.end(JSON.stringify({ device_code: 'synthetic-device', user_code: 'SYNTHETIC-CODE',
          verification_uri: `${report.origin}/synthetic/verify`,
          verification_uri_complete: `${report.origin}/synthetic/verify?user_code=SYNTHETIC-CODE`,
          expires_in: 10, interval: 0 }));
      } else if (request.url === '/oauth2/token' && request.method === 'POST' && active.kind === 'device') {
        assert.deepEqual(Object.fromEntries(form), { grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
          device_code: 'synthetic-device', client_id: 'openbkn-sdk' });
        response.statusCode = 400;
        response.end(JSON.stringify({ error: 'access_denied' }));
      } else throw new Error('Unexpected synthetic endpoint/method');
    } catch (error) {
      if (active) active.serverErrors.push(error.message);
      response.statusCode = 500;
      response.end(JSON.stringify({ error: 'synthetic-probe-handler-refusal' }));
    }
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  report.origin = `http://127.0.0.1:${server.address().port}`;
  const guard = path.join(opts.output, 'loopback-guard.mjs');
  writeFileSync(guard, `const realFetch = globalThis.fetch;
const allowed = process.env.SDK_CONTRACT_ORIGIN;
globalThis.fetch = (input, init) => {
  const target = new URL(typeof input === 'string' || input instanceof URL ? input : input.url);
  if (target.origin !== allowed || target.hostname !== '127.0.0.1') throw new Error('Probe refused non-loopback fetch');
  return realFetch(input, { ...init, redirect: 'error' });
};\n`, { flag: 'wx' });
  const clean = (result) => ({ ...result,
    stdout: result.stdout.replace(/eyJ[A-Za-z0-9_.-]+/g, '[synthetic-jwt]'),
    stderr: result.stderr.replace(/eyJ[A-Za-z0-9_.-]+/g, '[synthetic-jwt]'),
  });
  try {
    // Snapshot the same public dependency closure for both exact SDK archives.
    const originalFiles = filesUnder(opts.dependencies);
    const dependencyRoot = path.join(opts.output, 'node_modules');
    cpSync(opts.dependencies, dependencyRoot, { recursive: true,
      filter: (source) => !path.relative(opts.dependencies, source).split(path.sep).includes('.bin') });
    assert.deepEqual(filesUnder(dependencyRoot), originalFiles, 'Dependency copy must retain bytes');
    const dependencyFilesPath = path.join(opts.output, 'DEPENDENCY-FILES.json');
    writeFileSync(dependencyFilesPath, JSON.stringify(originalFiles, null, 2) + '\n', { flag: 'wx' });
    report.dependencies = { files: originalFiles.length,
      bytes: originalFiles.reduce((sum, file) => sum + file.bytes, 0),
      manifestSha256: sha(readFileSync(dependencyFilesPath)), direct: {} };
    for (const entry of fixture.packages) {
      for (const [name, wanted] of Object.entries(entry.dependencies)) {
        const manifest = json(path.join(dependencyRoot, name, 'package.json'));
        assert.equal(manifest.name, name);
        assert(satisfiesDeclaredCaret(manifest.version, wanted), `Dependency ${name} ${manifest.version} does not satisfy ${wanted}`);
        report.dependencies.direct[name] = manifest.version;
      }
      const destination = path.join(opts.output, `sdk-${entry.version}`);
      report.packages.push(verifyArchive(entry, opts.archives, destination));
      const packageRoot = path.join(destination, 'package');
      const freshToken = jwt(Math.floor(Date.now() / 1000) + 3600);
      const expiredToken = jwt(Math.floor(Date.now() / 1000) - 3600);
      async function caseOf(name, settings, check) {
        const root = path.join(opts.output, 'cases', `${entry.version}-${name}`);
        mkdirSync(root);
        const config = path.join(root, 'config');
        mkdirSync(config);
        active = { version: entry.version, name, status: 'RUNNING',
          platformVersion: entry.versionGate.matchingPlatform, freshToken,
          requests: [], serverErrors: [], processes: [], ...settings };
        report.cases.push(active);
        const env = childEnv(config, report.origin);
        async function execute(args) {
          const result = await runProcess(['--import', guard, ...args], env, root);
          active.processes.push(clean(result));
          assert(!result.timedOut, 'Child timed out');
          assert.equal(result.signal, null, 'Child was signalled');
          return result;
        }
        const cli = (...args) => execute([path.join(packageRoot, 'dist/cli.js'), ...args]);
        const library = (action, payload = {}) => execute([script, '--sdk-worker', packageRoot,
          action, report.origin, JSON.stringify(payload)]);
        const status = async () => {
          const result = await cli('auth', 'status', '--json');
          assert.equal(result.code, 0, result.stderr);
          return JSON.parse(result.stdout);
        };
        try {
          await check({ cli, library, status, config });
          assert.deepEqual(active.serverErrors, []);
          active.status = 'PASS';
        } catch (error) {
          active.status = 'FAIL';
          active.failure = { name: error.name, message: error.message };
          throw error;
        } finally {
          delete active.freshToken;
          writeFileSync(path.join(root, 'RESULT.json'), JSON.stringify(active, null, 2) + '\n', { flag: 'wx' });
        }
      }
      for (const [name, accepted, platformVersion] of [
        ['sdk-version-match', true, entry.versionGate.matchingPlatform],
        ['sdk-version-mismatch', false, entry.versionGate.mismatchingPlatform],
      ]) await caseOf(name, { platformVersion }, async ({ library }) => {
        const result = await library('request');
        assert.equal(result.code, 0, result.stderr);
        const outcome = JSON.parse(result.stdout);
        assert.equal(outcome.accepted, accepted);
        if (accepted) assert.deepEqual(outcome.result, { synthetic: true });
        else {
          assert.equal(outcome.error.name, 'VersionCompatibilityError');
          assert.match(outcome.error.message, /incompatible with platform version/);
        }
        assert.deepEqual(active.requests.map((request) => request.path), accepted
          ? ['/api/bkn-backend/v1/health', '/probe/read'] : ['/api/bkn-backend/v1/health']);
      });
      await caseOf('cli-empty-store', {}, async ({ cli, status }) => {
        assert.deepEqual(await status(), { hasToken: false });
        const result = await cli('auth', 'token');
        assert.notEqual(result.code, 0);
        assert.equal(result.stdout, '');
        assert.match(result.stderr, /Not logged in/);
        assert.equal(active.requests.length, 0);
      });
      await caseOf('cli-token-login-match', {}, async ({ cli, status }) => {
        const login = await cli('auth', 'login', report.origin, '--token', freshToken, '--json');
        assert.equal(login.code, 0, login.stderr);
        assert.equal(JSON.parse(login.stdout).loggedIn, true);
        const current = await status();
        assert.equal(current.baseUrl, report.origin);
        assert.equal(current.userId, 'synthetic-sdk-contract-user');
        assert.equal(current.username, 'synthetic-probe');
        assert.equal(current.hasToken, true);
        assert.equal(current.expired, false);
        const result = await cli('auth', 'token');
        assert.equal(result.code, 0, result.stderr);
        assert.equal(result.stdout.trim(), freshToken);
        assert.deepEqual(active.requests.map((request) => request.path), ['/api/bkn-backend/v1/health']);
      });
      await caseOf('cli-token-login-mismatch', { platformVersion: entry.versionGate.mismatchingPlatform }, async ({ cli, status, config }) => {
        const login = await cli('auth', 'login', report.origin, '--token', freshToken, '--json');
        assert.notEqual(login.code, 0);
        assert.match(login.stderr, /incompatible with platform version/);
        assert.equal(login.stdout, '');
        assert.deepEqual(await status(), { hasToken: false });
        assert.deepEqual(filesUnder(config), [], 'Mismatch cannot persist token/cache');
        assert.deepEqual(active.requests.map((request) => request.path), ['/api/bkn-backend/v1/health']);
      });
      await caseOf('cli-refresh-expired-store', { kind: 'refresh' }, async ({ library, cli, status }) => {
        const seed = await library('seed', { accessToken: expiredToken, refreshToken: 'synthetic-refresh-old' });
        assert.equal(seed.code, 0, seed.stderr);
        assert.equal((await status()).expired, true);
        const renewed = await cli('auth', 'token');
        assert.equal(renewed.code, 0, renewed.stderr);
        assert.equal(renewed.stdout.trim(), freshToken);
        const current = await status();
        assert.equal(current.expired, false);
        assert.equal(current.userId, 'synthetic-sdk-contract-user');
        const again = await cli('auth', 'token');
        assert.equal(again.code, 0, again.stderr);
        assert.equal(again.stdout.trim(), freshToken);
        assert.deepEqual(active.requests.map((request) => request.path), ['/oauth2/token']);
      });
      await caseOf('cli-expired-without-refresh', {}, async ({ library, cli, status }) => {
        const seed = await library('seed', { accessToken: expiredToken });
        assert.equal(seed.code, 0, seed.stderr);
        assert.equal((await status()).expired, true);
        const result = await cli('auth', 'token');
        assert.notEqual(result.code, 0);
        assert.equal(result.stdout, '');
        assert.match(result.stderr, /expired and no refresh token/);
        assert.equal(active.requests.length, 0);
      });
      await caseOf('cli-device-prompt-denied', { kind: 'device' }, async ({ cli, status, config }) => {
        const result = await cli('auth', 'login', report.origin, '--device', '--no-browser', '--timeout', '2');
        assert.notEqual(result.code, 0);
        assert.equal(result.stdout, '');
        assert.match(result.stderr, /Open this URL to sign in and authorize:/);
        assert(result.stderr.includes(`${report.origin}/synthetic/verify?user_code=SYNTHETIC-CODE`));
        assert.match(result.stderr, /User code: SYNTHETIC-CODE/);
        assert.match(result.stderr, /Waiting for authorization/);
        assert.match(result.stderr, /Device authorization denied/);
        assert.deepEqual(await status(), { hasToken: false });
        assert.deepEqual(filesUnder(config), [], 'Denied synthetic authorization cannot persist token');
        assert.deepEqual(active.requests.map((request) => request.path), ['/oauth2/device/auth', '/oauth2/token']);
      });
    }
    report.status = 'PASS';
  } catch (error) {
    report.status = 'FAIL';
    report.failure = { name: error.name, message: error.message };
    process.exitCode = 1;
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
    report.finishedAt = new Date().toISOString();
    report.summary = { total: report.cases.length, passed: report.cases.filter((entry) => entry.status === 'PASS').length,
      failed: report.cases.filter((entry) => entry.status === 'FAIL').length };
    writeFileSync(path.join(opts.output, 'RESULT.json'), JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
    process.stdout.write(JSON.stringify({ status: report.status, ...report.summary,
      output: path.join(opts.output, 'RESULT.json'), ...(report.failure ? { failure: report.failure } : {}) }) + '\n');
  }
}

if (process.argv[2] === '--sdk-worker') await libraryWorker();
else await main();
