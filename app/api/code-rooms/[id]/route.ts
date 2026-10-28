import {codeStore,codeRoomStore} from '../../../../server/code-platform/store.ts';
import {runtimeLoader} from '../../../../server/code-platform/config.ts';
import {actCodeRoom,getCodeRoom} from '../../../../server/code-platform/rooms.ts';
import {requireIdentity} from '../../../../server/project-auth.ts';
import {codeBody} from '../../../../server/code-platform/http.ts';
import {response,error,tokenFrom} from '../../../../server/http.ts';
export async function GET(r:Request,{params}:{params:Promise<{id:string}>}){try{const u=await requireIdentity(r),{id}=await params;return response(await getCodeRoom(codeStore,codeRoomStore,runtimeLoader(),id,new URL(r.url).searchParams.get('release')||'',tokenFrom(r),u.id))}catch(e){return error(e)}}
export async function POST(r:Request,{params}:{params:Promise<{id:string}>}){try{const u=await requireIdentity(r),{id}=await params,c=await codeBody(r);return response(await actCodeRoom(codeStore,codeRoomStore,runtimeLoader(),id,c.release,u.id,tokenFrom(r),c))}catch(e){return error(e)}}
