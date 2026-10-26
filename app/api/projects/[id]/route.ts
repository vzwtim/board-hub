import {projectStore} from '../../../../server/project-store.ts';
import {identity,requireIdentity,projectBody} from '../../../../server/project-auth.ts';
import {getProject,mutateProject} from '../../../../server/project-model.ts';
import {response,error} from '../../../../server/http.ts';
export async function GET(r:Request,{params}:{params:Promise<{id:string}>}){try{const u=identity(r),p=await getProject(projectStore,(await params).id,u,true);return response({project:p,mine:p.owner===u?.id,admin:u?.admin||false})}catch(e){return error(e)}}
export async function POST(r:Request,{params}:{params:Promise<{id:string}>}){try{return response({project:await mutateProject(projectStore,(await params).id,requireIdentity(r),{...await projectBody(r),ai:false}),mine:true})}catch(e){return error(e)}}
