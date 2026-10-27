import {createStore} from '../../../../../server/d1.ts';
import {nextGame} from '../../../../../server/next-game.ts';
import {roomParticipant} from '../../../../../server/room-participant.ts';
import {body,error,response,tokenFrom} from '../../../../../server/http.ts';
import type {Seat} from '../../../../../games/frontier/index.ts';
export async function POST(request:Request,ctx:{params:Promise<{id:string}>}){try{const {id}=await ctx.params,b=await body(request),identity=await roomParticipant(request);return response({nextGame:await nextGame(createStore<unknown,unknown,Seat>(),id,tokenFrom(request),identity,b.game)})}catch(e){return error(e)}}
