import {currentAccount} from '../../../../server/account-store.ts';
import {duelStore} from '../../../../server/duel-store.ts';
import {actDuel,getDuel,joinDuel} from '../../../../server/duel-service.ts';
import {body,error,response,view,tokenFrom} from '../../../../server/http.ts';
import {RuleError} from '../../../../engine/types.ts';
type C={params:Promise<{id:string}>};
export async function GET(r:Request,c:C){try{return response(await view(await getDuel(duelStore,(await c.params).id),tokenFrom(r)))}catch(e){return error(e)}}
export async function POST(r:Request,c:C){try{const account=await currentAccount(r);const {id}=await c.params,b=await body(r);if(b.type==='join'){const v=await joinDuel(duelStore,id,b.name,account?'/api/avatars/'+account.id:'');return response({...await view(v.room,v.token),token:v.token})}if(b.type==='act')return response(await view(await actDuel(duelStore,id,tokenFrom(r),b),tokenFrom(r)));throw new RuleError('BAD_ACTION','操作データが不正です')}catch(e){return error(e)}}
