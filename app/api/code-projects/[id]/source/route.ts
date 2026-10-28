import {codeStore} from '../../../../../server/code-platform/store.ts';
import {sourceOperation} from '../../../../../server/code-platform/sources.ts';
import {runtimeLoader,codeGitHub} from '../../../../../server/code-platform/config.ts';
import {requireIdentity} from '../../../../../server/project-auth.ts';
import {codeBody} from '../../../../../server/code-platform/http.ts';
import {response,error} from '../../../../../server/http.ts';
export async function POST(r:Request,{params}:{params:Promise<{id:string}>}){try{const u=await requireIdentity(r),{id}=await params;const result=await sourceOperation(codeStore,codeGitHub(),runtimeLoader(),id,u.id,await codeBody(r));const {files,modules,ui,...release}=result.release;return response({...result,release})}catch(e){return error(e)}}
