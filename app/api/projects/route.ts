import {projectStore} from '../../../server/project-store.ts';
import {identity,requireIdentity,projectBody} from '../../../server/project-auth.ts';
import {createProject,summary} from '../../../server/project-model.ts';
import {response,error} from '../../../server/http.ts';
import {env} from 'cloudflare:workers';
export async function GET(r:Request){try{const q=new URL(r.url).searchParams,u=identity(r),scope=q.get('scope')==='mine'?'mine':q.get('scope')==='featured'?'featured':'community';if(scope==='mine')requireIdentity(r);const offset=Math.max(0,Math.min(10000,Number(q.get('offset'))||0)),rows=await projectStore.list(scope,u?.id||'',offset);return response({projects:rows.map(summary),user:u?{name:u.name,admin:u.admin}:null,aiAvailable:!!(env as unknown as {OPENAI_API_KEY?:string}).OPENAI_API_KEY,next:rows.length===24?offset+24:null})}catch(e){return error(e)}}
export async function POST(r:Request){try{return response(await createProject(projectStore,requireIdentity(r),await projectBody(r)),201)}catch(e){return error(e)}}
