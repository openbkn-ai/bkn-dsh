import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, realpathSync, statSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const sha256 = path => createHash('sha256').update(readFileSync(path)).digest('hex');
const json = path => JSON.parse(readFileSync(path, 'utf8').replace(/^\uFEFF/, ''));
function inside(root, name) {
  if (typeof name !== 'string' || name.includes('\\') || isAbsolute(name)) throw new Error('Invalid manifest path');
  const result = resolve(root, name);
  if (!relative(root, result) || relative(root, result).split(sep).includes('..')) throw new Error('Manifest path escapes root');
  return result;
}
function files(root, prefix = '') {
  return readdirSync(resolve(root, prefix), { withFileTypes: true }).flatMap(entry => {
    const name = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isSymbolicLink()) throw new Error(`Unexpected symlink: ${name}`);
    return entry.isDirectory() ? files(root, name) : [name];
  }).sort();
}
export function verifyKit(root) {
  const manifest = json(resolve(root, 'kit-files.json'));
  const expected = manifest.files.map(row => row.path).sort();
  const actual = files(root).filter(path => path !== 'kit-files.json');
  if (JSON.stringify(expected) !== JSON.stringify(actual)) throw new Error('Kit file set differs');
  for (const row of manifest.files) {
    const path = inside(root, row.path);
    if (sha256(path) !== row.sha256 || statSync(path).size !== row.bytes) throw new Error(`Kit digest mismatch: ${row.path}`);
  }
  const pin = json(resolve(root, 'pins.json'));
  if (pin.plugin.version !== '0.2.0-rc.2-openbkn.0.2.0-12' || pin.dsh.version !== '0.2.0-rc.2') throw new Error('Version pin mismatch');
  if (sha256(inside(root, pin.plugin.file)) !== pin.plugin.sha256) throw new Error('Candidate plugin digest mismatch');
  return { kitFilesVerified: expected.length, pluginVersion: pin.plugin.version, sha256: pin.plugin.sha256 };
}
export function verifyInstalled(kitRoot, packageRoot) {
  verifyKit(kitRoot);
  const manifest = json(resolve(kitRoot, 'package-files.json'));
  const pin = json(resolve(kitRoot, 'pins.json'));
  const actualRoot = realpathSync(packageRoot);
  const pkg = json(resolve(actualRoot, 'package.json'));
  if (pkg.name !== '@openbkn/dsh-business-context' || pkg.version !== pin.plugin.version) throw new Error('Installed package identity differs');
  const expected = manifest.files.map(row => row.path).sort();
  if (expected.length !== 74 || JSON.stringify(files(actualRoot)) !== JSON.stringify(expected)) throw new Error('Installed package file set differs');
  const verified = manifest.files.map(row => {
    const path = inside(actualRoot, row.path);
    const digest = sha256(path);
    if (digest !== row.sha256) throw new Error(`Installed file digest mismatch: ${row.path}`);
    return { path: row.path, sha256: digest };
  });
  return { capturedAt: new Date().toISOString(), packageName: pkg.name, version: pkg.version,
    candidateTgzSha256: pin.plugin.sha256, packageRoot: actualRoot, verifiedFiles: verified.length,
    allFilesMatchCandidatePackage: true, files: verified, uiAcceptance: 'PENDING_MANUAL_REVIEW' };
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [mode, root = dirname(fileURLToPath(import.meta.url)), installed, output] = process.argv.slice(2);
    const result = mode === 'kit' ? verifyKit(resolve(root)) : mode === 'installed' ? verifyInstalled(resolve(root), resolve(installed)) : (() => { throw new Error('Usage: node verify.mjs kit <kit-root> | installed <kit-root> <package-root> [receipt-file]'); })();
    if (output) writeFileSync(output, JSON.stringify(result, null, 2) + '\n', { flag: 'wx' });
    console.log(JSON.stringify(mode === 'installed' ? { ...result, files: undefined } : result, null, 2));
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
