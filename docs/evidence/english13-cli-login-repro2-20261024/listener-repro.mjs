// Passive CDP listener for the single beginLogin RPC (english13 cli-login repro).
// Browser-level auto-attach (page + worker targets). Raw response bodies are
// processed in memory only: never printed, never written to disk. Only the
// redacted minimal record reaches stdout / the jsonl file.
// Usage: node listener-repro.mjs <cdpPort> <outJsonl>
import { createRequire } from "node:module";
import { appendFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const PORT = Number(process.argv[2] ?? 9334);
const OUT = process.argv[3] ?? "repro-capture-redacted.jsonl";
const require_ = createRequire("C:\\bkn-verify\\english12-npm\\tools\\node_modules\\");
const { default: WebSocket } = await import(pathToFileURL("C:\\bkn-verify\\english12-npm\\tools\\node_modules\\ws\\wrapper.mjs").href)
  .catch(() => ({ default: require_("ws") }));

// ---------- redaction (unit-tested with synthetic strings at startup) ----------
function redact(s) {
  if (typeof s !== "string") return { text: String(s), uncertain: false };
  let uncertain = false;
  let r = s;
  const sub = (re, tag) => { const before = r; r = r.replace(re, tag); if (r !== before) uncertain = true; };
  sub(/https?:\/\/\S+/gi, "<url>");
  sub(/\bsk-[A-Za-z0-9_-]+/gi, "<key>");
  sub(/\bBearer\s+[A-Za-z0-9._-]+/gi, "<bearer>");
  sub(/\b[A-Z0-9]{4}(?:-[A-Z0-9]{4})+\b/g, "<device-code>");
  sub(/[A-Za-z0-9+/_=-]{20,}/g, "<token>");
  const truncated = r.length > 400;
  if (truncated) r = r.slice(0, 400);
  return { text: r, uncertain, truncated, rawLen: s.length };
}

// self-test with synthetic (safe) samples; aborts if redaction fails
const samples = [
  ["authorize at https://192.168.50.129/device?u=abc123XYZ user_code AB12-CD34", /<url>.*<device-code>/],
  ["key sk-abc123def456ghi789jkl failed token QWERTYUIOPASDFGH123456", /<key>.*<token>/],
];
for (const [input, expect] of samples) {
  const out = redact(input);
  if (!expect.test(out.text)) { console.error("REDACTION SELF-TEST FAILED"); process.exit(2); }
}
console.log("[selftest] redaction ok");

// ---------- CDP wiring ----------
const ver = await (await fetch(`http://127.0.0.1:${PORT}/json/version`)).json();
const ws = new WebSocket(ver.webSocketDebuggerUrl, { perMessageDeflate: false });
let idSeq = 1;
const pending = new Map();
const sessions = new Map(); // sessionId -> {targetInfo}
const reqs = new Map();     // sessionId + "|" + requestId -> record
let beginLoginCount = 0;

ws.addEventListener("message", (ev) => {
  const raw = Buffer.isBuffer(ev.data) ? ev.data.toString("utf8") : String(ev.data);
  let msg; try { msg = JSON.parse(raw); } catch { return; }
  if (msg.id !== undefined && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); return; }
  if (!msg.method) return;
  handleEvent(msg).catch(() => {});
});
const send = (method, params = {}, sessionId) => new Promise((resolve) => {
  const id = idSeq++;
  const m = { id, method, params };
  if (sessionId) m.sessionId = sessionId;
  pending.set(id, resolve);
  ws.send(JSON.stringify(m));
});

async function handleEvent(msg) {
  const { method, params, sessionId } = msg;
  if (method === "Target.attachedToTarget") {
    const { sessionId: sid, targetInfo, waitingForDebugger } = params;
    sessions.set(sid, { targetInfo });
    await send("Network.enable", {}, sid).catch(() => {});
    await send("Target.setAutoAttach", { autoAttach: true, waitForDebuggerOnStart: false, flatten: true }, sid).catch(() => {});
    if (waitingForDebugger) await send("Runtime.runIfWaitingForDebugger", {}, sid).catch(() => {});
    return;
  }
  if (!sessionId) return;
  const key = (r) => sessionId + "|" + r;
  if (method === "Network.requestWillBeSent") {
    const { requestId, request, wallTime, timestamp } = params;
    const url = request.url;
    if (!url.includes("/api/openbknBusinessContext/")) return;
    const isTarget = url.includes("beginLogin");
    const rec = { key: key(requestId), sessionId, requestId, isTarget,
      urlPath: new URL(url).pathname + new URL(url).search,
      httpMethod: request.method, reqWall: wallTime, reqTs: timestamp, httpStatus: null,
      respWall: null, rpcMethod: null, rpcId: null };
    if (isTarget && typeof request.postData === "string") {
      try {
        const body = JSON.parse(request.postData);
        rec.rpcMethod = typeof body.method === "string" ? body.method : null;
        const idv = body.rpcId ?? body.id ?? body.requestId;
        rec.rpcId = idv !== undefined && idv !== null ? String(idv).slice(0, 64) : null;
      } catch { /* not JSON: leave null */ }
    }
    if (isTarget) beginLoginCount++;
    reqs.set(rec.key, rec);
    return;
  }
  if (method === "Network.responseReceived") {
    const { requestId, response, timestamp } = params;
    const rec = reqs.get(key(requestId));
    if (!rec) return;
    rec.httpStatus = response.status;
    rec.respTs = timestamp;
    rec.respWall = rec.reqWall !== undefined && rec.respTs !== undefined && rec.reqTs !== undefined
      ? rec.reqWall + (rec.respTs - rec.reqTs) : null;
    return;
  }
  if (method === "Network.loadingFinished" || method === "Network.loadingFailed") {
    const { requestId, timestamp, errorText } = params;
    const rec = reqs.get(key(requestId));
    if (!rec || rec.done) return;
    rec.done = true;
    if (rec.respTs === undefined && timestamp !== undefined) {
      rec.respWall = rec.reqWall !== undefined && rec.reqTs !== undefined ? rec.reqWall + (timestamp - rec.reqTs) : null;
    }
    if (method === "Network.loadingFailed") { rec.loadError = String(errorText ?? "").slice(0, 80); }
    else if (rec.isTarget) {
      try {
        const bodyRes = await send("Network.getResponseBody", { requestId }, sessionId);
        const b = bodyRes.result?.body;
        if (typeof b === "string") {
          try {
            const j = JSON.parse(b);
            rec.resultOk = typeof j.ok === "boolean" ? j.ok : (j.error ? false : (j.result !== undefined ? true : null));
            if (j.error && typeof j.error === "object") {
              rec.errorCode = typeof j.error.code === "string" ? j.error.code.slice(0, 120) : (j.error.code ?? null);
              if (typeof j.error.message === "string") {
                const red = redact(j.error.message);
                rec.errorMessageRedacted = red.text;
                rec.redactionUncertain = red.uncertain;
                rec.messageTruncated = red.truncated;
                rec.rawMessageLen = red.rawLen;
              }
              const safeExtras = {};
              for (const [k, v] of Object.entries(j.error)) {
                if (k === "message" || k === "code") continue;
                if ((typeof v === "string" && v.length <= 64) || typeof v === "number" || typeof v === "boolean") {
                  const red = redact(String(v));
                  if (!red.uncertain) safeExtras[k] = typeof v === "string" ? red.text : v;
                }
              }
              if (Object.keys(safeExtras).length) rec.errorSafeFields = safeExtras;
            }
            // success path: keep only the ok flag; no business content retained
          } catch { rec.bodyParse = "non-json"; }
        } else { rec.bodyAvailable = false; }
      } catch (e) { rec.bodyFetchError = String(e.message ?? e).slice(0, 80); }
    }
    emit(rec);
    reqs.delete(rec.key);
  }
}

function emit(rec) {
  const iso = (w) => (typeof w === "number" ? new Date(w * 1000).toISOString() : null);
  const out = {
    kind: rec.isTarget ? "beginLogin" : "assoc-validate",
    source: rec.isTarget ? "beginLogin RPC error.message (browser CDP passive capture)" : "natural panel request",
    urlPath: rec.urlPath, httpMethod: rec.httpMethod,
    rpcMethod: rec.rpcMethod ?? null, rpcId: rec.rpcId ?? null,
    reqTimeUtc: iso(rec.reqWall), respTimeUtc: iso(rec.respWall),
    httpStatus: rec.httpStatus ?? null, resultOk: rec.resultOk ?? null,
    errorCode: rec.errorCode ?? null, errorMessageRedacted: rec.errorMessageRedacted ?? null,
    redactionUncertain: rec.redactionUncertain ?? null, messageTruncated: rec.messageTruncated ?? null,
    rawMessageLen: rec.rawMessageLen ?? null,
    errorSafeFields: rec.errorSafeFields ?? null,
    bodyAvailable: rec.bodyAvailable ?? null, loadError: rec.loadError ?? null,
    cdpTargetType: sessions.get(rec.sessionId)?.targetInfo?.type ?? null,
  };
  const line = JSON.stringify(out);
  appendFileSync(OUT, line + "\n");
  console.log(line);
}

await new Promise((resolve, reject) => { ws.addEventListener("open", resolve); ws.addEventListener("error", reject); });
await send("Target.setDiscoverTargets", { discover: true });
await send("Target.setAutoAttach", { autoAttach: true, waitForDebuggerOnStart: false, flatten: true });
writeFileSync(OUT, "");
console.log("[listener] ready on CDP " + PORT);
setInterval(() => console.log("[listener] heartbeat beginLoginCount=" + beginLoginCount), 30000);
