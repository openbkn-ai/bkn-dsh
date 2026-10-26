const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const [root,destination]=process.argv.slice(2),sha=x=>crypto.createHash('sha256').update(x).digest('hex');fs.mkdirSync(destination,{recursive:false});
const records={};
function copy(rel,name){const data=fs.readFileSync(path.join(root,rel));fs.writeFileSync(path.join(destination,name),data);records[name]={archivePath:rel,sha256:sha(data),bytes:data.length};}
const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8')),old=pkg.version==='0.2.0-rc.2';
for(const [folder,name] of [['dsh-client-connection','connection.js'],['dsh-api-gateway','gateway.js']])copy(`dsh/node_modules/@deepseek-ai/${folder}/lib/${old?'client.js':'client.browser.js'}`,name);
const web='dsh/node_modules/@deepseek-ai/dsh-web-frontend/dist',asset=fs.readdirSync(path.join(root,web,'assets')).find(x=>/^index-.*\.js$/.test(x));copy(web+'/assets/'+asset,'web-boot.js');
copy('lib/main.js','desktop-main.js');copy('lib/preload-app.cjs','desktop-preload.cjs');
const out={version:pkg.version,embeddedNode:process.version,asarSHA256:sha(require('original-fs').readFileSync(root)),records};fs.writeFileSync(path.join(destination,'identity.json'),JSON.stringify(out,null,2)+'\n');console.log(JSON.stringify(out));
