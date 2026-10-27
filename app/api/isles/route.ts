import {roomParticipant} from '../../../server/room-participant.ts';
import {islandStore} from '../../../server/isle-store.ts';
import {createIsland} from '../../../server/isle-service.ts';
import {body,error,response,view} from '../../../server/http.ts';
export async function POST(request:Request){try{const identity=await roomParticipant(request);const b=await body(request),r=await createIsland(islandStore,b?.name,identity?.avatar||'',identity);return response({...await view(r.room,r.token,identity),token:r.token},201)}catch(e){return error(e)}}
