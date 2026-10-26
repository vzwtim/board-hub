import {currentAccount} from '../../../server/account-store.ts';
import {tabletopStore} from '../../../server/tabletop-store.ts';
import {createTabletop,tabletopView} from '../../../server/tabletop-service.ts';
import {body,error,response} from '../../../server/http.ts';
export async function POST(r:Request){try{const account=await currentAccount(r);const b=await body(r),v=await createTabletop(tabletopStore,b.name,b.game,b.players,account?'/api/avatars/'+account.id:'');return response({...await tabletopView(v.room,v.token),token:v.token},201)}catch(e){return error(e)}}
