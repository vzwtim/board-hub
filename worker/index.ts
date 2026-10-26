import handler from 'vinext/server/fetch-handler';
import {initializeDatabase} from '../server/bootstrap.ts';
import {creatorToken,CREATOR_COOKIE} from '../server/guest-identity.ts';
export default {
 async fetch(request:Request,env:Cloudflare.Env,ctx:ExecutionContext){
  if(new URL(request.url).pathname.startsWith('/api/')&&env.DB){try{await initializeDatabase(env.DB)}catch{console.error('BoardHub database initialization failed');return Response.json({error:'オンライン保存を準備できませんでした。しばらくしてから再試行してください。',code:'DATABASE_SETUP'},{status:503,headers:{'Cache-Control':'no-store'}})}}
  // An opaque browser key is never included in project snapshots or public links.
  let token=creatorToken(request),fresh=false;
  if(!token){const bytes=crypto.getRandomValues(new Uint8Array(32));token=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');fresh=true}
  const headers=new Headers(request.headers);
  // ChatGPT identity headers have no authority on a public Worker.
  for(const key of [...headers.keys()])if(key.startsWith('oai-authenticated-'))headers.delete(key);
  if(fresh)headers.set('cookie',(headers.get('cookie')||'').split(';').filter(x=>!x.trim().startsWith(CREATOR_COOKIE+'=')).concat(CREATOR_COOKIE+'='+token).join('; '));
  const result=await handler.fetch(new Request(request,{headers}),env,ctx);
  if(!fresh)return result;
  const response=new Response(result.body,result);
  response.headers.append('Set-Cookie',CREATOR_COOKIE+'='+token+'; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=31536000');
  response.headers.set('Cache-Control','private, no-store');
  return response;
 }
};
