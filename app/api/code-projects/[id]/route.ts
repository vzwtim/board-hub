import {codeStore} from '../../../../server/code-platform/store.ts';
import {requireProject} from '../../../../server/code-platform/model.ts';
import {capabilities} from '../../../../server/code-platform/config.ts';
import {requireIdentity} from '../../../../server/project-auth.ts';
import {response,error} from '../../../../server/http.ts';
export async function GET(r:Request,{params}:{params:Promise<{id:string}>}){try{const u=await requireIdentity(r),{id}=await params;return response({project:await requireProject(codeStore,id,u.id),releases:await codeStore.listReleases(id),capabilities:capabilities()})}catch(e){return error(e)}}
