import {roomParticipant} from '../../../server/room-participant.ts';
import {duelStore} from '../../../server/duel-store.ts';
import {createDuel} from '../../../server/duel-service.ts';
import {body,error,response,tokenFrom,view} from '../../../server/http.ts';
export async function POST(r:Request){try{const b=await body(r),identity=await roomParticipant(r),v=await createDuel(duelStore,identity?.name||b.name||'ゲスト',b.game,identity?.avatar||'',identity);return response({...await view(v.room,v.token,identity),token:v.token},201)}catch(e){return error(e)}}
