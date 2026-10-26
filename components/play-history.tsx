'use client';
import {useEffect} from 'react';
import {games} from '../lib/game-catalog';
export function PlayHistory(){useEffect(()=>{const url=new URL(location.href);if(url.searchParams.has('guide'))return;const g=games.find(g=>{const target=new URL(g.href,url.origin);return target.pathname===url.pathname&&(!target.searchParams.has('game')||target.searchParams.get('game')===url.searchParams.get('game'))});if(!g)return;try{const date=new Date().toLocaleDateString('sv-SE'),items=JSON.parse(localStorage.getItem('boardhub-visits')||'[]');if(!items.some((x:{id:string;date:string})=>x.id===g.id&&x.date===date))localStorage.setItem('boardhub-visits',JSON.stringify([...items,{id:g.id,date}].slice(-2000)))}catch{}},[]);return null}
