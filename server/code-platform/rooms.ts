import {randomBytes,timingSafeEqual} from 'node:crypto';
import {RuleError} from '../../engine/types.ts';
import {digest,type CodeRelease,type CodeStore} from './model.ts';
import {checkState} from './releases.ts';
import {sandboxCall,type SandboxLoader} from './compiler.ts';
export interface CodeRoom {id:string;project:string;release:string;state:any;revision:number;credentials:Record<string,{hash:string;owner:string}>;requests:Record<string,string>}
export interface CodeRoomStore {get(id:string):Promise<CodeRoom|null>;create(r:CodeRoom):Promise<void>;replace(r:CodeRoom,revision:number):Promise<boolean>}
function seat(room:CodeRoom,token:string,owner:string){if(!token)return null;const hash=Buffer.from(digest(token));return Object.keys(room.credentials).find(p=>room.credentials[p].owner===owner&&timingSafeEqual(Buffer.from(room.credentials[p].hash),hash))??null}
async function releaseFor(store:CodeStore,project:string,id:string){const r=await store.getRelease(project,id);if(!r||r.status!=='ready')throw new RuleError('NOT_FOUND','試遊できる版が見つかりません');return r}
async function view(loader:SandboxLoader|undefined,release:CodeRelease,room:CodeRoom,player:string|null){const {view}=await sandboxCall(loader,release,{type:'view',state:room.state,player});return {id:room.id,project:room.project,release:room.release,playerID:player,state:{...room.state,board:view,events:[]},joined:Object.keys(room.credentials).length}}
export async function createCodeRoom(store:CodeStore,rooms:CodeRoomStore,loader:SandboxLoader|undefined,project:string,id:string,owner:string,players:unknown){if(!Number.isInteger(players)||Number(players)<2||Number(players)>4)throw new RuleError('INPUT','2〜4人で作成してください');const release=await releaseFor(store,project,id);const {state}=await sandboxCall(loader,release,{type:'start',players});checkState(state,undefined,Number(players));const secret=randomBytes(32).toString('hex'),room:CodeRoom={id:crypto.randomUUID(),project,release:id,state,revision:1,credentials:{'0':{hash:digest(secret),owner}},requests:{}};await rooms.create(room);return {...await view(loader,release,room,'0'),token:secret}}
export async function getCodeRoom(store:CodeStore,rooms:CodeRoomStore,loader:SandboxLoader|undefined,id:string,releaseID:string,token:string,owner:string){const room=await rooms.get(id);if(!room||room.release!==releaseID)throw new RuleError('NOT_FOUND','この版のルームが見つかりません');const release=await releaseFor(store,room.project,room.release);return view(loader,release,room,seat(room,token,owner))}
export async function actCodeRoom(store:CodeStore,rooms:CodeRoomStore,loader:SandboxLoader|undefined,id:string,releaseID:string,owner:string,token:string,c:any){const room=await rooms.get(id);if(!room||room.release!==releaseID)throw new RuleError('NOT_FOUND','この版のルームが見つかりません');const release=await releaseFor(store,room.project,room.release),player=seat(room,token,owner),revision=room.revision;
 if(c.type==='join'){
  if(player!==null)return view(loader,release,room,player);
  const count=Object.keys(room.credentials).length;if(count>=room.state.players.length)throw new RuleError('ROOM_FULL','満席です');const secret=randomBytes(32).toString('hex');room.credentials[String(count)]={hash:digest(secret),owner};
  // Storage revision is separate: joining must not alter deterministic game history.
  room.revision++;if(!await rooms.replace(room,revision))throw new RuleError('CONFLICT','参加状況が変わりました。もう一度参加してください');return {...await view(loader,release,room,String(count)),token:secret};
 }
 if(player===null)throw new RuleError('UNAUTHORIZED','参加者としての認証が必要です');
 if(!c||!['move','suggest'].includes(c.type)||typeof c.id!=='string'||!/^[A-Za-z0-9-]{8,80}$/.test(c.id)||!Number.isInteger(c.expectedRevision))throw new RuleError('INPUT','操作を確認してください');
 const fingerprint=digest(JSON.stringify({player,revision:c.expectedRevision,type:c.type,action:c.action??null}));
 if(room.requests[c.id]){if(room.requests[c.id]!==fingerprint)throw new RuleError('ACTION_ID_REUSED','操作IDが重複しています');return view(loader,release,room,player)}
 if(Object.keys(room.credentials).length!==room.state.players.length)throw new RuleError('STATE','全員の参加を待っています');
 if(c.expectedRevision!==room.state.revision)throw new RuleError('STALE_STATE','盤面が更新されています');if(room.state.currentPlayer!==player||room.state.phase!=='playing')throw new RuleError('STATE','いまは自分の手番ではありません');if(room.state.events.length>=1000)throw new RuleError('LIMIT','試遊の手数上限に達しました');
 const {state}=await sandboxCall(loader,release,{type:'move',state:room.state,player,id:c.id,action:c.action,suggest:c.type==='suggest'});checkState(state,room.state);room.state=state;room.revision++;room.requests[c.id]=fingerprint;
 if(JSON.stringify(room).length>800000)throw new RuleError('LIMIT','試遊の保存上限に達しました');if(!await rooms.replace(room,revision))throw new RuleError('STALE_STATE','盤面が更新されています');return view(loader,release,room,player);
}
