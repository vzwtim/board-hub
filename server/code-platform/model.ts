import {createHash,randomBytes} from 'node:crypto';
import {RuleError} from '../../engine/types.ts';
export type SourceFiles=Record<string,string>;
export interface Repository {fullName:string;branch:string;directory:string;installation:number;managed:boolean}
export interface CodeProject {id:string;owner:string;author:string;title:string;revision:number;challenge:string;repository:Repository|null;published:string|null;listed:boolean;createdAt:number;updatedAt:number}
export interface CodeRelease {id:string;project:string;digest:string;status:'ready'|'failed';error:string;title:string;files:SourceFiles;modules:Record<string,{js:string}|{json:unknown}>;ui:string;source:{kind:'upload'|'github'|'draft';commit:string|null};createdAt:number}
export interface CodeStore {
 getProject(id:string):Promise<CodeProject|null>;
 createProject(p:CodeProject):Promise<void>;
 replaceProject(p:CodeProject,revision:number):Promise<boolean>;
 listProjects(owner:string|null):Promise<CodeProject[]>;
 getRelease(project:string,id:string):Promise<CodeRelease|null>;
 saveRelease(r:CodeRelease):Promise<void>;
 listReleases(project:string):Promise<Omit<CodeRelease,'files'|'modules'|'ui'>[]>;
 claimDelivery(id:string):Promise<boolean>;
 forgetDelivery(id:string):Promise<void>;
 repositoryProjects(name:string):Promise<CodeProject[]>;
}
export const digest=(s:string)=>createHash('sha256').update(s).digest('hex');
export function own(p:CodeProject,owner:string){if(p.owner!==owner)throw new RuleError('UNAUTHORIZED','この作品の作者だけが変更できます')}
export async function requireProject(store:CodeStore,id:string,owner?:string){const p=await store.getProject(id);if(!p)throw new RuleError('NOT_FOUND','作品が見つかりません');if(owner)own(p,owner);return p}
export async function createCodeProject(store:CodeStore,u:{id:string;name:string},title:unknown){if(typeof title!=='string'||!title.trim()||title.length>60)throw new RuleError('INPUT','作品名を1〜60文字で入力してください');if((await store.listProjects(u.id)).length>=10)throw new RuleError('LIMIT','コード作品は10件までです');const p:CodeProject={id:crypto.randomUUID(),owner:u.id,author:u.name,title:title.trim(),revision:1,challenge:randomBytes(32).toString('hex'),repository:null,published:null,listed:false,createdAt:Date.now(),updatedAt:Date.now()};await store.createProject(p);return p}
export function publicProject(p:CodeProject){return {id:p.id,title:p.title,author:p.author,published:p.published,listed:p.listed,updatedAt:p.updatedAt}}
export async function saveProject(store:CodeStore,p:CodeProject,expected:number){p.revision=expected+1;p.updatedAt=Date.now();if(!await store.replaceProject(p,expected))throw new RuleError('STALE_STATE','作品が更新されています。再読み込みしてください');return p}
export async function publishRelease(store:CodeStore,id:string,owner:string,input:{release?:unknown;expectedRevision?:unknown;listed?:unknown}){const p=await requireProject(store,id,owner);if(input.expectedRevision!==p.revision)throw new RuleError('STALE_STATE','作品が更新されています');if(typeof input.release!=='string'||typeof input.listed!=='boolean')throw new RuleError('INPUT','公開する版を選んでください');const r=await store.getRelease(id,input.release);if(!r||r.status!=='ready')throw new RuleError('STATE','試遊できる版だけを公開できます');p.published=r.id;p.listed=input.listed;return saveProject(store,p,p.revision)}
export function repositoryInput(input:unknown):{fullName:string;branch:string;directory:string}{const c=input as Record<string,unknown>;if(!c||typeof c.fullName!=='string'||!/^[A-Za-z0-9][A-Za-z0-9-]{0,38}\/[A-Za-z0-9_.-]{1,100}$/.test(c.fullName)||typeof c.branch!=='string'||!c.branch||c.branch.length>100||/[\x00-\x20~^:?*\[\\]|\.\.|@\{|\/\/|\/$|\.lock$/.test(c.branch)||typeof c.directory!=='string')throw new RuleError('INPUT','GitHubの所有者/リポジトリ名、ブランチ、フォルダを確認してください');const directory=c.directory.replace(/\/$/,'');if(directory&&(!/^[A-Za-z0-9_./-]{1,180}$/.test(directory)||directory.split('/').some(p=>!p||p==='.'||p==='..'||p==='.git')))throw new RuleError('INPUT','フォルダの指定が不正です');return {fullName:c.fullName,branch:c.branch,directory}}
export function validateFiles(input:unknown):SourceFiles {
 if(!input||typeof input!=='object'||Array.isArray(input))throw new RuleError('INPUT','ソースファイルを選んでください');
 const entries=Object.entries(input);if(entries.length<2||entries.length>80)throw new RuleError('LIMIT','ソースは2〜80ファイルで指定してください');
 let bytes=0;const files:SourceFiles=Object.create(null);
 for(const [path,value] of entries){if(!/^[A-Za-z0-9_.\/-]{1,180}$/.test(path)||path.split('/').some(p=>!p||p==='.'||p==='..'||p==='.git'||p.startsWith('.env'))||path.startsWith('.github/')||!(/\.(ts|js|json|html|css|md|txt)$/.test(path)||['LICENSE','.gitignore'].includes(path))||typeof value!=='string')throw new RuleError('INPUT','未対応または不正なファイル: '+path);const size=new TextEncoder().encode(value).byteLength;if(size>200000)throw new RuleError('LIMIT','ファイルが大きすぎます: '+path);bytes+=size;if(bytes>400000)throw new RuleError('LIMIT','ソースの合計は400KBまでです');files[path]=value}
 if(!files['game.ts']||!files['ui.html']||!files['manifest.json'])throw new RuleError('INPUT','game.ts、ui.html、manifest.json が必要です');
 let manifest;try{manifest=JSON.parse(files['manifest.json'])}catch{throw new RuleError('INPUT','manifest.jsonを確認してください')}
 if(manifest.schema!==1||manifest.sdkVersion!=='0.1.0'||manifest.entry!=='game.ts'||manifest.ui!=='ui.html'||typeof manifest.title!=='string'||!manifest.title.trim()||manifest.title.length>60)throw new RuleError('INPUT','制作キットのmanifest形式に合わせてください');
 return files;
}
