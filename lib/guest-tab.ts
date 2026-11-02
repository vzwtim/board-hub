import {clientID} from './client-id.ts';
// A copied sessionStorage must not silently give a second document a guest seat.
const TAB_KEY='boardhub-guest-tab-v1';
export function clearCopiedGuestSeats(storage:Storage){
 const keys=Array.from({length:storage.length},(_,i)=>storage.key(i)).filter((k):k is string=>!!k);
 for(const key of keys){
  if(key==='boardhub-tab-guest-v2'||key.startsWith('boardhub-code-seat:')||key.startsWith('isleworks-seat-')||key.startsWith('boardhub-seat-v2:')&&key.includes(':guest:'))storage.removeItem(key);
  if(key.startsWith('boardhub-room-identity-v2:')){try{if(JSON.parse(storage.getItem(key)||'null')?.kind==='guest')storage.removeItem(key)}catch{storage.removeItem(key)}}
 }
}
export async function claimGuestTab(storage:Storage,locks:Pick<LockManager,'request'>){
 let id=storage.getItem(TAB_KEY)||clientID();storage.setItem(TAB_KEY,id);
 async function claim(key:string):Promise<(()=>void)|null>{return new Promise((resolve,reject)=>{
  void locks.request('boardhub-guest-tab:'+key,{ifAvailable:true},lock=>{
   if(!lock){resolve(null);return}
   return new Promise<void>(release=>resolve(release));
  }).catch(reject);
 })}
 let release=await claim(id);
 if(!release){clearCopiedGuestSeats(storage);id=clientID();storage.setItem(TAB_KEY,id);release=await claim(id)}
 if(!release)throw Error('ゲストの参加情報を準備できませんでした。再読み込みしてください');
 return release;
}
let preparation:Promise<void>|undefined;
export function prepareGuestTab(){
 if(preparation)return preparation;
 preparation=(async()=>{
  // Browsers without Web Locks retain tab-scoped storage; public invitations
  // still explicitly require choosing a new identity in RoomJoinGate.
  if(!navigator.locks)return;
  let storage:Storage;try{storage=sessionStorage;storage.setItem('boardhub-storage-check','1');storage.removeItem('boardhub-storage-check')}catch{return}
  const release=await claimGuestTab(storage,navigator.locks);
  window.addEventListener('pagehide',()=>{release();preparation=undefined},{once:true});
 })();
 return preparation;
}
