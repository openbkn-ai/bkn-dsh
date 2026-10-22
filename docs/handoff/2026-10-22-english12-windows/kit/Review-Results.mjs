import { readFileSync, statSync, realpathSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve, sep, win32 } from 'node:path';
import { fileURLToPath } from 'node:url';
import { verifyKit } from './verify.mjs';

const read = path => JSON.parse(readFileSync(path, 'utf8').replace(/^\uFEFF/, ''));
export function reviewResults(reportFile, kitRoot = dirname(fileURLToPath(import.meta.url))) {
  verifyKit(kitRoot);
  const result = read(reportFile), root = realpathSync(dirname(resolve(reportFile)));
  const pin = read(resolve(kitRoot, 'pins.json'));
  const files = read(resolve(kitRoot, 'package-files.json')).files;
  const required = read(resolve(kitRoot, 'RESULTS.template.json')).requiredCases;
  const structureErrors = [], acceptanceIssues = [];
  const referenced = new Set(), seenHosts = new Set(), seenPackages = new Set();
  let evidenceReferencesChecked = 0, hostReceiptsChecked = 0, packageReceiptsChecked = 0;
  const check = fn => { try { fn(); } catch (error) { structureErrors.push(error.message); } };
  function evidence(name) {
    evidenceReferencesChecked++;
    if (typeof name !== 'string' || !name || /^[a-z]:/i.test(name) || isAbsolute(name) || win32.isAbsolute(name) || name.includes('\\')) throw new Error('Use a nonempty relative evidence path with forward slashes');
    const path = realpathSync(resolve(root, name)), rel = relative(root, path);
    if (!rel || rel.split(sep).includes('..') || !statSync(path).isFile() || statSync(path).size === 0) throw new Error(`Missing or unsafe evidence: ${name}`);
    referenced.add(name);
    return path;
  }
  function packageReceipt(name, form = 'referenced') {
    const path = evidence(name);
    if (seenPackages.has(path)) return;
    seenPackages.add(path); packageReceiptsChecked++;
    const pkg = read(path);
    if (pkg.version !== pin.plugin.version || pkg.candidateTgzSha256 !== pin.plugin.sha256 || pkg.verifiedFiles !== files.length || pkg.allFilesMatchCandidatePackage !== true || JSON.stringify(pkg.files) !== JSON.stringify(files.map(({path, sha256}) => ({path, sha256})))) throw new Error(`${form}: package receipt does not match all candidate files`);
  }
  function hostReceipt(name, form) {
    const hostPath = evidence(name), host = read(hostPath);
    if (!seenHosts.has(hostPath)) { seenHosts.add(hostPath); hostReceiptsChecked++; }
    check(() => {
      if (!['desktop', 'npm'].includes(form) || host.form !== form || host.profile !== (form === 'desktop' ? 'desktop' : 'web') || host.dshVersion !== pin.dsh.version || host.pluginVersion !== pin.plugin.version || !/Windows/i.test(host.os) || !host.processes?.length) throw new Error(`${form}: wrong Host identity`);
      for (const proc of host.processes) if (!Number.isInteger(proc.pid) || !proc.executable || !proc.createdAt) throw new Error(`${form}: missing process identity`);
    });
    const prefix = relative(root, dirname(hostPath)).split(sep).join('/');
    packageReceipt(`${prefix ? prefix + '/' : ''}${host.packageReceipt}`, form);
  }
  if (!result.tester?.trim() || !result.testedAt?.trim() || !result.platform?.baseUrl || result.platform.version !== '0.2.0' || result.platform.cliVersion !== '0.2.0' || !result.platform.contractReviewEvidence) structureErrors.push('Missing operator/date/platform/CLI/contract review identity');
  if (result.pluginVersion !== pin.plugin.version || result.dshVersion !== pin.dsh.version) structureErrors.push('Report version mismatch');
  if (result.platform?.contractReviewEvidence) check(() => evidence(result.platform.contractReviewEvidence));
  if (!Array.isArray(result.anomalies) || result.anomalies.length !== 0) acceptanceIssues.push('Observed anomalies require independent maintainer disposition; structural review does not waive them');
  for (const form of ['desktop', 'npm']) {
    const row = result.forms?.[form];
    if (!row) { structureErrors.push(`${form}: missing form`); continue; }
    if (row.manualConfirmed !== true) acceptanceIssues.push(`${form}: manual confirmation is pending`);
    check(() => hostReceipt(row.hostReceipt, form));
    if (row.restartReceipts?.length !== 2) structureErrors.push(`${form}: both language restart receipts are required`);
    for (const phase of ['restart-en', 'restart-zh']) check(() => {
      const name = row.restartReceipts?.find(path => path.endsWith(`/${phase}-host.json`));
      if (!name) throw new Error(`${form}: missing ${phase} receipt`);
      hostReceipt(name, form);
      if (read(evidence(name)).phase !== phase) throw new Error(`${form}: wrong ${phase} receipt`);
    });
    if (row.cases?.length !== required.length || new Set(row.cases?.map(x => x.id)).size !== required.length) structureErrors.push(`${form}: incomplete or duplicate case set`);
    for (const id of required) {
      const item = row.cases?.find(x => x.id === id);
      if (!item) { structureErrors.push(`${form}/${id}: missing case`); continue; }
      if (!['PASS', 'FAIL', 'BLOCKED', 'NOT_RUN'].includes(item.status)) structureErrors.push(`${form}/${id}: invalid status`);
      if (item.status !== 'PASS') acceptanceIssues.push(`${form}/${id}: ${item.status}`);
      if (!item.notes?.trim() || !item.evidence?.length) structureErrors.push(`${form}/${id}: observation/evidence missing`);
      for (const name of item.evidence ?? []) check(() => evidence(name));
    }
    check(() => {
      const cleanup = read(evidence(row.cleanupReceipt));
      if (cleanup.form !== form || !Array.isArray(cleanup.remainingOwnedPids) || !Array.isArray(cleanup.remainingListeners)) throw new Error(`${form}: invalid cleanup receipt`);
      if (cleanup.remainingOwnedPids.length || cleanup.remainingListeners.length) acceptanceIssues.push(`${form}: cleanup incomplete`);
    });
    for (const name of row.additionalEvidence ?? []) check(() => evidence(name));
  }
  // Visit anomaly references even when the report contains FAIL/BLOCKED items.
  for (const item of Array.isArray(result.anomalies) ? result.anomalies : []) {
    for (const name of item.evidence ?? []) check(() => evidence(name));
  }
  // Case/anomaly references can contain additional before/login receipts too.
  // Inspect every referenced JSON receipt, not just the six primary slots.
  for (const name of referenced) {
    if (!name.toLowerCase().endsWith('.json')) continue;
    check(() => {
      const value = read(evidence(name));
      if (value && Object.hasOwn(value, 'remainingOwnedPids')) {
        if (!['desktop', 'npm'].includes(value.form) || !Array.isArray(value.remainingOwnedPids) || !Array.isArray(value.remainingListeners)) throw new Error(`${name}: invalid referenced cleanup receipt`);
        if (value.remainingOwnedPids.length || value.remainingListeners.length) acceptanceIssues.push(`${value.form}: referenced cleanup incomplete: ${name}`);
      }
      if (value && typeof value.packageReceipt === 'string') hostReceipt(name, value.form);
      else if (value?.packageName === pin.plugin.name && Array.isArray(value.files)) packageReceipt(name);
    });
  }
  return { structuralChecksPassed: structureErrors.length === 0,
    acceptanceReady: structureErrors.length === 0 && acceptanceIssues.length === 0,
    errors: [...structureErrors, ...acceptanceIssues], structureErrors, acceptanceIssues,
    evidenceReferencesChecked, hostReceiptsChecked, packageReceiptsChecked,
    nativeUiTruthEstablishedByThisScript: false, maintainerReviewRequired: true, npmTagsChanged: false };
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = reviewResults(resolve(process.argv[2]));
    console.log(JSON.stringify(result, null, 2));
    if (!result.acceptanceReady) process.exitCode = 1;
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
