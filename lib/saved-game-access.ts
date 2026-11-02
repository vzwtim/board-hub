import type {SavedGame} from './resume.ts';
import {RoomSeatStorage} from './room-seat-storage.ts';
export function savedGameAccess(save:SavedGame,accountId?:string,tab:Storage|null=null):'ready'|'guest-tab'|'account'|'unknown'{
 if(!save.online)return 'ready';
 if(!save.room)return 'unknown';
 if(new RoomSeatStorage(tab,null).hasGuestSeat(save.room.api,save.id.slice(5)))return 'ready';
 if(accountId&&(save.room.accountId===accountId||save.room.accounts?.includes(accountId)))return 'ready';
 return save.room.participation==='account'?'account':'guest-tab';
}
export function savedGameMatches(save:SavedGame,gameId:string,href:string){
 if(save.id===gameId||save.gameId===gameId)return true;
 if(!save.online)return false;
 try{const a=new URL(save.href,'https://boardhub.invalid'),b=new URL(href,'https://boardhub.invalid');return a.pathname===b.pathname&&a.searchParams.get('game')===b.searchParams.get('game')}catch{return false}
}
export function observeSavedGame(save:SavedGame){const url=new URL(save.href,'https://boardhub.invalid');url.searchParams.set('join','1');url.searchParams.set('watch','1');return url.pathname+url.search}
