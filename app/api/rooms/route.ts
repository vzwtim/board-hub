import {roomParticipant} from '../../../server/room-participant.ts';
import {createRoom} from '../../../server/service.ts';
import {store} from '../../../server/d1.ts';
import {body,error,response,view} from '../../../server/http.ts';
export async function POST(r:Request){try{const b=await body(r),identity=await roomParticipant(r),v=await createRoom(store,identity?.name||b.name||'ゲスト',identity?.avatar||'',identity);return response({...await view(v.room,v.token,identity),token:v.token},201)}catch(e){return error(e)}}
