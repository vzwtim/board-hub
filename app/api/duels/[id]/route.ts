import {RuleError} from '../../../../engine/types.ts';
import {roomParticipant} from '../../../../server/room-participant.ts';
import {duelStore} from '../../../../server/duel-store.ts';
import {joinDuel,actDuel,getDuel} from '../../../../server/duel-service.ts';
import {body,error,response,tokenFrom,view} from '../../../../server/http.ts';
type Context={params:Promise<{id:string}>};
export async function GET(r:Request,c:Context){try{const {id}=await c.params,identity=await roomParticipant(r);return response(await view(await getDuel(duelStore,id),tokenFrom(r),identity))}catch(e){return error(e)}}
export async function POST(r:Request,c:Context){try{const {id}=await c.params,b=await body(r),identity=await roomParticipant(r);if(b.type==='join'){const v=await joinDuel(duelStore,id,identity?.name||b.name||'ゲスト',identity?.avatar||'',identity);return response({...await view(v.room,v.token,identity),...(v.token?{token:v.token}:{})})}if(b.type==='act')return response(await view(await actDuel(duelStore,id,tokenFrom(r),b,identity),tokenFrom(r),identity));throw new RuleError('BAD_ACTION','対応していない操作です')}catch(e){return error(e)}}
