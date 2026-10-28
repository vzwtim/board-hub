// LOCAL DEVELOPMENT ONLY. This process runs code with the current OS user's rights.
import {createServer} from 'node:http';
import {readFileSync,writeFileSync,mkdirSync,readdirSync,renameSync} from 'node:fs';
import {resolve,join,relative} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash,randomBytes,timingSafeEqual} from 'node:crypto';
import {applyAction} from '../engine/core.ts';
import {startGame,projectGame,randomInt} from '../sdk/code-game.ts';

const root=resolve(process.argv[2]||'.');
const manifest=JSON.parse(readFileSync(join(root,'manifest.json'),'utf8'));
if(manifest.schema!==1||manifest.sdkVersion!=='0.1.0'||manifest.entry!=='game.ts'||manifest.ui!=='ui.html')throw Error('Unsupported code kit contract');
const {default:game}=await import(pathToFileURL(join(root,'game.ts')).href);
const ui=readFileSync(join(root,'ui.html'),'utf8');
// All executable source is pinned at startup. Restarting after edits produces a new release.
const hash=createHash('sha256');
function fingerprint(dir){for(const entry of readdirSync(dir,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){if(['.git','.boardhub','node_modules'].includes(entry.name))continue;const p=join(dir,entry.name);if(entry.isDirectory())fingerprint(p);else if(entry.isFile())hash.update(relative(root,p)+'\0').update(readFileSync(p)).update('\0');else throw Error('Symlinks are not supported in code kits')}}
fingerprint(root);const release=hash.digest('hex');
const storage=join(root,'.boardhub',release);mkdirSync(storage,{recursive:true});
const rooms=new Map();
for(const file of readdirSync(storage).filter(x=>/^[a-f0-9-]+\.json$/.test(x))) {const room=JSON.parse(readFileSync(join(storage,file),'utf8'));if(room.release!==release)throw Error('Release mismatch');rooms.set(room.id,room)}
function save(room){const dest=join(storage,room.id+'.json');writeFileSync(dest+'.tmp',JSON.stringify(room),{mode:0o600});renameSync(dest+'.tmp',dest);rooms.set(room.id,room)}
const digest=t=>createHash('sha256').update(t).digest('hex');
function seatFor(room,token){if(!token)return null;const hash=digest(token);return Object.keys(room.credentials).find(p=>timingSafeEqual(Buffer.from(room.credentials[p]),Buffer.from(hash)))??null}
const port=Number(process.env.PORT||8788);
if(!Number.isInteger(port)||port<0||port>65535)throw Error('Invalid PORT');
function fail(message,status=400){throw Object.assign(Error(message),{status})}
async function body(req){let data='';for await(const chunk of req){data+=chunk;if(Buffer.byteLength(data)>32768)fail('Request too large',413)}try{return JSON.parse(data)}catch{fail('Invalid JSON')}}
const server=createServer(async(req,res)=>{
  const send=(value,status=200)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(value))};
  try{
    const expectedHost='127.0.0.1:'+server.address().port;
    if(req.headers.host!==expectedHost&&req.headers.host!=='localhost:'+server.address().port)fail('Invalid Host',403);
    const origin='http://'+req.headers.host;
    if(req.headers.origin&&req.headers.origin!==origin)fail('Cross-origin request rejected',403);
    const url=new URL(req.url,origin);
    if(req.method==='GET'&&url.pathname==='/'){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; frame-ancestors 'none'; object-src 'none'"});res.end(ui);return}
    if(req.method==='GET'&&url.pathname==='/api/release'){send({release,title:manifest.title,gameID:game.definition.id,minPlayers:game.minPlayers,maxPlayers:game.maxPlayers});return}
    if(req.method==='POST'&&!req.headers['content-type']?.startsWith('application/json'))fail('JSON required',415);
    if(req.method==='POST'&&url.pathname==='/api/rooms'){
      const input=await body(req),state=startGame(game,input.players);
      const token=randomBytes(32).toString('hex'),id=crypto.randomUUID();
      const room={id,release,state,credentials:{'0':digest(token)},requests:{}};save(room);
      send({id,token,playerID:'0',release,state:projectGame(game,state,'0')},201);return;
    }
    const match=url.pathname.match(/^\/api\/rooms\/([a-f0-9-]+)$/);if(!match)fail('Not found',404);
    const room=rooms.get(match[1]);if(!room)fail('Room not found in this release',404);
    const token=req.headers.authorization?.replace(/^Bearer /,'')||'';
    if(req.method==='GET'){const playerID=seatFor(room,token);send({id:room.id,release,playerID,state:projectGame(game,room.state,playerID)});return}
    if(req.method!=='POST')fail('Method not allowed',405);
    const input=await body(req);
    if(input.type==='join'){
      const existing=seatFor(room,token);if(existing!==null){send({id:room.id,playerID:existing,release,state:projectGame(game,room.state,existing)});return}
      const seat=Object.keys(room.credentials).length;
      if(seat>=room.state.players.length)fail('Room full',409);
      const secret=randomBytes(32).toString('hex');room.credentials[String(seat)]=digest(secret);save(room);
      send({id:room.id,playerID:String(seat),token:secret,release,state:projectGame(game,room.state,String(seat))});return;
    }
    const playerID=seatFor(room,token);if(playerID===null)fail('Participant token required',401);
    if(Object.keys(room.credentials).length!==room.state.players.length)fail('Wait for all participants',409);
    if(typeof input.id!=='string'||!/^[a-zA-Z0-9-]{8,80}$/.test(input.id)||!Number.isInteger(input.expectedRevision))fail('Invalid command');
    const key=JSON.stringify({playerID,revision:input.expectedRevision,type:input.type,action:input.action??null});
    if(room.requests[input.id]){if(room.requests[input.id]!==key)fail('Action ID reused',409);send({id:room.id,release,playerID,state:projectGame(game,room.state,playerID)});return}
    if(room.state.revision!==input.expectedRevision)fail('Stale revision',409);
    if(room.state.currentPlayer!==playerID)fail('Not your turn',403);
    if(room.state.events.length>=5000)fail('Local preview move limit reached',409);
    let action;
    if(input.type==='suggest'){if(!game.suggest)fail('No suggested action available');action=game.suggest(structuredClone(room.state.board),playerID)}
    else if(input.type==='move')action=game.parseAction(input.action);else fail('Unknown command');
    action=game.resolveAction(structuredClone(room.state.board),playerID,action,randomInt);
    const next=applyAction(game.definition,room.state,{id:input.id,expectedRevision:input.expectedRevision,playerID,payload:action});
    room.state=next;room.requests[input.id]=key;save(room);
    send({id:room.id,release,playerID,state:projectGame(game,next,playerID)});
  }catch(error){send({error:error.message},error.status||400)}
});
server.listen(port,'127.0.0.1',()=>console.log('BoardHub code preview http://127.0.0.1:'+server.address().port+' release '+release));
