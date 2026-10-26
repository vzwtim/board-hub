import {currentAccount} from '../../../../server/account-store.ts';
import {tabletopStore} from '../../../../server/tabletop-store.ts';
import {getTabletop,joinTabletop,actTabletop,tabletopView} from '../../../../server/tabletop-service.ts';
import {body,error,response,tokenFrom} from '../../../../server/http.ts';
import {RuleError} from '../../../../engine/types.ts';
type Context={params:Promise<{id:string}>};
export async function GET(r:Request,c:Context){try{return response(await tabletopView(await getTabletop(tabletopStore,(await c.params).id),tokenFrom(r)))}catch(e){return error(e)}}
export async function POST(r:Request,c:Context){try{const account=await currentAccount(r);const b=await body(r),{id}=await c.params;if(b.type==='join'){const v=await joinTabletop(tabletopStore,id,b.name,account?'/api/avatars/'+account.id:'');return response({...await tabletopView(v.room,v.token),token:v.token})}if(b.type==='act')return response(await tabletopView(await actTabletop(tabletopStore,id,tokenFrom(r),b),tokenFrom(r)));throw new RuleError('BAD_ACTION','操作が不正です')}catch(e){return error(e)}}
