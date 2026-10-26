import {communityStore} from '../../../../server/community-store.ts';
import {getCommunity,joinCommunity,actCommunity} from '../../../../server/community-service.ts';
import {body,error,response,view,tokenFrom} from '../../../../server/http.ts';
export async function GET(r:Request,{params}:{params:Promise<{id:string}>}){try{return response(await view(await getCommunity(communityStore,(await params).id),tokenFrom(r)))}catch(e){return error(e)}}
export async function POST(r:Request,{params}:{params:Promise<{id:string}>}){try{const b=await body(r),id=(await params).id;if(b.type==='join'){const v=await joinCommunity(communityStore,id,b.name);return response({...await view(v.room,v.token),token:v.token})}return response(await view(await actCommunity(communityStore,id,tokenFrom(r),b),tokenFrom(r)))}catch(e){return error(e)}}
