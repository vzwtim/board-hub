import {currentAccount} from '../../../../server/account-store.ts';
import {islandStore} from '../../../../server/isle-store.ts';
import {actIsland,getIsland,joinIsland} from '../../../../server/isle-service.ts';
import {body,error,response,view,tokenFrom} from '../../../../server/http.ts';
import {RuleError} from '../../../../engine/types.ts';
type Context={params:Promise<{id:string}>};
export async function GET(request:Request,ctx:Context){try{const {id}=await ctx.params;return response(await view(await getIsland(islandStore,id),tokenFrom(request)))}catch(e){return error(e)}}
export async function POST(request:Request,ctx:Context){try{const account=await currentAccount(request);const {id}=await ctx.params,b=await body(request);if(b?.type==='join'){const r=await joinIsland(islandStore,id,b.name,account?'/api/avatars/'+account.id:'');return response({...await view(r.room,r.token),token:r.token})}if(b?.type==='act')return response(await view(await actIsland(islandStore,id,tokenFrom(request),b),tokenFrom(request)));throw new RuleError('BAD_ACTION','対応していない操作です')}catch(e){return error(e)}}
