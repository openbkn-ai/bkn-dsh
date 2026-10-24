import { readFileSync, statSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { verifyKit } from './verify.mjs';

const read = path => JSON.parse(readFileSync(path, 'utf8').replace(/^\uFEFF/, ''));
export function reviewResults(reportFile, kitRoot = dirname(fileURLToPath(import.meta.url))) {
  verifyKit(kitRoot);
  const result = read(reportFile), root = dirname(resolve(reportFile));
  const pin = read(resolve(kitRoot, 'pins.json'));
  const files = read(resolve(kitRoot, 'package-files.json')).files;
  const required = read(resolve(kitRoot, 'RESULTS.template.json')).requiredCases;
  const errors = [];
  function evidence(name) {
    if (typeof name !== 'string' || !name || isAbsolute(name) || name.includes('\\')) throw new Error('Use a nonempty relative evidence path with forward slashes');
    const path = resolve(root, name), rel = relative(root, path);
    if (!rel || rel.split(sep).includes('..') || !statSync(path).isFile() || statSync(path).size === 0) throw new Error(`Missing or unsafe evidence: ${name}`);
    return path;
  }
  function hostReceipt(name, form) {
    const hostPath = evidence(name), host = read(hostPath);
    if (host.form !== form || host.profile !== (form === 'desktop' ? 'desktop' : 'web') || host.dshVersion !== pin.dsh.version || host.pluginVersion !== pin.plugin.version || !/Windows/i.test(host.os) || !host.processes?.length) throw new Error(`${form}: wrong Host identity`);
    for (const proc of host.processes) if (!Number.isInteger(proc.pid) || !proc.executable || !proc.createdAt) throw new Error(`${form}: missing process identity`);
    const prefix = relative(root, dirname(hostPath)).split(sep).join('/');
    const packagePath = evidence(`${prefix ? prefix + '/' : ''}${host.packageReceipt}`);
    const pkg = read(packagePath);
    if (pkg.version !== pin.plugin.version || pkg.publishedTgzSha256 !== pin.plugin.sha256 || pkg.verifiedFiles !== 74 || pkg.allFilesMatchPublishedPackage !== true || JSON.stringify(pkg.files) !== JSON.stringify(files.map(({path, sha256}) => ({path, sha256})))) throw new Error(`${form}: package receipt does not match all published files`);
  }
  if (!result.tester?.trim() || !result.testedAt?.trim() || !result.platform?.baseUrl || result.platform.version !== '0.2.0' || result.platform.cliVersion !== '0.2.0' || !result.platform.contractReviewEvidence) errors.push('Missing operator/date/platform/CLI/contract review identity');
  if (result.pluginVersion !== pin.plugin.version || result.dshVersion !== pin.dsh.version) errors.push('Report version mismatch');
  if (result.platform?.contractReviewEvidence) { try { evidence(result.platform.contractReviewEvidence); } catch (error) { errors.push(error.message); } }
  if (!Array.isArray(result.anomalies) || result.anomalies.length !== 0) errors.push('Observed anomalies require independent maintainer disposition; structural review does not waive them');
  for (const form of ['desktop', 'npm']) {
    try {
      const row = result.forms?.[form];
      if (row?.manualConfirmed !== true) throw new Error(`${form}: manual confirmation is pending`);
      hostReceipt(row.hostReceipt, form);
      if (row.restartReceipts?.length !== 2) throw new Error(`${form}: both language restart receipts are required`);
      for (const phase of ['restart-en', 'restart-zh']) {
        const name = row.restartReceipts.find(path => path.endsWith(`/${phase}-host.json`));
        if (!name || read(evidence(name)).phase !== phase) throw new Error(`${form}: missing ${phase} receipt`);
        hostReceipt(name, form);
      }
      if (row.cases?.length !== required.length || new Set(row.cases.map(x => x.id)).size !== required.length) throw new Error(`${form}: incomplete or duplicate case set`);
      for (const id of required) {
        const item = row.cases.find(x => x.id === id);
        if (item?.status !== 'PASS' || !item.notes?.trim() || !item.evidence?.length) throw new Error(`${form}/${id}: not passed or evidence/observation missing`);
        for (const name of item.evidence) evidence(name);
      }
    } catch (error) { errors.push(error.message); }
  }
  return { structuralChecksPassed: errors.length === 0, errors, nativeUiTruthEstablishedByThisScript: false,
    maintainerReviewRequired: true, npmTagsChanged: false };
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = reviewResults(resolve(process.argv[2]));
    console.log(JSON.stringify(result, null, 2));
    if (!result.structuralChecksPassed) process.exitCode = 1;
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
