import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const directory = new URL('.', import.meta.url);
const sessionPath = '/Users/kalias/.dsh/sessions/--Users-kalias-Documents-project-app-test_folder--/session-cd99a82a-3ea7-4e5e-af12-8b18a1fdb44a/session.v4.jsonl.zstd';
const source = fs.readFileSync(sessionPath);
const events = execFileSync('/opt/homebrew/bin/zstd', ['-d', '-c', sessionPath], { maxBuffer: 32 * 1024 * 1024 })
  .toString().trim().split('\n').map(line => JSON.parse(line));
const text = event => event.data.message.content.filter(part => part.type === 'text').map(part => part.text).join('');
const calls = events.filter(event => event.type === 'tool/call');
const results = events.filter(event => event.type === 'tool/result');
const exports = calls.filter(event => event.data.name === 'openbkn_export_csv').map(call => ({
  call, result: results.find(event => event.data.message.toolCallId === call.data.callId),
}));
const delivered = exports.find(entry => entry.result && !entry.result.data.message.isError);
if (!delivered) throw new Error('No successful CSV export in this session.');
const receipt = JSON.parse(text(delivered.result));
const finish = calls.find(event => event.data.name === 'mcp__openbkn__bkn_finish_interaction');
if (!finish || finish.seq <= delivered.call.seq) throw new Error('Export did not precede finish.');
const finishResult = results.find(event => event.data.message.toolCallId === finish.data.callId);
if (!finishResult || finishResult.data.message.isError) throw new Error('Interaction finish did not succeed.');
const headers = events.filter(event => event.type === 'request/header').map(event => ({
  seq: event.seq, names: event.data.header.tools.map(tool => tool.name),
}));
for (const header of headers) {
  if (header.names.some(name => ['write', 'edit', 'mcp__openbkn__run_cypher'].includes(name))) throw new Error('Forbidden model-visible tool.');
  if (!header.names.includes('openbkn_export_csv')) throw new Error('CSV tool missing.');
}
const final = events.filter(event => event.type === 'assistant/message').at(-1);
const destination = link => /\]\(<?([^)>]+)>?\)/u.exec(link)?.[1];
const finalLinks = [...text(final).matchAll(/\[[^\]]*\]\(<?[^)>]+>?\)/gu)].map(match => match[0]);
if (!finalLinks.some(link => destination(link) === destination(receipt.markdown_link))) throw new Error('Final answer omits the verified file destination.');
const bytes = fs.readFileSync(receipt.path);
if (bytes.length !== receipt.bytes || createHash('sha256').update(bytes).digest('hex') !== receipt.sha256) throw new Error('Receipt mismatch.');
const systems = events.filter(event => event.type === 'system/message').map(event => ({
  seq: event.seq, hasEffectiveRouting: text(event).includes('General platform and Host instructions describe a broader tool surface'),
}));
if (!systems.every(event => event.hasEffectiveRouting)) throw new Error('New session routing absent.');
fs.writeFileSync(new URL('live-export-receipt.json', directory), JSON.stringify(receipt, null, 2) + '\n');
fs.writeFileSync(new URL('live-final-answer.md', directory), text(final) + '\n');
const report = {
  date: '2026-11-02', timezone: 'Asia/Taipei', sessionPath,
  sessionSha256: createHash('sha256').update(source).digest('hex'),
  model: final.data.message.source.model, headers, systems,
  calls: calls.map(event => ({ seq: event.seq, step: event.data.step, name: event.data.name })),
  toolErrors: results.filter(event => event.data.message.isError).map(event => ({ step: event.data.step, text: text(event) })),
  exportBeforeFinish: true, exportReceipt: receipt, finish: JSON.parse(text(finishResult)),
  finalLinkMatchesReceipt: true, finalMarkdownLinkVerbatim: text(final).includes(receipt.markdown_link), bytesMatchReceipt: true,
  sourceUnchangedDuringExtraction: source.equals(fs.readFileSync(sessionPath)),
  scope: 'Actual DSH persisted request catalogues, final visible model text and tool results. No reasoning or credentials copied. UI click-to-open is recorded separately.',
};
fs.writeFileSync(new URL('LIVE.json', directory), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ sessionPath, model: report.model, tools: headers.map(h => h.names.length),
  calls: report.calls, errors: report.toolErrors, receipt }, null, 2));
