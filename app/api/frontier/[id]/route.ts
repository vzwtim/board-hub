import {frontierStore} from '../../../../server/frontier-store.ts';
import {actFrontier,getFrontier,joinFrontier,frontierView} from '../../../../server/frontier-service.ts';
import {body,error,response,tokenFrom} from '../../../../server/http.ts';
import {RuleError} from '../../../../engine/types.ts';
type C={params:Promise<{id:string}>};
export async function GET(r:Request,c:C){try{return response(await frontierView(await getFrontier(frontierStore,(await c.params).id),tokenFrom(r)))}catch(e){return error(e)}}
export async function POST(r:Request,c:C){try{const {id}=await c.params,b=await body(r);if(b.type==='join'){const v=await joinFrontier(frontierStore,id,b.name);return response({...await frontierView(v.room,v.token),token:v.token})}if(b.type==='act')return response(await frontierView(await actFrontier(frontierStore,id,tokenFrom(r),b),tokenFrom(r)));throw new RuleError('BAD_ACTION','対応していない操作です')}catch(e){return error(e)}}
