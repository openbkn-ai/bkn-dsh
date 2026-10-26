import {inspectProfileClosure} from '../../scripts/profile-closure.mjs'
import {readFileSync,writeFileSync,realpathSync} from 'node:fs'
import {createHash} from 'node:crypto'
import {resolve,join} from 'node:path'
import {createRequire} from 'node:module'
const b=resolve('release/local-58'),row=JSON.parse(readFileSync(join(b,'identities-private.json'))).find(x=>x.id===process.argv[2])
const report=await inspectProfileClosure({runtime:row.runtime,host:row.baseHostVersion,profile:row.profileDir,installed:row.installed})
const req=createRequire(join(row.runtime,'package.json')),mcp=realpathSync(req.resolve('@deepseek-ai/dsh-mcp-client'))
writeFileSync(join(row.run,'profile-closure-after-private.json'),JSON.stringify({...report,phase:'post-run read-only closure; complements in-process service/class/MCP proof',mcpPath:mcp,mcpEntrySha256:createHash('sha256').update(readFileSync(mcp)).digest('hex')},null,2)+'\n')
console.log(JSON.stringify({id:row.id,closure:report.profileCoverage,plugin:report.pluginVersion,cordis:report.cordis,schemastery:report.schemastery}))
