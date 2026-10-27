import {RuleError} from '../engine/types.ts';
export type RoomIdentity={kind:'account'|'guest';id:string};
export type IdentifiedRoom={credentials:Record<string,string>;identities?:Record<string,RoomIdentity>};
export function accountSeat(room:IdentifiedRoom,identity?:RoomIdentity){if(identity?.kind!=='account')return null;return Object.entries(room.identities||{}).find(([,owner])=>owner.kind==='account'&&owner.id===identity.id)?.[0]??null}
export function bindSeat(room:IdentifiedRoom,seat:string,identity?:RoomIdentity){if(!identity)return;room.identities={...room.identities,[seat]:{kind:identity.kind,id:identity.id}}}
export function assertNewGuest(room:IdentifiedRoom,identity?:RoomIdentity){if(identity?.kind==='guest'&&Object.values(room.identities||{}).some(x=>x.kind==='guest'&&x.id===identity.id))throw new RuleError('ALREADY_JOINED','このゲストは参加済みです。元のタブから再開してください。')}
export function encodeCredentials(room:IdentifiedRoom){return JSON.stringify({version:2,credentials:room.credentials,identities:room.identities||{}})}
export function decodeCredentials(value:string):IdentifiedRoom{const data=JSON.parse(value);return data.version===2&&data.credentials?{credentials:data.credentials,identities:data.identities||{}}:{credentials:data}}
