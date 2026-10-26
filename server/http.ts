import { RuleError } from '../engine/types.ts';
import { playerFor, type Room } from './service.ts';
const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
export const response=(body:unknown,status=200)=>Response.json(body,{status,headers});
export async function body(request:Request){const origin=request.headers.get('origin');if(origin&&origin!==new URL(request.url).origin)throw new RuleError('ORIGIN','別サイトからの操作は許可されていません');const text=await request.text();if(text.length>4096)throw new RuleError('BODY_SIZE','送信データが大きすぎます');try{return JSON.parse(text)}catch{throw new RuleError('JSON','JSONが不正です')}}
export const tokenFrom=(request:Request)=>request.headers.get('authorization')?.replace(/^Bearer /,'')||'';
export async function view<G,A>(room:Room<G,A>,token:string){const playerID=await playerFor(room,token);return {id:room.id,state:room.state,playerID,updatedAt:room.updatedAt}}
export function error(e:unknown){if(e instanceof RuleError){const status=e.code==='SETUP'?503:e.code==='NOT_FOUND'?404:e.code==='UNAUTHORIZED'?401:['STALE_STATE','CONFLICT','ROOM_FULL','ACTION_ID_REUSED'].includes(e.code)?409:400;return response({error:e.message,code:e.code},status)}console.error('Room API failed',e);return response({error:'接続処理に失敗しました。少し待って再試行してください',code:'SERVER_ERROR'},500)}
