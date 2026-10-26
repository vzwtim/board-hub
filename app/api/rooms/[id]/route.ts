import {currentAccount} from '../../../../server/account-store.ts';
import { joinRoom, moveRoom } from '../../../../server/service.ts';
import { store } from '../../../../server/d1.ts';
import { body,error,response,view,tokenFrom } from '../../../../server/http.ts';
import { RuleError } from '../../../../engine/types.ts';
type Context={params:Promise<{id:string}>};
export async function GET(request:Request,ctx:Context){try{const {id}=await ctx.params;if(!/^[a-f0-9-]{36}$/.test(id))throw new RuleError('NOT_FOUND','部屋が見つかりません');const room=await store.get(id);if(!room)throw new RuleError('NOT_FOUND','部屋が見つかりません');if(room.state.gameID!=='kalah')throw new RuleError('WRONG_GAME','この部屋は島の工房から開いてください');return response(await view(room,tokenFrom(request)))}catch(e){return error(e)}}
export async function POST(request:Request,ctx:Context){try{const account=await currentAccount(request);const {id}=await ctx.params;const b=await body(request);if(b?.type==='join'){const r=await joinRoom(store,id,b.name,account?'/api/avatars/'+account.id:'');return response({...await view(r.room,r.token),token:r.token})}if(b?.type==='move'){const room=await moveRoom(store,id,tokenFrom(request),b);return response(await view(room,tokenFrom(request)))}throw new RuleError('BAD_ACTION','対応していない操作です')}catch(e){return error(e)}}
