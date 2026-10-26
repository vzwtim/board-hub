import {currentAccount} from '../../../server/account-store.ts';
import { createRoom } from '../../../server/service.ts';
import { store } from '../../../server/d1.ts';
import { body,error,response,view } from '../../../server/http.ts';
export async function POST(request:Request){try{const account=await currentAccount(request);const b=await body(request);const result=await createRoom(store,b?.name,account?'/api/avatars/'+account.id:'');return response({...await view(result.room,result.token),token:result.token},201)}catch(e){return error(e)}}
