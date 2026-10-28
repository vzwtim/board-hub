import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn,execFileSync,type ChildProcess} from 'node:child_process';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {sourceZip} from '../code-kit/zip.ts';

async function host(root:string){
 const child=spawn(process.execPath,['runtime/server.mjs','.'],{cwd:root,env:{...process.env,PORT:'0'},stdio:['ignore','pipe','pipe']});
 const base=await new Promise<string>((resolve,reject)=>{let log='';const timer=setTimeout(()=>{child.kill();reject(Error('Host startup timeout: '+log))},15000);const collect=(chunk:Buffer)=>{log+=chunk;const match=log.match(/http:\/\/127\.0\.0\.1:\d+/);if(match){clearTimeout(timer);resolve(match[0])}};child.stdout.on('data',collect);child.stderr.on('data',collect);child.once('exit',code=>{clearTimeout(timer);reject(Error('Host exited '+code+': '+log))})});
 return {child,base};
}
async function stop(child:ChildProcess){if(child.exitCode!==null)return;await new Promise<void>(resolve=>{child.once('exit',()=>resolve());child.kill()})}

test('standalone code kit authenticates seats, persists pinned rooms and runs a code-only fork',async()=>{
 const temp=await mkdtemp(join(tmpdir(),'boardhub-kit-')),root=join(temp,'game');let running:Awaited<ReturnType<typeof host>>|undefined;
 try{
  execFileSync(process.execPath,['scripts/export-code-kit.mjs',root],{cwd:resolve('.'),stdio:'pipe'});
  execFileSync(process.execPath,['--test','contract.test.ts'],{cwd:root,stdio:'pipe'});
  running=await host(root);
  async function request(path:string,input?:unknown,token='',extra:Record<string,string>={}){const response=await fetch(running!.base+path,{method:input?'POST':'GET',headers:{...(input?{'Content-Type':'application/json'}:{}),...(token?{Authorization:'Bearer '+token}:{}),...extra},body:input?JSON.stringify(input):undefined});return {status:response.status,value:await response.json() as any}}
  const created=await request('/api/rooms',{players:2});assert.equal(created.status,201);
  const a=created.value,path='/api/rooms/'+a.id;
  assert.deepEqual(a.state.events,[]);assert.ok(Object.values(a.state.board.deck).every(v=>v===0));
  const premature=await request(path,{type:'suggest',id:'premature-1',expectedRevision:a.state.revision},a.token);assert.equal(premature.status,409);
  const guest=await request(path,{type:'join'});assert.equal(guest.value.playerID,'1');const b=guest.value;
  assert.equal((await request(path,{type:'join'})).status,409);
  const spectator=(await request(path)).value;assert.equal(spectator.playerID,null);assert.deepEqual(spectator.state.events,[]);assert.ok(!JSON.stringify(spectator).includes(a.token));
  const actor=a.state.currentPlayer==='0'?a:b,other=actor===a?b:a;
  const command={type:'suggest',id:'first-action',expectedRevision:a.state.revision};
  assert.equal((await request(path,command)).status,401);
  assert.equal((await request(path,command,other.token)).status,403);
  assert.equal((await request(path,command,actor.token,{Origin:'https://other.example'})).status,403);
  const results=await Promise.all([request(path,command,actor.token),request(path,{...command,id:'concurrent-2'},actor.token)]);
  assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);
  const first=results[0].status===200?command:{...command,id:'concurrent-2'};
  const after=(await request(path,undefined,actor.token)).value;
  assert.equal(after.state.revision,a.state.revision+1);
  assert.equal((await request(path,first,actor.token)).value.state.revision,after.state.revision);
  assert.equal((await request(path,{...first,action:{type:'pass'}},actor.token)).status,409);
  await stop(running.child);running=await host(root);
  const restored=(await request(path,undefined,a.token)).value;assert.equal(restored.state.revision,after.state.revision);assert.equal(restored.release,a.release);assert.equal(restored.playerID,'0');
  await stop(running.child);running=undefined;
  // A new action and UI are supplied entirely by the author's game files.
  const adapter=await readFile(join(root,'game.ts'),'utf8');
  await writeFile(join(root,'game.ts'),adapter+`\nconst original=game.definition,parse=game.parseAction;\ngame.definition={...original,id:'isleworks-signal',version:'1.0.0',validate:(b,p,a)=>a.type==='signal'?null:original.validate(b,p,a),reduce:(b,p,a)=>a.type==='signal'?{board:{...b,signal:'船が到着'},nextPlayer:p}:original.reduce(b,p,a)};\ngame.parseAction=input=>input?.type==='signal'?{type:'signal'}:parse(input);\n`);
  await writeFile(join(root,'ui.html'),(await readFile(join(root,'ui.html'),'utf8')).replace('<h2>操作</h2>','<h2>海洋拡張・操作</h2>'));
  running=await host(root);
  assert.equal((await request(path)).status,404,'edited code must not load old-release rooms');
  assert.ok((await (await fetch(running.base)).text()).includes('海洋拡張・操作'));
  const fork=(await request('/api/rooms',{players:2})).value;assert.notEqual(fork.release,a.release);assert.equal(fork.state.gameID,'isleworks-signal');
  const forkGuest=(await request('/api/rooms/'+fork.id,{type:'join'})).value;
  const actorToken=fork.state.currentPlayer==='0'?fork.token:forkGuest.token;
  const extended=await request('/api/rooms/'+fork.id,{type:'move',id:'custom-signal',expectedRevision:fork.state.revision,action:{type:'signal'}},actorToken);
  assert.equal(extended.status,200);assert.equal(extended.value.state.board.signal,'船が到着');
 }finally{if(running)await stop(running.child);await rm(temp,{recursive:true,force:true})}
});

test('source ZIP round-trips UTF-8 files using a standard ZIP reader and rejects traversal',()=>{
 const zip=sourceZip({'説明.md':'ルールと画面','game.ts':'export default {};'});
 const result=execFileSync('python',['-c',"import sys,io,zipfile,json; z=zipfile.ZipFile(io.BytesIO(sys.stdin.buffer.read())); print(json.dumps({n:z.read(n).decode() for n in z.namelist()},ensure_ascii=False))"],{input:zip,encoding:'utf8'});
 assert.deepEqual(JSON.parse(result),{'説明.md':'ルールと画面','game.ts':'export default {};'});
 assert.throws(()=>sourceZip({'../secret':'bad'}));
});
