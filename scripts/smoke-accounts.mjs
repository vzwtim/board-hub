import {spawn,spawnSync} from 'node:child_process';
import {writeFileSync,mkdirSync} from 'node:fs';
import {randomBytes,createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const cli='node_modules/wrangler/bin/wrangler.js',hash=x=>createHash('sha256').update(x).digest('hex'),tokens=[0,1,2].map(()=>randomBytes(32).toString('base64url')),now=Date.now();mkdirSync('.wrangler',{recursive:true});
const sql=[...['smoke-account-a','smoke-account-b'].map((id,i)=>`INSERT OR REPLACE INTO boardhub_accounts(id,google_sub,email,name,avatar,created_at,updated_at) VALUES('${id}','${id}','smoke${i}@example.test','Smoke ${i}','',${now},${now});`),...tokens.map((t,i)=>`INSERT OR REPLACE INTO boardhub_sessions(token_hash,account_id,expires_at) VALUES('${hash(t)}','smoke-account-${i===1?'b':'a'}',${i===2?now-100:now+300000});`)];writeFileSync('.wrangler/smoke-account-seed.sql',sql.join('\n'));
for(const args of [['d1','migrations','apply','DB','--local','--config','wrangler.json'],['d1','execute','DB','--local','--config','wrangler.json','--file','.wrangler/smoke-account-seed.sql']]){const r=spawnSync(process.execPath,[cli,...args],{encoding:'utf8',env:{...process.env,WRANGLER_SEND_METRICS:'false'}});if(r.status!==0)throw Error(r.stderr||r.stdout)}
const child=spawn(process.execPath,[cli,'dev','--config','dist/server/wrangler.json','--local','--persist-to','.wrangler/state','--ip','127.0.0.1','--port','8798','--inspector-port','0','--var','GOOGLE_CLIENT_ID:smoke.apps.googleusercontent.com','--var','GOOGLE_CLIENT_SECRET:local-test-only'],{env:{...process.env,WRANGLER_SEND_METRICS:'false'},stdio:['ignore','pipe','pipe']});
try{await new Promise((resolve,reject)=>{let output='';const timer=setTimeout(()=>reject(Error('Worker startup timed out')),45000);const data=b=>{output+=b;if(output.includes('Ready on')){clearTimeout(timer);resolve()}if(output.includes('ERROR')){clearTimeout(timer);reject(Error(output.slice(-2000)))}};child.stdout.on('data',data);child.stderr.on('data',data);child.once('exit',n=>{clearTimeout(timer);reject(Error('Worker exited '+n+' '+output.slice(-1000)))})});
 const base='http://127.0.0.1:8798',cookie=i=>'__Host-boardhub-session='+tokens[i];
 async function api(path,data,session='',status=200){const r=await fetch(base+path,{method:data?'POST':'GET',headers:{Cookie:session,...(data?{'Content-Type':'application/json',Origin:base}:{})},body:data?JSON.stringify(data):undefined});const v=await r.json();assert.equal(r.status,status,JSON.stringify(v));return {r,v}}
 assert.equal((await api('/api/auth/session')).v.user,null);assert.equal((await api('/api/auth/session',undefined,cookie(2))).v.user,null);const me=(await api('/api/auth/session',undefined,cookie(0))).v;assert.equal(me.user.id,'smoke-account-a');assert.equal(me.googleAvailable,true);
 await api('/api/favorites',{id:'deckworks',saved:true},'',401);await api('/api/favorites',{id:'deckworks',saved:true},cookie(0));assert.ok((await api('/api/favorites',undefined,cookie(0))).v.favorites.includes('deckworks'));assert.ok(!(await api('/api/favorites',undefined,cookie(1))).v.favorites.includes('deckworks'));
 await api('/api/account/profile',{name:'New Display Name'},cookie(0));assert.equal((await api('/api/auth/session',undefined,cookie(0))).v.user.name,'New Display Name');await api('/api/account/profile',{name:''},cookie(0),400);
 const photo='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aD1sAAAAASUVORK5CYII=';await api('/api/account/profile',{avatar:photo},cookie(0));assert.equal((await api('/api/auth/session',undefined,cookie(0))).v.user.avatar,photo);assert.equal((await api('/api/auth/session',undefined,cookie(0))).v.user.name,'New Display Name');assert.equal((await api('/api/auth/session',undefined,cookie(1))).v.user.avatar,'');await api('/api/account/profile',{avatar:'https://example.test/a.svg'},cookie(0),400);await api('/api/account/profile',{avatar:''},cookie(0));assert.equal((await api('/api/auth/session',undefined,cookie(0))).v.user.avatar,'');
 const spec={schema:1,title:'Account smoke project',description:'Local only',columns:3,rows:3,connect:3,gravity:false,blocked:[],accent:'#0071e3'},project=(await api('/api/projects',{spec},cookie(0),201)).v;assert.equal(project.owner,'smoke-account-a');await api('/api/projects/'+project.id,{type:'publish',listed:true,expectedRevision:project.revision},cookie(1),401);await api('/api/favorites',{id:'project:'+project.id,saved:true},cookie(1),404);assert.equal((await api('/api/favorites/projects',{ids:[project.id]},cookie(1))).v.projects.length,0);assert.equal((await api('/api/favorites/projects',{ids:[project.id]},cookie(0))).v.projects.length,1);
 const flow=await fetch(base+'/api/auth/google?next=%2Fstudio',{redirect:'manual'}),target=new URL(flow.headers.get('location'));assert.equal(target.origin,'https://accounts.google.com');assert.equal(target.searchParams.get('code_challenge_method'),'S256');const state=target.searchParams.get('state'),flowCookie=flow.headers.get('set-cookie').split(';')[0];const denied=await fetch(base+'/api/auth/google/callback?state='+state+'&error=access_denied',{redirect:'manual',headers:{Cookie:flowCookie}});assert.ok(denied.headers.get('location').endsWith('?auth=cancelled'));const replay=await fetch(base+'/api/auth/google/callback?state='+state+'&error=access_denied',{redirect:'manual',headers:{Cookie:flowCookie}});assert.ok(replay.headers.get('location').endsWith('?auth=expired'));

 // Invitations deliberately have no participant until account/guest choice. Guest headers override a signed-in cookie.
 async function roomApi(path,data,headers={},status=200){const r=await fetch(base+path,{method:data?'POST':'GET',headers:{...headers,...(data?{'Content-Type':'application/json',Origin:base}:{})},body:data?JSON.stringify(data):undefined});const v=await r.json();assert.equal(r.status,status,JSON.stringify(v));assert.ok(!('credentials' in v)&&!('identities' in v));return v}
 const a={Cookie:cookie(0),'X-BoardHub-Account':'smoke-account-a'},b={Cookie:cookie(1),'X-BoardHub-Account':'smoke-account-b'},g1={'X-BoardHub-Guest':crypto.randomUUID()},g2={'X-BoardHub-Guest':crypto.randomUUID()};
 const host=await roomApi('/api/duels',{name:'ignored',game:'connect4'},a,201),path='/api/duels/'+host.id;
 assert.equal(host.playerID,'0');assert.equal(host.state.players[0].name,'New Display Name');
 assert.equal((await roomApi(path,undefined,{...a,'X-BoardHub-View':'invite'})).playerID,null);
 assert.equal((await roomApi(path,undefined,b)).playerID,null);
 assert.equal((await roomApi(path,{type:'join',name:'ignored'},a)).state.players.length,1);
 const friend=await roomApi(path,{type:'join',name:'Bob'},b);assert.equal(friend.playerID,'1');assert.equal(friend.state.phase,'playing');
 assert.equal((await roomApi(path,undefined,a)).playerID,'0');assert.equal((await roomApi(path,undefined,b)).playerID,'1');
 const moveA=await roomApi(path,{type:'act',id:'smoke-identity-a',expectedRevision:friend.state.revision,action:{type:'play',index:0}},a);
 const moveB=await roomApi(path,{type:'act',id:'smoke-identity-b',expectedRevision:moveA.state.revision,action:{type:'play',index:1}},b);assert.equal(moveB.state.currentPlayer,'0');
 await roomApi(path,undefined,{'X-BoardHub-Account':'smoke-account-a'},401);
 assert.equal((await roomApi(path,undefined,{...b,Authorization:'Bearer '+host.token})).playerID,'1');
 const guestHost=await roomApi('/api/duels',{name:'Host guest',game:'connect4'},g1,201),gp='/api/duels/'+guestHost.id;
 const guestFriend=await roomApi(gp,{type:'join',name:'Friend guest'},{...a,...g2});assert.equal(guestFriend.playerID,'1');assert.equal(guestFriend.state.players[1].name,'Friend guest');
 const ga={...g1,Authorization:'Bearer '+guestHost.token},gb={...g2,Authorization:'Bearer '+guestFriend.token};
 assert.equal((await roomApi(gp,undefined,ga)).playerID,'0');assert.equal((await roomApi(gp,undefined,gb)).playerID,'1');
 assert.equal((await roomApi(gp,undefined,{...g2,Authorization:'Bearer '+guestHost.token})).playerID,null);
 await roomApi(gp,{type:'act',id:'smoke-guest-forged',expectedRevision:guestFriend.state.revision,action:{type:'play',index:0}},{...g2,Authorization:'Bearer '+guestHost.token},401);
 const guestMove=await roomApi(gp,{type:'act',id:'smoke-guest-a',expectedRevision:guestFriend.state.revision,action:{type:'play',index:0}},ga);
 await roomApi(gp,{type:'act',id:'smoke-guest-b',expectedRevision:guestMove.state.revision,action:{type:'play',index:1}},gb);
 // Every supported invitation service binds both seats, including private-hand projections.
 await api('/api/projects/'+project.id,{type:'publish',listed:true,expectedRevision:project.revision},cookie(0));
 for(const [endpoint,config] of [['rooms',{}],['frontier',{players:2}],['tabletop',{game:'deckworks',players:2}],['tabletop',{game:'tileworks',players:2}],['community-rooms',{project:project.id,ref:''}],['isles',{}]]){
  const h=await roomApi('/api/'+endpoint,{name:'Host',...config},a,201),p='/api/'+endpoint+'/'+h.id;
  assert.equal((await roomApi(p,undefined,a)).playerID,'0',endpoint+' account restore');
  const j=await roomApi(p,{type:'join',name:'Friend'},g2);assert.equal(j.playerID,'1',endpoint+' guest join');assert.equal(j.state.phase,'playing');
  assert.equal((await roomApi(p,undefined,{...g2,Authorization:'Bearer '+j.token})).playerID,'1',endpoint+' guest restore');
 }
 const four=await roomApi('/api/frontier',{name:'Host',players:4},g1,201);let full;
 for(let n=1;n<4;n++)full=await roomApi('/api/frontier/'+four.id,{type:'join',name:'Friend '+n},{'X-BoardHub-Guest':crypto.randomUUID()});
 assert.equal(full.state.players.length,4);assert.equal(full.state.phase,'playing');

 // Finish a live match, retain the party across a different game and a rematch.
 let ending=moveB;while(ending.state.phase==='playing'){const turn=ending.state.currentPlayer;ending=await roomApi(path,{type:'act',id:crypto.randomUUID(),expectedRevision:ending.state.revision,action:{type:'play',index:turn==='0'?0:1}},turn==='0'?a:b)}
 const successor=(await roomApi('/api/rooms/'+host.id+'/next',{game:'kalah'},a)).nextGame;
 assert.equal((await roomApi(path,undefined,b)).nextGame.id,successor.id);
 const continuedA=await roomApi(successor.api+'/'+successor.id,undefined,a),continuedB=await roomApi(successor.api+'/'+successor.id,undefined,b);assert.equal(continuedA.playerID,'0');assert.equal(continuedB.playerID,'1');assert.equal(continuedA.state.gameID,'kalah');assert.deepEqual(continuedA.state.players.map(p=>p.name),ending.state.players.map(p=>p.name));
 assert.equal((await roomApi('/api/rooms/'+host.id+'/next',{game:'reversi'},b)).nextGame.id,successor.id);
 await roomApi('/api/rooms/'+successor.id+'/next',{game:'same'},a,400);
 const nextMoved=await roomApi(successor.api+'/'+successor.id,{type:'move',id:crypto.randomUUID(),expectedRevision:continuedA.state.revision,pit:0},a);assert.equal(nextMoved.state.currentPlayer,'1');
 await roomApi(successor.api+'/'+successor.id,{type:'move',id:crypto.randomUUID(),expectedRevision:nextMoved.state.revision,pit:7},b);
 let guestEnding=await roomApi(gp,undefined,ga);while(guestEnding.state.phase==='playing'){const turn=guestEnding.state.currentPlayer;guestEnding=await roomApi(gp,{type:'act',id:crypto.randomUUID(),expectedRevision:guestEnding.state.revision,action:{type:'play',index:turn==='0'?0:1}},turn==='0'?ga:gb)}
 await roomApi('/api/rooms/'+guestHost.id+'/next',{game:'same'},{},401);
 const rematch=(await roomApi('/api/rooms/'+guestHost.id+'/next',{game:'same'},ga)).nextGame;assert.equal((await roomApi(rematch.api+'/'+rematch.id,undefined,ga)).playerID,'0');assert.equal((await roomApi(rematch.api+'/'+rematch.id,undefined,gb)).playerID,'1');
 const manifest=await (await fetch(base+'/manifest.webmanifest')).json();assert.equal(manifest.display,'standalone');for(const icon of manifest.icons){const png=await fetch(base+icon.src);assert.equal(png.status,200);assert.equal(new Uint8Array(await png.arrayBuffer())[0],137)}
 console.log('PASS: finished-match successor, idempotent party transition, account and guest seat transfer, cross-game turns, rematch, install manifest and PNG assets.');
 console.log('PASS: account and guest invitations, isolated seats, idempotent rejoin, two-player turns, reload recovery, private credential filtering and all multiplayer services (2–4 players).');
 await api('/api/auth/logout',{},cookie(0));assert.equal((await api('/api/auth/session',undefined,cookie(0))).v.user,null);console.log('PASS: account sessions, expiry/logout, favorites isolation, project access, display name, OAuth PKCE/state/cancellation/replay.');
}finally{child.kill('SIGTERM')}
