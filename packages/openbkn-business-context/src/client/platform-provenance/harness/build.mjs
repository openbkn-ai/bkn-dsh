import { build } from 'tsdown'
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
const directory=path.dirname(fileURLToPath(import.meta.url))
const packageRoot=path.resolve(directory,'../../../..')
const output=path.join(packageRoot,'../../release/provenance-parity-harness')
await mkdir(output,{recursive:true})
await build({config:false,logLevel:'warn',entry:{harness:path.join(directory,'main.tsx')},outDir:output,platform:'browser',format:['esm'],clean:true,dts:false,minify:true,deps:{alwaysBundle:[/.*/],onlyBundle:false},define:{'process.env.NODE_ENV':'"production"'},outputOptions:{entryFileNames:'harness.js'}})
await writeFile(path.join(output,'index.html'),'<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Controlled platform provenance parity harness</title><body style="margin:0"><div id="root"></div><script type="module" src="./harness.js"></script></body></html>')
process.stdout.write(`Controlled harness: ${output}\nServe: python3 -m http.server 43121 --bind 127.0.0.1 --directory ${JSON.stringify(output)}\n`)
