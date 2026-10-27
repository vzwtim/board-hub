import {applyAction,createState,joinState} from '../engine/core.ts';
import {RuleError,type GameDefinition,type GameState,type Player} from '../engine/types.ts';
import {kalah} from '../games/kalah/index.ts';
import {duels,type Kind as DuelKind} from '../games/duels/index.ts';
import {frontier,chanceAction,secureInt,type Seat} from '../games/frontier/index.ts';
import {tabletop,type Kind as TableKind} from '../games/tabletop/index.ts';
import {community,type Spec} from '../games/community/index.ts';
import {nextGameOptions,type NextGame} from '../lib/next-game.ts';
import {playerFor,type Room,type RoomStore} from './service.ts';
import type {RoomIdentity} from './room-identity.ts';
type AnyRoom=Room<unknown,unknown,Seat>;
function ready<G,A>(game:GameDefinition<G,A,Seat>,players:Player<Seat>[]):GameState<G,A,Seat>{let state=createState(game,players[0]);for(const player of players.slice(1))state=joinState(state,player,players.length);return state}
export function prepareNextGame(source:AnyRoom,choice:unknown):{room:AnyRoom;next:NextGame}{
 const board=source.state.board as {kind?:string;spec?:Spec};const same=source.state.gameID==='duels'||source.state.gameID==='tabletop'?board.kind:source.state.gameID==='isleworks'?'frontier':source.state.gameID;
 const target=choice==='same'?same:choice,option=nextGameOptions.find(x=>x.id===target),custom=choice==='same'&&same===community.id;
 if(!option&&!custom)throw new RuleError('GAME','次に遊ぶゲームを選んでください');
 const players=structuredClone(source.state.players),count=players.length;if(count<2||count>(option?.max||2))throw new RuleError('PLAYERS','この人数では選べないゲームです');
 let state:GameState<unknown,unknown,Seat>,api:string,href:string,title=option?.title||board.spec?.title||'みんなの作品';
 if(target==='kalah'){state=ready(kalah,players as Player<'0'|'1'>[]);api='/api/rooms';href='/kalah'}
 else if(target==='connect4'||target==='reversi'){let s=ready(duels,players as Player<'0'|'1'>[]);s=applyAction(duels,s,{id:'next-configure',expectedRevision:s.revision,playerID:'0',payload:{type:'configure',game:target as DuelKind}});state=s;api='/api/duels';href='/duels?game='+target}
 else if(target==='frontier'){let s=ready(frontier,players);s=applyAction(frontier,s,{id:'next-configure',expectedRevision:s.revision,playerID:'0',payload:chanceAction(s.board,'0',{type:'configure',seed:1,players:count},secureInt)});state=s;api='/api/frontier';href='/frontier'}
 else if(target==='deckworks'||target==='tileworks'){let s=ready(tabletop,players);s=applyAction(tabletop,s,{id:'next-configure',expectedRevision:s.revision,playerID:'0',payload:{type:'configure',game:target as TableKind,count,seed:secureInt(2147483647)}});state=s;api='/api/tabletop';href='/tabletop?game='+target}
 else if(custom&&board.spec){let s=ready(community,players as Player<'0'|'1'>[]);s=applyAction(community,s,{id:'next-configure',expectedRevision:s.revision,playerID:'0',payload:{type:'configure',spec:board.spec}});state=s;api='/api/community-rooms';href='/play/room'}
 else throw new RuleError('GAME','このゲームは再戦に対応していません');
 const id=crypto.randomUUID(),now=Date.now(),room:AnyRoom={id,state,credentials:structuredClone(source.credentials),identities:structuredClone(source.identities||{}),createdAt:now,updatedAt:now};
 return {room,next:{id,api,href:href+(href.includes('?')?'&':'?')+'room='+id,title,game:String(target)}};
}
export async function nextGame(store:RoomStore<unknown,unknown,Seat>,id:string,token:string,identity:RoomIdentity|undefined,choice:unknown){
 const source=await store.get(id);if(!source)throw new RuleError('NOT_FOUND','対戦ルームが見つかりません');if(await playerFor(source,token,identity)===null)throw new RuleError('UNAUTHORIZED','この対戦の参加者だけが次のゲームを選べます');if(source.state.phase!=='finished')throw new RuleError('PHASE','対戦終了後に次のゲームを選べます');if(source.nextGame)return source.nextGame;
 const prepared=prepareNextGame(source,choice);await store.create(prepared.room);const revision=source.state.revision;source.nextGame=prepared.next;source.state={...source.state,revision:revision+1};source.updatedAt=Date.now();if(!await store.replace(source,revision)){const latest=await store.get(id);if(latest?.nextGame)return latest.nextGame;throw new RuleError('CONFLICT','次のゲームの準備中です。もう一度お試しください')}
 return prepared.next;
}
