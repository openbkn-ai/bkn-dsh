// probe-openssl-chain.mjs — ONE OpenSSL chain collection (verification ON, error-returning),
// in-memory parsing only; keeps cert metadata + verify result, never prints raw output.
// Then ONE offline verification of the obtained chain against the specified CA.
import { execFileSync } from "node:child_process";
import { writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { X509Certificate, createHash } from "node:crypto";

const OPENSSL = "C:\\Program Files\\Git\\ucrt64\\bin\\openssl.exe";
const HOST = "192.168.50.129", PORT = "443";
const CA_FILE = process.env.NODE_EXTRA_CA_CERTS;

const out = { probeKind: "openssl-chain-single", atUtc: new Date().toISOString(),
  openssl: "3.5.8 (Git ucrt64, pre-existing)", target: `${HOST}:${PORT}`, verification: "enabled (-verify_return_error)" };

// 1) chain collection (one attempt, 10s timeout via s_client -timeout not supported on windows; rely on exec timeout)
let raw = "";
try {
  raw = execFileSync(OPENSSL, ["s_client", "-connect", `${HOST}:${PORT}`, "-servername", HOST,
    "-verify_return_error", "-showcerts"], { input: "", timeout: 10000, encoding: "utf8", shell: false });
} catch (e) {
  raw = typeof e.stdout === "string" ? e.stdout : "";
  out.collectExit = "nonzero-or-timeout (raw still parsed in memory)";
}
const verifyLine = raw.split("\n").find(l => /^Verification|verify (error|return code)/i.test(l.trim()))?.trim() ?? null;
out.opensslVerifySummary = verifyLine;

// 2) extract PEM blocks (in memory), write public certs to a temp dir for offline verify
const blocks = raw.match(/-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g) ?? [];
out.chainCertificateCount = blocks.length;
const tmp = mkdtempSync(join(tmpdir(), "ca-readonly-"));
const metas = blocks.map((b, i) => {
  const x = new X509Certificate(b);
  const p = join(tmp, `c${i}.pem`); writeFileSync(p, b);
  const m = { index: i, subject: x.subject.replace(/\n/g, ", "), issuer: x.issuer.replace(/\n/g, ", "),
    sha256Fingerprint: x.fingerprint256, validFromUtc: x.validFromDate.toISOString(), validToUtc: x.validToDate.toISOString(), isCa: x.ca };
  if (i === 0) m.san = x.subjectAltName ?? null;
  m.file = p;
  return m;
});
out.chain = metas.map(({file, ...rest}) => rest);

// 3) offline verification with the existing CA (one run; public certs only in temp)
if (metas.length && CA_FILE && CA_FILE !== "UNSET") {
  const leafPath = metas[0].file;
  const others = metas.slice(1).map(m => m.file);
  try {
    const args = ["verify", "-CAfile", CA_FILE];
    if (others.length) args.push("-untrusted", join(tmp, "chain.pem"));
    if (others.length) writeFileSync(join(tmp, "chain.pem"), metas.slice(1).map(m => blocks[m.index]).join("\n"));
    args.push(leafPath);
    const r = execFileSync(OPENSSL, args, { encoding: "utf8", timeout: 10000 });
    out.offlineVerifyWithExistingCa = { exit: 0, output: r.trim() };
  } catch (e) {
    out.offlineVerifyWithExistingCa = { exit: "nonzero", output: String(e.stdout ?? e.message ?? "").trim().slice(0, 300) };
  }
}
console.log(JSON.stringify(out, null, 2));
console.log("TEMPDIR=" + tmp);
