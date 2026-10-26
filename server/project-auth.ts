import {env} from 'cloudflare:workers';
import {guestIdentity} from './guest-identity.ts';
import {RuleError} from '../engine/types.ts';
import type {Identity} from './project-model.ts';
export function identity(r:Request):Identity|null{const config=env as unknown as {TABLE_ADMIN_AUTHOR_ID?:string};return guestIdentity(r,config.TABLE_ADMIN_AUTHOR_ID)}
export function requireIdentity(r:Request){const u=identity(r);if(!u)throw new RuleError('UNAUTHORIZED','Cookieを有効にして、画面を再読み込みしてください');return u}
export async function projectBody(r:Request){const origin=r.headers.get('origin');if(origin&&origin!==new URL(r.url).origin)throw new RuleError('ORIGIN','別サイトからの操作はできません');const t=await r.text();if(t.length>18000)throw new RuleError('BODY_SIZE','送信データが大きすぎます');try{return JSON.parse(t)}catch{throw new RuleError('JSON','JSONを確認してください')}}
