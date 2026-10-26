import {database} from '../../../../server/account-store.ts';
import {SESSION_COOKIE,cookieValue,cookie,digest} from '../../../../server/auth-core.ts';
import {response,error,body} from '../../../../server/http.ts';
export async function POST(r:Request){try{await body(r);const token=cookieValue(r,SESSION_COOKIE);if(token)await database().prepare('DELETE FROM boardhub_sessions WHERE token_hash=?').bind(digest(token)).run();const result=response({ok:true});result.headers.append('Set-Cookie',cookie(SESSION_COOKIE,'',0));return result}catch(e){return error(e)}}
