import {readdirSync,lstatSync,statSync,realpathSync,readFileSync,writeFileSync,mkdirSync,symlinkSync,existsSync,chmodSync} from 'node:fs'
import {resolve,join,relative,dirname,isAbsolute} from 'node:path'
import {createHash} from 'node:crypto'
const source=resolve(process.argv[2]),dest=resolve(process.argv[3]);if(existsSync(dest))throw new Error('Retain the existing extraction; select a new destination')
const sha=file=>createHash('sha256').update(readFileSync(file)).digest('hex'),files={};let links=0
function copy(src,out){const st=lstatSync(src);if(st.isSymbolicLink()){const actual=realpathSync(src),rel=relative(source,actual);if(rel.startsWith('..')||isAbsolute(rel))throw new Error('Archive symlink escapes runtime');mkdirSync(dirname(out),{recursive:true});symlinkSync(relative(dirname(out),join(dest,rel)),out);links++;return}if(st.isDirectory()){mkdirSync(out,{recursive:true});for(const n of readdirSync(src))copy(join(src,n),join(out,n));return}mkdirSync(dirname(out),{recursive:true});writeFileSync(out,readFileSync(src));chmodSync(out,st.mode&0o777);files[relative(dest,out)]=sha(out)}
copy(source,dest);writeFileSync(dest+'-stock-files-private.json',JSON.stringify(files,null,2)+'\n');console.log(JSON.stringify({files:Object.keys(files).length,links,mcpEntrySha256:sha(join(dest,'node_modules/@deepseek-ai/dsh-mcp-client/lib/index.js'))}))
