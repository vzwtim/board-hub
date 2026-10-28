import {codeStore} from '../../../../../server/code-platform/store.ts';
import {publishRelease} from '../../../../../server/code-platform/model.ts';
import {requireIdentity} from '../../../../../server/project-auth.ts';
import {codeBody} from '../../../../../server/code-platform/http.ts';
import {response,error} from '../../../../../server/http.ts';
export async function POST(r:Request,{params}:{params:Promise<{id:string}>}){try{const u=await requireIdentity(r),{id}=await params;return response(await publishRelease(codeStore,id,u.id,await codeBody(r)))}catch(e){return error(e)}}
