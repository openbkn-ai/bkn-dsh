// probe-tls.mjs — ONE strict TLS handshake to the platform, natural inherited env.
// No HTTP request, no auth, no business data. 10s timeout, single attempt.
import { connect as tlsConnect } from "node:tls";
const HOST = "192.168.50.129", PORT = 443;
const result = {
  probeKind: "node-strict-tls-single",
  atUtc: new Date().toISOString(),
  nodeVersion: process.version,
  nodeExe: process.execPath,
  nodeExtraCaCerts: process.env.NODE_EXTRA_CA_CERTS ?? "UNSET",
  target: `${HOST}:${PORT}`,
  verification: "default-on (rejectUnauthorized not overridden)",
  outcome: null, errorCode: null, errorDetailRedacted: null,
  chain: null,
};
const certMeta = (c) => c && !c.isEmpty
  ? { subject: c.subject?.replaceAll("\n", ", "), issuer: c.issuer?.replaceAll("\n", ", "),
      sha256Fingerprint: c.fingerprint256, validFrom: c.valid_from, validTo: c.valid_to }
  : null;
await new Promise((resolve) => {
  const socket = tlsConnect({ host: HOST, port: PORT, timeout: 10000 }, () => {
    result.outcome = "handshake-completed";
    try {
      const leaf = socket.getPeerCertificate();
      const chain = [];
      let cur = leaf, guard = 0;
      while (cur && !cur.isEmpty && guard++ < 8) {
        const m = certMeta(cur);
        if (leaf === cur && typeof cur.subjectaltname === "string") m.san = cur.subjectaltname;
        chain.push(m);
        cur = socket.getPeerCertificate(true) && cur.issuerCertificate;
      }
      result.chain = chain;
    } catch (e) { result.chain = "UNKNOWN"; }
    socket.end(); resolve();
  });
  socket.on("error", (e) => {
    result.outcome = "failed";
    result.errorCode = e.code ?? null;
    result.errorDetailRedacted = String(e.message ?? "").slice(0, 200);
    result.chain = "UNKNOWN-not-obtained";
    resolve();
  });
  socket.on("timeout", () => { result.outcome = "timeout"; result.chain = "UNKNOWN-not-obtained"; socket.destroy(); resolve(); });
});
console.log(JSON.stringify(result, null, 2));
