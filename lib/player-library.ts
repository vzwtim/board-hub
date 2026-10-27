import {games} from './game-catalog.ts';
export type Visit={id:string;date:string};
export function parseVisits(value:unknown):Visit[]{if(!Array.isArray(value))return [];const known=new Set(games.map(g=>g.id));return value.filter((v):v is Visit=>!!v&&typeof v==='object'&&known.has((v as Visit).id)&&typeof (v as Visit).date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test((v as Visit).date)).slice(-2000)}
export function recentVisits(visits:Visit[]):Visit[]{return [...visits].reverse().sort((a,b)=>b.date.localeCompare(a.date)).filter((v,i,a)=>a.findIndex(x=>x.id===v.id)===i)}
