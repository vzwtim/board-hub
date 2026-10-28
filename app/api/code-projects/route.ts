import {codeStore} from '../../../server/code-platform/store.ts';
import {createCodeProject,publicProject} from '../../../server/code-platform/model.ts';
import {capabilities} from '../../../server/code-platform/config.ts';
import {requireIdentity} from '../../../server/project-auth.ts';
import {codeBody} from '../../../server/code-platform/http.ts';
import {response,error} from '../../../server/http.ts';
export async function GET(r:Request){try{const community=new URL(r.url).searchParams.get('scope')==='community';const u=community?null:await requireIdentity(r);return response({projects:(await codeStore.listProjects(u?.id||null)).map(p=>community?publicProject(p):p),capabilities:capabilities()})}catch(e){return error(e)}}
export async function POST(r:Request){try{const u=await requireIdentity(r),c=await codeBody(r);return response(await createCodeProject(codeStore,u,c.title),201)}catch(e){return error(e)}}
