'use client';
import {useEffect} from 'react';
export type SavedGame={id:string;title:string;href:string;updatedAt:number;state?:unknown;online?:boolean};
const KEY='boardhub-resume-v1',HIDDEN='boardhub-hidden-saves-v1';
export const SAVES_CHANGED='boardhub-saves-changed';
function hidden():string[]{try{const v=JSON.parse(localStorage.getItem(HIDDEN)||'[]');return Array.isArray(v)?v.filter(x=>typeof x==='string'):[]}catch{return []}}
function changed(){if(typeof window!=='undefined')window.dispatchEvent(new Event(SAVES_CHANGED))}
export function savedGames():SavedGame[]{try{const v=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(v)?v.filter(x=>x&&typeof x.id==='string'&&typeof x.title==='string'&&typeof x.href==='string'&&x.href.startsWith('/')&&!x.href.startsWith('//')&&typeof x.updatedAt==='number'&&!hidden().includes(x.id)):[]}catch{return []}}
export function allowSavedGame(id:string){try{localStorage.setItem(HIDDEN,JSON.stringify(hidden().filter(x=>x!==id)))}catch{}}
export function forgetSavedGame(id:string){try{const records=savedGames().filter(x=>x.id!==id);localStorage.setItem(HIDDEN,JSON.stringify([...new Set([...hidden(),id])].slice(-200)));localStorage.setItem(KEY,JSON.stringify(records));changed()}catch{}}
export function rememberGame(record:SavedGame){try{if(hidden().includes(record.id))return;localStorage.setItem(KEY,JSON.stringify([record,...savedGames().filter(x=>x.id!==record.id)].slice(0,30)));changed()}catch{}}
export function restoreSavedGame(record:SavedGame){allowSavedGame(record.id);rememberGame(record)}
export function resumeState<T extends {phase:string;revision:number}>(id:string):T|null{if(new URLSearchParams(location.search).get('resume')!=='1')return null;const s=savedGames().find(x=>x.id===id)?.state as T|undefined;return s&&s.phase==='playing'&&typeof s.revision==='number'?s:null}
export function useSaveGame(id:string,title:string,href:string,state:{phase:string;revision:number}|null,enabled:boolean){useEffect(()=>{if(enabled)allowSavedGame(id)},[id,enabled]);useEffect(()=>{if(!enabled||!state)return;if(state.phase==='finished'){try{localStorage.setItem(KEY,JSON.stringify(savedGames().filter(x=>x.id!==id)));changed()}catch{}return}if(state.phase==='playing')rememberGame({id,title,href:href+(href.includes('?')?'&':'?')+'resume=1',updatedAt:Date.now(),state})},[id,state,enabled]);}
