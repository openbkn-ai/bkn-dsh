#!/usr/bin/env node
// Render the GitHub Release notes of one plugin version: the install command,
// then that version's CHANGELOG section. Fails when the CHANGELOG has no
// section for the version, so a tag cannot ship with empty notes.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

/**
 * @param {string} changelog - full CHANGELOG.md text.
 * @param {string} version - exact version heading to extract.
 * @returns {string} the section body, without its heading.
 */
export function changelogSection(changelog, version) {
  const lines = changelog.split(/\r?\n/)
  const start = lines.findIndex(line => line === `## ${version}` || line.startsWith(`## ${version} `))
  if (start === -1) throw new Error(`CHANGELOG.md has no "## ${version}" section; add it before tagging the release.`)
  const rest = lines.slice(start + 1)
  const end = rest.findIndex(line => line.startsWith('## '))
  const body = (end === -1 ? rest : rest.slice(0, end)).join('\n').trim()
  if (body === '') throw new Error(`CHANGELOG.md section "## ${version}" is empty.`)
  return body
}

/**
 * @param {{ version: string, packageName: string, dshTag: string, changelog: string }} input
 * @returns {string} markdown release notes.
 */
export function renderPluginReleaseNotes({ version, packageName, dshTag, changelog }) {
  return [
    `OpenBKN Business Context plugin for DeepSeek Harness \`${dshTag}\`. Installing the plugin is all you need:`,
    '',
    '```bash',
    `dsh plugin --profile <desktop|web> add ${packageName}@${version}`,
    '```',
    '',
    'Setup: [README](https://github.com/openbkn-ai/bkn-dsh#install-and-start) · [中文](https://github.com/openbkn-ai/bkn-dsh/blob/main/README.zh.md). '
      + `npm: https://www.npmjs.com/package/${packageName}/v/${version} (published with provenance from this tag). `
      + 'The attached `.tgz` is the published npm tarball.',
    '',
    '## Changes',
    '',
    changelogSection(changelog, version),
    '',
  ].join('\n')
}

function argument(name) {
  const index = process.argv.indexOf(`--${name}`)
  const value = index === -1 ? undefined : process.argv[index + 1]
  if (value === undefined || value.startsWith('--')) throw new Error(`Usage: plugin-release-notes.mjs --version <v> --package <name> --dsh-tag <tag>`)
  return value
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const changelog = readFileSync(new URL('../CHANGELOG.md', import.meta.url), 'utf8')
  process.stdout.write(renderPluginReleaseNotes({
    version: argument('version'),
    packageName: argument('package'),
    dshTag: argument('dsh-tag'),
    changelog,
  }))
}
