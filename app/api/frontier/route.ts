import {frontierStore} from '../../../server/frontier-store.ts';
import {createFrontier,frontierView} from '../../../server/frontier-service.ts';
import {body,error,response} from '../../../server/http.ts';
export async function POST(r:Request){try{const b=await body(r),v=await createFrontier(frontierStore,b.name,b.players??4);return response({...await frontierView(v.room,v.token),token:v.token},201)}catch(e){return error(e)}}
