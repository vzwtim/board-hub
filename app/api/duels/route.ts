import {duelStore} from '../../../server/duel-store.ts';
import {createDuel} from '../../../server/duel-service.ts';
import {body,error,response,view} from '../../../server/http.ts';
export async function POST(r:Request){try{const b=await body(r),v=await createDuel(duelStore,b.name,b.game);return response({...await view(v.room,v.token),token:v.token},201)}catch(e){return error(e)}}
