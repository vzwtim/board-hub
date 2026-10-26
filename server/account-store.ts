import {env} from 'cloudflare:workers';
import {RuleError} from '../engine/types.ts';
import {SESSION_COOKIE,cookieValue,digest} from './auth-core.ts';
import {guestIdentity} from './guest-identity.ts';
import type {Identity,Project} from './project-model.ts';
export interface Account{ id:string;google_sub:string;email:string;name:string;avatar:string;created_at:number;updated_at:number }
export interface LoginFlow{state_hash:string;verifier:string;nonce:string;guest_owner:string;next_path:string;expires_at:number}
export const accountEnv=()=>env as unknown as {GOOGLE_CLIENT_ID?:string;GOOGLE_CLIENT_SECRET?:string;BOARDHUB_ORIGIN?:string;TABLE_ADMIN_EMAIL?:string;TABLE_ADMIN_AUTHOR_ID?:string};
export function database(){if(!env.DB)throw new RuleError('SETUP','オンライン保存の準備ができていません。しばらくしてから再試行してください');return env.DB}
export const googleReady=()=>!!(accountEnv().GOOGLE_CLIENT_ID&&accountEnv().GOOGLE_CLIENT_SECRET);
const cached=new WeakMap<Request,Promise<Account|null>>();
export function currentAccount(r:Request){let value=cached.get(r);if(!value){value=(async()=>{const token=cookieValue(r,SESSION_COOKIE);if(!token)return null;return database().prepare('SELECT a.* FROM boardhub_accounts a JOIN boardhub_sessions s ON s.account_id=a.id WHERE s.token_hash=? AND s.expires_at>?').bind(digest(token),Date.now()).first<Account>()})();cached.set(r,value)}return value}
export function publicAccount(a:Account){const admin=accountEnv();return {id:a.id,name:a.name,email:a.email,avatar:a.avatar,admin:!!admin.TABLE_ADMIN_EMAIL&&admin.TABLE_ADMIN_EMAIL.toLowerCase()===a.email.toLowerCase()||a.id===admin.TABLE_ADMIN_AUTHOR_ID}}
export async function userIdentity(r:Request):Promise<Identity|null>{const a=await currentAccount(r);if(a)return publicAccount(a);return guestIdentity(r,accountEnv().TABLE_ADMIN_AUTHOR_ID)}
export async function putFlow(flow:LoginFlow){const db=database();await db.batch([db.prepare('DELETE FROM boardhub_oauth WHERE expires_at<?').bind(Date.now()),db.prepare('INSERT INTO boardhub_oauth(state_hash,verifier,nonce,guest_owner,next_path,expires_at) VALUES(?,?,?,?,?,?)').bind(flow.state_hash,flow.verifier,flow.nonce,flow.guest_owner,flow.next_path,flow.expires_at)])}
export async function consumeFlow(state:string){return database().prepare('DELETE FROM boardhub_oauth WHERE state_hash=? AND expires_at>? RETURNING *').bind(digest(state),Date.now()).first<LoginFlow>()}
export async function loginAccount(claims:{sub:string;email:string;name?:string;picture?:string},session:string,guest:string){const db=database(),id='google-'+digest(claims.sub),now=Date.now();const avatar=claims.picture&&/^https:\/\/[^/]+\.googleusercontent\.com\//.test(claims.picture)?claims.picture:'';
 await db.prepare('INSERT INTO boardhub_accounts(id,google_sub,email,name,avatar,created_at,updated_at) VALUES(?,?,?,?,?,?,?) ON CONFLICT(google_sub) DO UPDATE SET email=excluded.email,avatar=excluded.avatar,updated_at=excluded.updated_at').bind(id,claims.sub,claims.email,(claims.name||'プレイヤー').slice(0,40),avatar,now,now).run();
 const account=await db.prepare('SELECT * FROM boardhub_accounts WHERE id=?').bind(id).first<Account>();if(!account)throw Error('アカウントを保存できませんでした');
 // Transfer only projects whose owner matches the browser key captured before Google login.
 if(guest.startsWith('guest-')){const projects=await db.prepare('SELECT id,snapshot,revision FROM table_projects WHERE owner=?').bind(guest).all<{id:string;snapshot:string;revision:number}>();if(projects.results.length){await db.batch(projects.results.map(row=>{const p=JSON.parse(row.snapshot) as Project;p.owner=id;p.author=account.name;p.revision++;p.updatedAt=now;return db.prepare('UPDATE table_projects SET owner=?,snapshot=?,revision=?,updated_at=? WHERE id=? AND owner=? AND revision=?').bind(id,JSON.stringify(p),p.revision,now,p.id,guest,row.revision)}))}}
 await db.batch([db.prepare('DELETE FROM boardhub_sessions WHERE expires_at<?').bind(now),db.prepare('INSERT INTO boardhub_sessions(token_hash,account_id,expires_at) VALUES(?,?,?)').bind(digest(session),id,now+30*86400000)]);return account;
}
