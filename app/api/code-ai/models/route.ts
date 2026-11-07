import {env} from 'cloudflare:workers';
import {freeAIModels,providerAvailability,resolveAIConnection,type AIEnvironment} from '../../../../server/code-platform/ai-providers.ts';
import {codeBody} from '../../../../server/code-platform/http.ts';
import {RuleError} from '../../../../engine/types.ts';
import {requireIdentity} from '../../../../server/project-auth.ts';
import {response,error} from '../../../../server/http.ts';
export async function GET(r:Request){try{await requireIdentity(r);return response({providers:providerAvailability(env as unknown as AIEnvironment),models:[{id:'openrouter/free',name:'無料モデルを自動選択',context:0},...await freeAIModels()]})}catch(e){return error(e)}}
export async function POST(r:Request){try{await requireIdentity(r);const c=await codeBody(r),connection=resolveAIConnection({provider:c.provider,key:c.key,source:'own',model:'list'},{}),endpoint=connection.endpoint.replace(/chat\/completions$/,'models');const result=await fetch(endpoint,{headers:{Authorization:'Bearer '+connection.key},redirect:'manual',signal:AbortSignal.timeout(10000)});if(!result.ok)throw new RuleError('AI_UPSTREAM','モデル一覧を取得できませんでした。APIキーと利用権限を確認してください');const value=await result.json() as {data?:{id?:string}[]};return response({models:(value.data||[]).map(m=>m.id).filter((id):id is string=>typeof id==='string'&&id.length<160).slice(0,150)})}catch(e){return error(e)}}
