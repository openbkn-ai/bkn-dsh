import assert from 'node:assert/strict'
import {existsSync} from 'node:fs'
import {win32} from 'node:path'
import {spawnSync} from 'node:child_process'

/** Windows bsdtar accepts drive paths; Git GNU tar treats them as remote hosts. Never consult PATH there. */
export function tarExecutable({platform=process.platform,env=process.env,exists=existsSync}={}) {
 if(platform!=='win32')return 'tar'
 assert.ok(env.SystemRoot&&win32.isAbsolute(env.SystemRoot),'Windows SystemRoot must be an absolute path')
 const executable=win32.join(env.SystemRoot,'System32','tar.exe')
 assert.ok(exists(executable),'Windows system tar.exe is missing; do not fall back to Git tar')
 return executable
}
export function runTar(args,options={}) {
 const executable=tarExecutable()
 const result=spawnSync(executable,args,{encoding:'utf8',maxBuffer:32*1024*1024,...options,shell:false})
 if(result.error||result.status!==0)throw new Error(`tar failed (${executable}, status ${result.status}): ${result.stderr??''}`,{cause:result.error})
 return result.stdout
}
