import type {Project} from '../server/project-model.ts';
import type {Spec} from '../games/community/index.ts';
export type ProjectSummary={id:string;author:string;revision:number;listed:boolean;featured:boolean;updatedAt:number;forkOf:Project['forkOf'];main:string;version:number;spec:Spec;branches:number;versions:number};
export async function projectRequest<T=unknown>(path:string,body?:unknown):Promise<T>{const r=await fetch(path,{method:body?'POST':'GET',cache:'no-store',headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined});if(!r.headers.get('content-type')?.includes('application/json'))throw Error('ログインしてから再度開いてください');const v=await r.json() as T&{error?:string};if(!r.ok)throw Error(v.error||'接続できませんでした');return v}
export type ListResult={projects:ProjectSummary[];user:{name:string;admin:boolean}|null;aiAvailable:boolean;next:number|null};
