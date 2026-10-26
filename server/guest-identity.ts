import {createHash} from 'node:crypto';
export const CREATOR_COOKIE='__Host-table-creator';
export function creatorToken(r:Request){const value=(r.headers.get('cookie')||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(CREATOR_COOKIE+'='))?.slice(CREATOR_COOKIE.length+1);return value&&/^[a-f0-9]{64}$/.test(value)?value:null}
export function guestIdentity(r:Request,adminAuthor=''){const token=creatorToken(r);if(!token)return null;const id='guest-'+createHash('sha256').update(token).digest('hex');return {id,name:'作家 '+id.slice(-6),admin:!!adminAuthor&&id===adminAuthor}}
