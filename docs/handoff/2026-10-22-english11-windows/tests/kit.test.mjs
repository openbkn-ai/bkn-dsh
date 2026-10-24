import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { after, test } from 'node:test';
import { pathToFileURL } from 'node:url';

// These are tooling fixtures, never Windows acceptance records.
const kit = resolve(process.env.ENGLISH11_KIT);
const { verifyKit, verifyInstalled } = await import(pathToFileURL(resolve(kit, 'verify.mjs')));
const { reviewResults } = await import(pathToFileURL(resolve(kit, 'Review-Results.mjs')));
const temp = mkdtempSync(resolve(tmpdir(), 'english11-kit-tests-'));
after(() => rmSync(temp, { recursive: true, force: true }));
const read = file => JSON.parse(readFileSync(file, 'utf8'));
const write = (file, data) => writeFileSync(file, JSON.stringify(data, null, 2));
const pin = read(resolve(kit, 'pins.json'));
const tgz = resolve(kit, pin.plugin.file);
function packageCopy(name) {
  const root = resolve(temp, name);
  const result = spawnSync('tar', ['-xzf', tgz, '-C', temp]);
  assert.equal(result.status, 0);
  cpSync(resolve(temp, 'package'), root, { recursive: true });
  return root;
}
test('the kit binds all contents to the published artifact and pin', () => {
  assert.equal(verifyKit(kit).sha256, 'ed29647e30a7e7c91d22217fdd810e0d3a1e7f49ca4a1274c5b4486f7b206f60');
});
test('a modified tarball and an unexpected file both fail closed', () => {
  const copy = resolve(temp, 'modified-kit'); cpSync(kit, copy, { recursive: true });
  writeFileSync(resolve(copy, pin.plugin.file), 'altered');
  assert.throws(() => verifyKit(copy), /digest mismatch/);
  const extra = resolve(temp, 'extra-kit'); cpSync(kit, extra, { recursive: true });
  writeFileSync(resolve(extra, 'untracked.txt'), 'unexpected');
  assert.throws(() => verifyKit(extra), /file set differs/);
});
test('an installed copy must match all 74 files; this alone leaves UI pending', () => {
  const receipt = verifyInstalled(kit, packageCopy('installed-good'));
  assert.equal(receipt.verifiedFiles, 74);
  assert.equal(receipt.uiAcceptance, 'PENDING_MANUAL_REVIEW');
});
test('a forged package version and a modified client cannot pass installation verification', () => {
  const wrong = packageCopy('installed-wrong'); const manifest = read(resolve(wrong, 'package.json'));
  manifest.version = '0.2.0-rc.2-openbkn.0.2.0-10'; write(resolve(wrong, 'package.json'), manifest);
  assert.throws(() => verifyInstalled(kit, wrong), /identity differs/);
  const changed = packageCopy('installed-changed'); writeFileSync(resolve(changed, 'lib/client.js'), 'modified');
  assert.throws(() => verifyInstalled(kit, changed), /digest mismatch/);
});
test('the untouched NOT_RUN template cannot satisfy the review gate', () => {
  const path = resolve(temp, 'pending.json'); cpSync(resolve(kit, 'RESULTS.template.json'), path);
  assert.equal(reviewResults(path, kit).structuralChecksPassed, false);
});

function reportFixture(name) {
  const root = resolve(temp, name); cpSync(resolve(kit, 'RESULTS.template.json'), resolve(temp, `${name}-base.json`));
  const report = read(resolve(temp, `${name}-base.json`));
  const pkg = verifyInstalled(kit, packageCopy(`${name}-package`));
  report.tester = 'SYNTHETIC_TOOLING_TEST'; report.testedAt = '2026-10-22';
  report.platform.baseUrl = 'https://fixture.invalid'; report.platform.contractReviewEvidence = 'platform.txt';
  // cpSync creates the fixture directory; no real Windows execution occurs.
  cpSync(resolve(kit, 'RESULTS.template.json'), resolve(temp, `${name}-scratch.json`));
  cpSync(kit, root, { recursive: true });
  writeFileSync(resolve(root, 'platform.txt'), 'SYNTHETIC CONTRACT REVIEW');
  for (const form of ['desktop', 'npm']) {
    const dir = resolve(root, form); cpSync(resolve(temp, 'package'), dir, { recursive: true });
    write(resolve(dir, 'package.json'), pkg);
    writeFileSync(resolve(dir, 'fixture.txt'), 'SYNTHETIC UI REFERENCE: NOT WINDOWS EVIDENCE');
    const host = { form, profile: form === 'desktop' ? 'desktop' : 'web', dshVersion: pin.dsh.version,
      pluginVersion: pin.plugin.version, os: 'Microsoft Windows SYNTHETIC',
      processes: [{pid: 123, executable: 'SYNTHETIC', createdAt: '2026-10-22'}], packageReceipt: 'package.json' };
    for (const phase of ['after-locale', 'restart-en', 'restart-zh']) write(resolve(dir, `${phase}-host.json`), { ...host, phase });
    report.forms[form].manualConfirmed = true;
    for (const row of report.forms[form].cases) { row.status = 'PASS'; row.notes = 'SYNTHETIC TOOLING FIXTURE'; row.evidence = [`${form}/fixture.txt`]; }
  }
  const file = resolve(root, 'RESULTS.json'); write(file, report);
  return { file, report, root };
}
test('a structurally complete fixture explicitly cannot establish visual truth or promote npm', () => {
  const { file } = reportFixture('synthetic-complete'); const result = reviewResults(file, kit);
  assert.equal(result.structuralChecksPassed, true);
  assert.equal(result.nativeUiTruthEstablishedByThisScript, false);
  assert.equal(result.maintainerReviewRequired, true);
  assert.equal(result.npmTagsChanged, false);
});
test('a receipt from another version or a missing cold start blocks structural readiness', () => {
  const one = reportFixture('synthetic-wrong-version'); const path = resolve(one.root, 'npm/package.json');
  const data = read(path); data.version = '0.2.0-rc.2-openbkn.0.2.0-10'; write(path, data);
  assert.equal(reviewResults(one.file, kit).structuralChecksPassed, false);
  const two = reportFixture('synthetic-no-restart'); two.report.forms.desktop.restartReceipts.pop(); write(two.file, two.report);
  assert.equal(reviewResults(two.file, kit).structuralChecksPassed, false);
});
test('skipped cases, unresolved anomalies, and evidence outside the return root cannot pass', () => {
  const one = reportFixture('synthetic-skipped'); one.report.forms.npm.cases[3].status = 'NOT_RUN'; write(one.file, one.report);
  assert.equal(reviewResults(one.file, kit).structuralChecksPassed, false);
  const two = reportFixture('synthetic-anomaly'); two.report.anomalies.push({ observation: 'SYNTHETIC FAILURE' }); write(two.file, two.report);
  assert.equal(reviewResults(two.file, kit).structuralChecksPassed, false);
  const three = reportFixture('synthetic-escape'); three.report.forms.desktop.cases[0].evidence = ['../platform.txt']; write(three.file, three.report);
  assert.equal(reviewResults(three.file, kit).structuralChecksPassed, false);
});
