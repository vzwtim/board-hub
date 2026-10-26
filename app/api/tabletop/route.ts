import {tabletopStore} from '../../../server/tabletop-store.ts';
import {createTabletop,tabletopView} from '../../../server/tabletop-service.ts';
import {body,error,response} from '../../../server/http.ts';
export async function POST(r:Request){try{const b=await body(r),v=await createTabletop(tabletopStore,b.name,b.game,b.players);return response({...await tabletopView(v.room,v.token),token:v.token},201)}catch(e){return error(e)}}
