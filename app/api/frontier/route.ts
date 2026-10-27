import {roomParticipant} from '../../../server/room-participant.ts';
import {frontierStore} from '../../../server/frontier-store.ts';
import {createFrontier,frontierView} from '../../../server/frontier-service.ts';
import {body,error,response,tokenFrom} from '../../../server/http.ts';
export async function POST(r:Request){try{const b=await body(r),identity=await roomParticipant(r),v=await createFrontier(frontierStore,identity?.name||b.name||'ゲスト',b.players??4,identity?.avatar||'',identity);return response({...await frontierView(v.room,v.token,identity),token:v.token},201)}catch(e){return error(e)}}
