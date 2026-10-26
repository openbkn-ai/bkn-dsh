import assert from 'node:assert/strict'
import test from 'node:test'
import {tarExecutable} from '../scripts/portable-tar.mjs'
test('Windows drive paths use system bsdtar even when Git tar is first on PATH',()=>{
 assert.equal(tarExecutable({platform:'win32',env:{SystemRoot:'C:\\Windows',PATH:'C:\\Program Files\\Git\\usr\\bin'},exists:path=>path==='C:\\Windows\\System32\\tar.exe'}),'C:\\Windows\\System32\\tar.exe')
 assert.throws(()=>tarExecutable({platform:'win32',env:{SystemRoot:'C:\\Windows'},exists:()=>false}),/do not fall back/)
 assert.throws(()=>tarExecutable({platform:'win32',env:{}}),/SystemRoot/)
 assert.equal(tarExecutable({platform:'darwin'}),'tar')
})
