// Minimal CDP driver for the Chrome capture window (port 9335), login-repro round 2.
// Commands: state | eval <expr|@file> | click <textFragment> | setdl <dir>
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { createRequire } from "node:module";
const require_ = createRequire("C:\\bkn-verify\\english12-npm\\tools\\node_modules\\");
const { default: WebSocket } = await import(pathToFileURL("C:\\bkn-verify\\english12-npm\\tools\\node_modules\\ws\\wrapper.mjs").href)
  .catch(() => ({ default: require_("ws") }));
const PORT = 9335;
const cmd = process.argv[2];
const arg = process.argv[3];
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const targets = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json();
const page = targets.find(t => t.type === "page" && !t.url.startsWith("devtools"));
if (!page) throw new Error("no page target");
const ws = new WebSocket(page.webSocketDebuggerUrl, { perMessageDeflate: false });
let idSeq = 1;
const pending = new Map();
ws.addEventListener("message", (ev) => {
  const raw = Buffer.isBuffer(ev.data) ? ev.data.toString("utf8") : String(ev.data);
  const msg = JSON.parse(raw);
  if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
});
await new Promise((resolve, reject) => { ws.addEventListener("open", resolve); ws.addEventListener("error", reject); });
const send = (method, params = {}) => new Promise((resolve) => { const id = idSeq++; pending.set(id, resolve); ws.send(JSON.stringify({ id, method, params })); });

if (cmd === "state") {
  const ev = await send("Runtime.evaluate", { expression: "location.href + ' ||| ' + document.title", returnByValue: true });
  console.log(ev.result.result.value);
} else if (cmd === "eval") {
  const expression = arg.startsWith("@") ? readFileSync(arg.slice(1), "utf8") : arg;
  const ev = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (ev.result.exceptionDetails) console.log("EXC: " + String(ev.result.exceptionDetails.exception?.description ?? ev.result.exceptionDetails.text).slice(0, 400));
  else console.log(String(ev.result.result.value).slice(0, 3000));
} else if (cmd === "click") {
  const ev = await send("Runtime.evaluate", {
    expression: `(() => { const b = [...document.querySelectorAll('button')].find(e => (e.textContent||'').includes(${JSON.stringify(arg)})); if (!b) return 'NOT FOUND'; b.click(); return 'CLICKED ' + new Date().toISOString(); })()`,
    returnByValue: true
  });
  console.log(ev.result.result.value);
} else if (cmd === "setdl") {
  await send("Browser.setDownloadBehavior", { behavior: "allow", downloadPath: arg, eventsEnabled: true });
  console.log("download path set: " + arg);
} else {
  console.log("usage: state | eval <expr|@file> | click <text> | setdl <dir>");
}
ws.close();
