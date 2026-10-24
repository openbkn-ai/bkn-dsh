// probe-ca-parse.mjs — read-only parse of an existing CA file via node:crypto X509Certificate
// Usage: node probe-ca-parse.mjs <pemPath>
import { readFileSync } from "node:fs";
import { X509Certificate, createHash } from "node:crypto";
const path = process.argv[2];
const buf = readFileSync(path);
const text = buf.toString("utf8");
const blocks = text.match(/-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g) ?? [];
const out = {
  probeKind: "ca-file-parse-readonly",
  atUtc: new Date().toISOString(),
  path,
  fileSha256: createHash("sha256").update(buf).digest("hex"),
  fileBytes: buf.length,
  certificateCount: blocks.length,
  certs: blocks.map((b, i) => {
    const x = new X509Certificate(b);
    return {
      index: i,
      subject: x.subject.replace(/\n/g, ", "),
      issuer: x.issuer.replace(/\n/g, ", "),
      sha256Fingerprint: x.fingerprint256,
      validFromUtc: x.validFromDate.toISOString(),
      validToUtc: x.validToDate.toISOString(),
      isCa: x.ca,
      keyUsage: typeof x.keyUsage === "string" ? x.keyUsage : null,
    };
  }),
};
console.log(JSON.stringify(out, null, 2));
