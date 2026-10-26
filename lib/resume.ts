'use client';
import {useEffect} from 'react';
export type SavedGame={id:string;title:string;href:string;updatedAt:number;state?:unknown;online?:boolean};
const KEY='boardhub-resume-v1';
export function savedGames():SavedGame[]{try{const v=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(v)?v.filter(x=>x&&typeof x.id==='string'&&typeof x.href==='string'&&x.href.startsWith('/')&&!x.href.startsWith('//')&&typeof x.updatedAt==='number'):[]}catch{return []}}
export function rememberGame(record:SavedGame){try{localStorage.setItem(KEY,JSON.stringify([record,...savedGames().filter(x=>x.id!==record.id)].slice(0,30)))}catch{}}
export function resumeState<T extends {phase:string;revision:number}>(id:string):T|null{if(new URLSearchParams(location.search).get('resume')!=='1')return null;const s=savedGames().find(x=>x.id===id)?.state as T|undefined;return s&&s.phase==='playing'&&typeof s.revision==='number'?s:null}
export function useSaveGame(id:string,title:string,href:string,state:{phase:string;revision:number}|null,enabled:boolean){useEffect(()=>{if(!enabled||!state)return;if(state.phase==='finished'){try{localStorage.setItem(KEY,JSON.stringify(savedGames().filter(x=>x.id!==id)))}catch{}return}if(state.phase==='playing')rememberGame({id,title,href:href+(href.includes('?')?'&':'?')+'resume=1',updatedAt:Date.now(),state})},[id,state,enabled]);}
