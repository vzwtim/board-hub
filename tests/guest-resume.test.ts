import {test} from 'node:test';
import assert from 'node:assert/strict';
import {claimGuestTab} from '../lib/guest-tab.ts';
import {RoomSeatStorage} from '../lib/room-seat-storage.ts';
import {savedGameAccess,savedGameMatches,observeSavedGame} from '../lib/saved-game-access.ts';
import {resolveReturnTo} from '../lib/game-navigation.ts';
import {completeSavedGame,rememberGame,savedGames,SAVES_CHANGED,type SavedGame} from '../lib/resume.ts';
import {gameLaunchURL,invitationConfig,playModes} from '../lib/game-launch.ts';
import type {GameInfo} from '../lib/game-catalog.ts';
import {clientID} from '../lib/client-id.ts';
class StorageMock implements Storage{
 data=new Map<string,string>();get length(){return this.data.size}clear(){this.data.clear()}key(i:number){return [...this.data.keys()][i]??null}getItem(k:string){return this.data.get(k)??null}setItem(k:string,v:string){this.data.set(k,v)}removeItem(k:string){this.data.delete(k)}
 clone(){const next=new StorageMock();next.data=new Map(this.data);return next}
}
function locks(){const held=new Set<string>();return {request:async(name:string,_options:unknown,callback:(lock:unknown)=>unknown)=>{if(held.has(name))return callback(null);held.add(name);try{return await callback({name})}finally{held.delete(name)}}} as Pick<LockManager,'request'>}
test('a duplicated tab drops copied guest capabilities but preserves account seats and the original tab',async()=>{
 const manager=locks(),a=new StorageMock(),browser=new StorageMock(),releaseA=await claimGuestTab(a,manager);
 const actor={kind:'guest' as const,id:crypto.randomUUID()},account={kind:'account' as const,id:'alice'};
 const original=new RoomSeatStorage(a,browser);original.save('/api/frontier','r',actor,'secret');original.save('/api/rooms','s',account,'account-secret');a.setItem('boardhub-code-seat:release:room','code-secret');a.setItem('isleworks-seat-room','old-secret');
 const copied=a.clone(),releaseB=await claimGuestTab(copied,manager),duplicate=new RoomSeatStorage(copied,browser);
 assert.equal(original.hasGuestSeat('/api/frontier','r'),true);assert.equal(duplicate.hasGuestSeat('/api/frontier','r'),false);assert.equal(duplicate.token('/api/frontier','r',actor),'');assert.equal(duplicate.token('/api/rooms','s',account),'account-secret');assert.equal(copied.getItem('boardhub-code-seat:release:room'),null);assert.equal(copied.getItem('isleworks-seat-room'),null);
 releaseA();releaseB();await new Promise(resolve=>setImmediate(resolve));
 const releaseReload=await claimGuestTab(a,manager);assert.equal(new RoomSeatStorage(a,browser).hasGuestSeat('/api/frontier','r'),true);releaseReload();
});
const save:SavedGame={id:'room:r',title:'島の工房',href:'/frontier?room=r',online:true,updatedAt:1,room:{api:'/api/frontier',participation:'guest',players:['A','B'],phase:'playing'}};
test('guest resume requires this tab capability; other tabs open explicit observation',()=>{
 const tab=new StorageMock();assert.equal(savedGameAccess(save,undefined,tab),'guest-tab');new RoomSeatStorage(tab,null).save('/api/frontier','r',{kind:'guest',id:crypto.randomUUID()},'private');assert.equal(savedGameAccess(save,undefined,tab),'ready');
 const url=new URL(observeSavedGame(save),'https://test.invalid');assert.equal(url.searchParams.get('watch'),'1');assert.equal(url.searchParams.get('join'),'1');assert.ok(!url.href.includes('private'));
});
test('account resume cannot be presented as ready to a different account or a logged out user',()=>{
 const account:SavedGame={...save,room:{...save.room!,participation:'account',accountId:'alice'}};
 assert.equal(savedGameAccess(account,'alice'),'ready');assert.equal(savedGameAccess(account,'bob'),'account');assert.equal(savedGameAccess(account),'account');assert.equal(savedGameAccess({...save,room:undefined}),'unknown');assert.equal(savedGameAccess({...save,online:false}),'ready');
});
test('setup lists online matches by game without mixing variants sharing a route',()=>{
 assert.equal(savedGameMatches(save,'frontier','/frontier'),true);const tabletop={...save,href:'/tabletop?game=deckworks&room=r'};
 assert.equal(savedGameMatches(tabletop,'deckworks','/tabletop?game=deckworks'),true);assert.equal(savedGameMatches(tabletop,'tileworks','/tabletop?game=tileworks'),false);assert.equal(savedGameMatches({...save,id:'frontier',online:false},'frontier','/frontier'),true);
});
test('completing an online match removes it and notifies mounted library views',()=>{
 const storage=new StorageMock(),target=new EventTarget(),previousStorage=Object.getOwnPropertyDescriptor(globalThis,'localStorage'),previousWindow=Object.getOwnPropertyDescriptor(globalThis,'window');
 Object.defineProperty(globalThis,'localStorage',{configurable:true,value:storage});Object.defineProperty(globalThis,'window',{configurable:true,value:target});
 try{rememberGame(save);let changes=0;target.addEventListener(SAVES_CHANGED,()=>changes++);completeSavedGame(save.id);assert.equal(savedGames().length,0);assert.equal(changes,1)}finally{if(previousStorage)Object.defineProperty(globalThis,'localStorage',previousStorage);else Reflect.deleteProperty(globalThis,'localStorage');if(previousWindow)Object.defineProperty(globalThis,'window',previousWindow);else Reflect.deleteProperty(globalThis,'window')}
});
test('explicit safe return destinations survive reload and OAuth without accepting external redirects',()=>{
 const origin='https://test.invalid';assert.equal(resolveReturnTo('?returnTo=%2Fcommunity%3Fview%3Dfavorites',origin+'/frontier','/account',origin),'/community?view=favorites');assert.equal(resolveReturnTo('?returnTo=https://evil.test','https://accounts.google.com','/account',origin),'/account');assert.equal(resolveReturnTo('','','',origin),'/');
});
test('community setup launches all modes with its pinned version and matching invitation service',()=>{
 const game:GameInfo={id:'project:abc',title:'Test',subtitle:'',genre:'',minutes:'',players:'2人',difficulty:'',description:'',href:'/play/abc?ref=version1',cpu:'',invite:'yes',learn:'',tags:[],preview:''};
 assert.deepEqual(playModes(game),['cpu','table','invite']);for(const mode of playModes(game))assert.equal(new URL(gameLaunchURL(game,mode,2),'https://test.invalid').searchParams.get('ref'),'version1');assert.deepEqual(invitationConfig(game,2,'Guest'),{api:'/api/community-rooms',body:{name:'Guest',project:'abc',ref:'version1'}});
});
test('client identifiers use cryptographic UUID v4 values when randomUUID is unavailable',()=>{
 const descriptor=Object.getOwnPropertyDescriptor(globalThis,'crypto');
 const actual=globalThis.crypto;
 Object.defineProperty(globalThis,'crypto',{configurable:true,value:{getRandomValues:actual.getRandomValues.bind(actual)}});
 try{const values=Array.from({length:20},clientID);for(const value of values)assert.match(value,/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/);assert.equal(new Set(values).size,20)}finally{if(descriptor)Object.defineProperty(globalThis,'crypto',descriptor);else Reflect.deleteProperty(globalThis,'crypto')}
});
test('shared room cards retain account recovery while a guest in another tab updates them',()=>{
 const previous=Object.getOwnPropertyDescriptor(globalThis,'localStorage');Object.defineProperty(globalThis,'localStorage',{configurable:true,value:new StorageMock()});
 try{rememberGame({...save,room:{...save.room!,participation:'account',accountId:'alice'}});rememberGame(save);const latest=savedGames()[0];assert.equal(savedGameAccess(latest,'alice'),'ready');assert.equal(savedGameAccess(latest,'bob'),'guest-tab');assert.ok(!JSON.stringify(latest).includes('secret'))}finally{if(previous)Object.defineProperty(globalThis,'localStorage',previous);else Reflect.deleteProperty(globalThis,'localStorage')}
});
