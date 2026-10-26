import {currentAccount} from '../../../server/account-store.ts';
import {communityStore} from '../../../server/community-store.ts';
import {projectStore} from '../../../server/project-store.ts';
import {createCommunity} from '../../../server/community-service.ts';
import {body,error,response,view} from '../../../server/http.ts';
export async function POST(r:Request){try{const account=await currentAccount(r);const b=await body(r);if(typeof b.project!=='string'||typeof b.ref!=='string')throw Error('作品を選んでください');const v=await createCommunity(communityStore,projectStore,b.name,b.project,b.ref,account?'/api/avatars/'+account.id:'');return response({...await view(v.room,v.token),token:v.token},201)}catch(e){return error(e)}}
