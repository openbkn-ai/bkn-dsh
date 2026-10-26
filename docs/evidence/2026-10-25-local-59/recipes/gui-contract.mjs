import assert from 'node:assert/strict'
import {posix,win32} from 'node:path'
export const bases={old:{version:'0.2.0-rc.2',commit:'639ed015397290b3745d163aafe02ffee4aa3f84'},rc3:{version:'0.2.1-rc.3',commit:'1f81c047fc48fa190a683e469daa699857e9afe8'}}
const plugin='46626510825fe9146aef12c27a1724acbb455aeac22aa600358add0fc8e1c9f8'
/** A plan/receipt gate only: no app, launch, signature or filesystem behavior is manufactured by this validator. */
export function validateGuiPlan(x){
 assert(x&&x.schemaVersion===1,'GUI contract schema');const base=bases[x.base];assert(base,'Exact supported base required');assert.equal(x.baseVersion,base.version);assert.equal(x.baseCommit,base.commit);assert.equal(x.pluginSha256,plugin,'Only frozen -32 allowed')
 assert(/^local\.openbkn\.dsh\.backport\.[a-z0-9.]+$/.test(x.appId),'Independent local appId required');assert(/^OpenBKN DSH Backport /.test(x.productName),'Distinct product name required');assert.equal(x.globalProtocolRegistration,false);assert.equal(x.globalCliInstall,false);assert.equal(x.openInspectors,false)
 assert.equal(x.updateMode,'manual-isolated-development','Local development may not inherit upstream OTA/policy; signed distribution needs a separate reviewed update contract');assert.equal(x.signedRelease,false);assert.equal(x.formalAcceptanceEligible,false);assert.equal(x.ciRun,null)
 const path=x.platform==='win32'?win32:posix;assert(['win32','darwin'].includes(x.platform));assert(Array.isArray(x.protectedPaths)&&x.protectedPaths.length>0,'Protected source paths required')
 const key=p=>{assert(path.isAbsolute(p),'Absolute paths required');const absolute=path.resolve(p);return x.platform==='win32'?absolute.toLowerCase():absolute};const inside=(a,b)=>a===b||a.startsWith(b+path.sep)
 const root=key(x.taskRoot),protectedPaths=x.protectedPaths.map(key);assert(protectedPaths.every(p=>!inside(root,p)&&!inside(p,root)),'Task/source roots overlap')
 const fields=['dshHome','cliConfig','userData','sessionData','logs','journals'];const paths=fields.map(k=>key(x.paths[k]));for(const p of paths){assert(inside(p,root)&&p!==root,'Data stays below explicit task root');assert(protectedPaths.every(q=>!inside(p,q)&&!inside(q,p)),'Data overlaps protected source')}
 for(let i=0;i<paths.length;i++)for(let j=i+1;j<paths.length;j++)assert(!inside(paths[i],paths[j])&&!inside(paths[j],paths[i]),'Mutable data roots must be disjoint')
 return {planValid:true,artifactValidated:false,guiAcceptance:false,signingAccepted:false}
}
export function requireGuiArtifact(receipt){
 assert(receipt&&receipt.status==='BUILT','GUI artifact has not been built');assert(typeof receipt.path==='string'&&/^[a-f0-9]{64}$/.test(receipt.sha256),'Fixed GUI path/hash required');assert.equal(receipt.actualBaseVersion,receipt.expectedBaseVersion,'Actual GUI version mismatch');assert.equal(receipt.independenceVerified,true);assert.equal(receipt.asarPayloadVerified,true);assert.equal(receipt.signatureVerified,true,'GUI signature/notarization proof required');return {ready:true,formalAcceptanceEligible:false}
}
