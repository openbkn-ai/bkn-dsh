// Read-only artifact identity under the official executable's own Node mode.
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import {dirname,join} from 'node:path'
import {createRequire} from 'node:module'
const originalFs=createRequire(import.meta.url)('original-fs')
const resources=process.platform==='win32'?join(dirname(process.execPath),'resources'):join(dirname(process.execPath),'..','Resources')
const asar=join(resources,'app.asar'),runtime=join(asar,'dsh'),read=p=>JSON.parse(readFileSync(p,'utf8')),sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex'),pkg=n=>read(join(runtime,'node_modules',n,'package.json'))
const result={platform:process.platform,node:process.versions.node,electron:process.versions.electron,dshVersion:pkg('@deepseek-ai/dsh').version,cordis:pkg('@deepseek-ai/cordis').version,schemastery:pkg('@deepseek-ai/schemastery').version,asarSha256:createHash('sha256').update(originalFs.readFileSync(asar)).digest('hex'),installationMcpSha256:sha(join(runtime,'node_modules/@deepseek-ai/dsh-mcp-client/lib/index.js'))}
assert.equal(result.dshVersion,'0.2.1-rc.3');assert.equal(result.node,'24.21.0');assert.equal(result.electron,'44.7.0');assert.equal(result.cordis,'4.0.5');assert.equal(result.schemastery,'3.18.5');assert.equal(result.installationMcpSha256,'758d8fc473b700b5d351158d06ce9f9e92c16e8b25497b08bb7bd2122a87f5dd')
console.log(JSON.stringify(result))
