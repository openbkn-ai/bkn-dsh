#!/usr/bin/env node
/**
 * Minimal runner for docs/eval/supply-ontology.yaml (G6/G7).
 *
 * Modes:
 *   --list                     print the evaluation set
 *   (default)                  interactive: ask each case's question, judge
 *                              every criterion with y/n, print a pass-rate
 *                              summary
 *   --answers <file>           batch mode: JSON mapping case id -> array of
 *                              booleans (one per expectFacts+forbidden line,
 *                              in order) or "pass"/"fail"
 *   --out <file>               also write a markdown results file
 *
 * Judgement is intentionally manual for now: the questions need a live
 * OpenBKN platform and a model, which CI does not have. The output shape is
 * stable so assertions can be introduced incrementally.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { createInterface } from 'node:readline/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { load } = require('js-yaml')

const here = dirname(fileURLToPath(import.meta.url))
const SET_PATH = resolve(here, 'supply-ontology.yaml')

function loadSet() {
  const doc = load(readFileSync(SET_PATH, 'utf8'))
  if (doc?.network === undefined || !Array.isArray(doc.cases) || doc.cases.length === 0) {
    throw new Error(`malformed evaluation set: ${SET_PATH}`)
  }
  for (const c of doc.cases) {
    if (typeof c.id !== 'string' || typeof c.question !== 'string' || !Array.isArray(c.expectFacts)) {
      throw new Error(`malformed case: ${JSON.stringify(c.id ?? c)}`)
    }
  }
  return doc
}

function criteriaOf(c) {
  const checks = [...c.expectFacts.map(f => `含期望事实：${f}`)]
  for (const f of c.forbidden ?? []) checks.push(`不含禁止项：${f}`)
  return checks
}

function listMode(doc) {
  console.log(`network: ${doc.network}`)
  for (const c of doc.cases) {
    const baseline = c.baselineVerified ? ' [baseline-verified]' : ''
    console.log(`\n[${c.group}] ${c.id}${baseline}`)
    console.log(`  Q: ${c.question}`)
    for (const check of criteriaOf(c)) console.log(`  □ ${check}`)
  }
}

async function ask(rl, prompt) {
  for (;;) {
    const answer = (await rl.question(`${prompt} (y/n) `)).trim().toLowerCase()
    if (answer === 'y' || answer === 'yes') return true
    if (answer === 'n' || answer === 'no') return false
  }
}

async function interactive(doc) {
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  const results = []
  try {
    for (const c of doc.cases) {
      console.log(`\n=== [${c.group}] ${c.id}${c.baselineVerified ? ' [baseline-verified]' : ''} ===`)
      console.log(`Q: ${c.question}`)
      const checks = criteriaOf(c)
      const marks = []
      for (const check of checks) marks.push(await ask(rl, `  ${check}`))
      results.push({ id: c.id, group: c.group, marks, pass: marks.every(Boolean) })
    }
  } finally {
    rl.close()
  }
  return results
}

function batch(doc, answersPath) {
  const raw = JSON.parse(readFileSync(resolve(process.cwd(), answersPath), 'utf8'))
  return doc.cases.map(c => {
    const value = raw[c.id]
    if (value === undefined) throw new Error(`answers file is missing case ${c.id}`)
    const checks = criteriaOf(c)
    let marks
    if (typeof value === 'string') marks = checks.map(() => value === 'pass')
    else {
      if (!Array.isArray(value) || value.length !== checks.length) {
        throw new Error(`case ${c.id}: expected ${checks.length} booleans or "pass"/"fail"`)
      }
      marks = value.map(Boolean)
    }
    return { id: c.id, group: c.group, marks, pass: marks.every(Boolean) }
  })
}

function summarize(doc, results, outPath) {
  const positives = results.filter(r => r.group === 'positive')
  const negatives = results.filter(r => r.group === 'negative')
  const fmt = rs => `${rs.filter(r => r.pass).length}/${rs.length}`
  console.log(`\n== ${doc.network} summary ==`)
  console.log(`positive: ${fmt(positives)}   negative: ${fmt(negatives)}   total: ${fmt(results)}`)
  const failed = results.filter(r => !r.pass)
  if (failed.length > 0) console.log(`failed: ${failed.map(r => r.id).join(', ')}`)
  if (outPath !== undefined) {
    const target = resolve(process.cwd(), outPath)
    mkdirSync(dirname(target), { recursive: true })
    const lines = [
      `# ${doc.network} eval results`, '',
      `date: ${new Date().toISOString()}`, '',
      `positive: ${fmt(positives)} · negative: ${fmt(negatives)} · total: ${fmt(results)}`, '',
      ...results.flatMap(r => [
        `## ${r.id} — ${r.pass ? 'PASS' : 'FAIL'}`,
        ...criteriaOf(doc.cases.find(c => c.id === r.id)).map((check, i) => `- [${r.marks[i] ? 'x' : ' '}] ${check}`),
        '',
      ]),
    ]
    writeFileSync(target, `${lines.join('\n')}\n`)
    console.log(`results written: ${target}`)
  }
}

async function main() {
  const args = process.argv.slice(2)
  const doc = loadSet()
  if (args.includes('--list')) { listMode(doc); return }
  const answersIdx = args.indexOf('--answers')
  const outIdx = args.indexOf('--out')
  const results = answersIdx === -1
    ? await interactive(doc)
    : batch(doc, args[answersIdx + 1])
  summarize(doc, results, outIdx === -1 ? undefined : args[outIdx + 1])
}

main().catch(error => { console.error(String(error)); process.exit(1) })
