import {roomParticipant} from '../../../server/room-participant.ts';
import {tabletopStore} from '../../../server/tabletop-store.ts';
import {createTabletop,tabletopView} from '../../../server/tabletop-service.ts';
import {body,error,response,tokenFrom} from '../../../server/http.ts';
export async function POST(r:Request){try{const b=await body(r),identity=await roomParticipant(r),v=await createTabletop(tabletopStore,identity?.name||b.name||'ゲスト',b.game,b.players,identity?.avatar||'',identity);return response({...await tabletopView(v.room,v.token,identity),token:v.token},201)}catch(e){return error(e)}}
