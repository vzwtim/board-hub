import {spawn} from 'node:child_process';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const emptyState=mkdtempSync(join(tmpdir(),'boardhub-empty-'));
import assert from 'node:assert/strict';
const child=spawn(process.execPath,['node_modules/wrangler/bin/wrangler.js','dev','--config','dist/server/wrangler.json','--local','--persist-to',emptyState,'--ip','127.0.0.1','--port','8799','--inspector-port','0'],{env:{...process.env,WRANGLER_SEND_METRICS:'false'},stdio:['ignore','pipe','pipe']});
try{
 await new Promise((resolve,reject)=>{let output='';const timer=setTimeout(()=>reject(Error('Local Worker startup timed out')),45000);const collect=b=>{output+=b;if(output.includes('Ready on')){clearTimeout(timer);resolve()}if(output.includes('ERROR')){clearTimeout(timer);reject(Error(output.slice(-1600)))}};child.stdout.on('data',collect);child.stderr.on('data',collect);child.once('exit',code=>{clearTimeout(timer);reject(Error('Worker exited: '+code+' '+output.slice(-1000)))})});
 const base='http://127.0.0.1:8799';
 async function api(path,body,cookie=''){const r=await fetch(base+path,{method:body?'POST':'GET',headers:{...(body?{'Content-Type':'application/json',Origin:base}:{}),...(cookie?{Cookie:cookie}:{})},body:body?JSON.stringify(body):undefined});const v=await r.json();assert.ok(r.ok,JSON.stringify(v));return {v,cookie:(r.headers.get('set-cookie')||'').split(';')[0]||cookie}}
 const owner=await api('/api/projects?scope=mine');assert.ok(owner.v.user.name.startsWith('作家 '));assert.equal(owner.v.user.admin,false);assert.ok(owner.cookie.startsWith('__Host-table-creator='));
 const spec={schema:1,title:'Cloudflare移行の保存確認',description:'ローカル検証',columns:7,rows:6,connect:4,gravity:true,blocked:[],accent:'#0071e3'};
 const project=await api('/api/projects',{spec},owner.cookie);const mine=await api('/api/projects?scope=mine',undefined,owner.cookie);assert.equal(mine.v.projects.length,1);
 const other=await api('/api/projects?scope=mine');assert.equal(other.v.projects.length,0);
 const forged=await fetch(base+'/api/projects?scope=mine',{headers:{Cookie:other.cookie,'oai-authenticated-user-id':project.v.owner,'oai-authenticated-user-email':'admin@example.com'}});assert.equal((await forged.json()).projects.length,0);
 for(const game of ['deckworks','tileworks']){const host=await api('/api/tabletop',{name:'A',game,players:2}),guest=await api('/api/tabletop/'+host.v.id,{type:'join',name:'B'});assert.equal(guest.v.state.phase,'playing');assert.equal(guest.v.state.board.kind,game);assert.deepEqual(guest.v.state.events,[])}
 console.log('PASS: built Worker, D1, creator save/isolation, forged-header rejection and both invite games.');
}finally{await new Promise(resolve=>{child.once('exit',resolve);child.kill('SIGTERM');setTimeout(resolve,3000)});rmSync(emptyState,{recursive:true,force:true})}
