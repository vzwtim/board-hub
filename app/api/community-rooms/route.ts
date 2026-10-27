import {roomParticipant} from '../../../server/room-participant.ts';
import {communityStore} from '../../../server/community-store.ts';
import {projectStore} from '../../../server/project-store.ts';
import {createCommunity} from '../../../server/community-service.ts';
import {body,error,response,tokenFrom,view} from '../../../server/http.ts';
export async function POST(r:Request){try{const b=await body(r),identity=await roomParticipant(r),v=await createCommunity(communityStore,projectStore,identity?.name||b.name||'ゲスト',b.project,b.ref,identity?.avatar||'',identity);return response({...await view(v.room,v.token,identity),token:v.token},201)}catch(e){return error(e)}}
