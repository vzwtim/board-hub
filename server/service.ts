import type {NextGame} from '../lib/next-game.ts';
import {accountSeat,bindSeat,assertNewGuest,type RoomIdentity} from './room-identity.ts';
import { applyAction, createState, joinState } from '../engine/core.ts';
import { RuleError, type GameState, type MoveAction, type PlayerID } from '../engine/types.ts';
import { kalah, type KalahBoard } from '../games/kalah/index.ts';
export type State=GameState<KalahBoard,MoveAction>;
export interface Room<G=KalahBoard,A=MoveAction,P extends string=PlayerID> {id:string;state:GameState<G,A,P>;credentials:Record<string,string>;identities?:Record<string,RoomIdentity>;createdAt:number;updatedAt:number;nextGame?:NextGame}
export interface RoomStore<G=KalahBoard,A=MoveAction,P extends string=PlayerID> {get(id:string):Promise<Room<G,A,P>|null>;create(room:Room<G,A,P>):Promise<void>;replace(room:Room<G,A,P>,expectedRevision:number):Promise<boolean>}
export const newToken=()=>crypto.randomUUID()+crypto.randomUUID();
export async function hashToken(token:string){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token));return Array.from(new Uint8Array(b),x=>x.toString(16).padStart(2,'0')).join('')}
export function cleanName(name:unknown){if(typeof name!=='string'||name.trim().length<1||name.trim().length>24)throw new RuleError('NAME','名前を1〜24文字で入力してください');return name.trim()}
export async function createRoom(store:RoomStore,name:unknown,avatar='',identity?:RoomIdentity){const token=newToken(),now=Date.now();const room:Room={id:crypto.randomUUID(),state:createState(kalah,{id:'0',name:cleanName(name),...(avatar?{avatar}:{})}),credentials:{'0':await hashToken(token)},createdAt:now,updatedAt:now};bindSeat(room,'0',identity);await store.create(room);return {room,token,playerID:'0' as PlayerID}}
export async function joinRoom<G,A,P>(store:RoomStore<G,A>,id:string,name:unknown,avatar='',identity?:RoomIdentity){const room=await store.get(id);if(!room)throw new RuleError('NOT_FOUND','部屋が見つかりません');if(accountSeat(room,identity)!==null)return {room,token:'',playerID:accountSeat(room,identity) as PlayerID};assertNewGuest(room,identity);const prev=room.state.revision,token=newToken();room.state=joinState(room.state,{id:'1',name:cleanName(name),...(avatar?{avatar}:{})});room.credentials['1']=await hashToken(token);bindSeat(room,'1',identity);room.updatedAt=Date.now();if(!await store.replace(room,prev))throw new RuleError('CONFLICT','参加状況が変わりました。部屋を再読み込みしてください');return {room,token,playerID:'1' as PlayerID}}
export async function playerFor<P extends string=PlayerID>(room:{credentials:Record<string,string>;identities?:Record<string,RoomIdentity>},token:string,identity?:RoomIdentity){const owned=accountSeat(room,identity);if(owned!==null)return owned as P;if(!token)return null;const hash=await hashToken(token),seat=Object.entries(room.credentials).find(([,v])=>v===hash)?.[0];if(!seat)return null;const owner=room.identities?.[seat];if(owner&&(!identity||owner.kind!==identity.kind||owner.id!==identity.id))return null;return seat as P}
export async function moveRoom(store:RoomStore,id:string,token:string,command:unknown,identity?:RoomIdentity){const room=await store.get(id);if(!room)throw new RuleError('NOT_FOUND','部屋が見つかりません');const playerID=await playerFor(room,token,identity);if(!playerID)throw new RuleError('UNAUTHORIZED','参加者としての認証が必要です');
 const c=command as {id?:unknown;expectedRevision?:unknown;pit?:unknown};if(!c||typeof c.id!=='string'||!/^[a-zA-Z0-9-]{8,80}$/.test(c.id)||!Number.isInteger(c.expectedRevision)||!Number.isInteger(c.pit))throw new RuleError('BAD_ACTION','操作データが不正です');
 const prev=room.state.revision;room.state=applyAction(kalah,room.state,{id:c.id,expectedRevision:c.expectedRevision as number,playerID,payload:{type:'move',pit:c.pit as number}});
 if(room.state.revision===prev)return room;
 if(room.state.events.length>5000)throw new RuleError('LIMIT','この試験用の部屋の手数上限です');
 room.updatedAt=Date.now();if(!await store.replace(room,prev))throw new RuleError('STALE_STATE','別の操作が先に保存されました。更新して選び直してください');return room;
}
