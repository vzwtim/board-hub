import {createHash,randomBytes,timingSafeEqual} from 'node:crypto';
export const SESSION_COOKIE='__Host-boardhub-session', FLOW_COOKIE='__Host-boardhub-oauth';
export const opaque=()=>randomBytes(32).toString('base64url');
export const digest=(v:string)=>createHash('sha256').update(v).digest('hex');
export const challenge=(v:string)=>createHash('sha256').update(v).digest('base64url');
export function cookieValue(r:Request,name:string){const value=(r.headers.get('cookie')||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(name+'='))?.slice(name.length+1);return value&&/^[A-Za-z0-9_-]{32,128}$/.test(value)?value:null}
export function cookie(name:string,value:string,seconds:number){return `${name}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${seconds}`}
export function safeNext(value:string|null){if(!value||!value.startsWith('/')||value.startsWith('//')||/[\\\r\n]/.test(value))return '/account';const u=new URL(value,'https://boardhub.invalid');return u.origin==='https://boardhub.invalid'?u.pathname+u.search:'/account'}
export function sameSecret(a:string,b:string){const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length&&timingSafeEqual(x,y)}
export interface GoogleClaims{sub:string;email:string;email_verified:boolean;name?:string;picture?:string;iss:string;aud:string|string[];azp?:string;exp:number;iat:number;nonce:string}
export type GoogleKey=JsonWebKey&{kid:string};
let keyCache:{keys:GoogleKey[];until:number}|null=null;
async function googleKeys(refresh=false){if(!refresh&&keyCache&&keyCache.until>Date.now())return keyCache.keys;const response=await fetch('https://www.googleapis.com/oauth2/v3/certs',{signal:AbortSignal.timeout(10000)});if(!response.ok)throw Error('Googleの認証情報を確認できませんでした');const data=await response.json() as {keys:GoogleKey[]};keyCache={keys:data.keys,until:Date.now()+Math.min(3600,Number(response.headers.get('cache-control')?.match(/max-age=(\d+)/)?.[1]||300))*1000};return data.keys}
export async function verifyGoogleToken(token:string,clientID:string,nonce:string,providedKeys?:GoogleKey[],now=Math.floor(Date.now()/1000)):Promise<GoogleClaims>{
 if(typeof token!=='string'||token.length>16000)throw Error('認証結果が不正です');const parts=token.split('.');if(parts.length!==3)throw Error('認証結果が不正です');
 const head=JSON.parse(Buffer.from(parts[0],'base64url').toString()),claims=JSON.parse(Buffer.from(parts[1],'base64url').toString()) as GoogleClaims;
 if(head.alg!=='RS256'||typeof head.kid!=='string')throw Error('認証方式が不正です');
 let keys=providedKeys||await googleKeys(),key=keys.find(k=>k.kid===head.kid);if(!key&&!providedKeys){keys=await googleKeys(true);key=keys.find(k=>k.kid===head.kid)}if(!key||key.kty!=='RSA')throw Error('認証鍵が見つかりません');
 const imported=await crypto.subtle.importKey('jwk',key,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
 if(!await crypto.subtle.verify('RSASSA-PKCS1-v1_5',imported,Buffer.from(parts[2],'base64url'),new TextEncoder().encode(parts[0]+'.'+parts[1])))throw Error('認証の署名を確認できませんでした');
 const audience=Array.isArray(claims.aud)?claims.aud.includes(clientID):claims.aud===clientID;
 if(!['https://accounts.google.com','accounts.google.com'].includes(claims.iss)||!audience||(claims.azp&&claims.azp!==clientID)||(Array.isArray(claims.aud)&&claims.aud.length>1&&claims.azp!==clientID)||!Number.isFinite(claims.exp)||claims.exp<=now||!Number.isFinite(claims.iat)||claims.iat>now+60||typeof claims.nonce!=='string'||!sameSecret(claims.nonce,nonce)||typeof claims.sub!=='string'||!claims.sub.length||claims.sub.length>255||typeof claims.email!=='string'||claims.email_verified!==true)throw Error('認証の有効性を確認できませんでした');
 return claims;
}
export function googleURL(clientID:string,redirectURI:string,state:string,verifier:string,nonce:string){const u=new URL('https://accounts.google.com/o/oauth2/v2/auth');u.search=new URLSearchParams({client_id:clientID,redirect_uri:redirectURI,response_type:'code',scope:'openid email profile',state,nonce,code_challenge:challenge(verifier),code_challenge_method:'S256',prompt:'select_account'}).toString();return u.toString()}
