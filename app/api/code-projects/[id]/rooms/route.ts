import {codeStore,codeRoomStore} from '../../../../../server/code-platform/store.ts';
import {runtimeLoader} from '../../../../../server/code-platform/config.ts';
import {createCodeRoom} from '../../../../../server/code-platform/rooms.ts';
import {requireIdentity} from '../../../../../server/project-auth.ts';
import {codeBody} from '../../../../../server/code-platform/http.ts';
import {response,error} from '../../../../../server/http.ts';
export async function POST(r:Request,{params}:{params:Promise<{id:string}>}){try{const u=await requireIdentity(r),{id}=await params,c=await codeBody(r);return response(await createCodeRoom(codeStore,codeRoomStore,runtimeLoader(),id,c.release,u.id,c.players),201)}catch(e){return error(e)}}
