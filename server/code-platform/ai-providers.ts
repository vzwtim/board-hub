import {RuleError} from '../../engine/types.ts';
export const AI_PROVIDERS={
 openrouter:{name:'OpenRouter',endpoint:'https://openrouter.ai/api/v1/chat/completions',keyName:'OPENROUTER_API_KEY',defaultModel:'openrouter/free',keyURL:'https://openrouter.ai/settings/keys'},
 groq:{name:'Groq',endpoint:'https://api.groq.com/openai/v1/chat/completions',keyName:'GROQ_API_KEY',defaultModel:'openai/gpt-oss-120b',keyURL:'https://console.groq.com/keys'},
 gemini:{name:'Google Gemini',endpoint:'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',keyName:'GEMINI_API_KEY',defaultModel:'',keyURL:'https://aistudio.google.com/apikey'},
 openai:{name:'OpenAI',endpoint:'https://api.openai.com/v1/chat/completions',keyName:'OPENAI_API_KEY',defaultModel:'gpt-4.1-mini',keyURL:'https://platform.openai.com/api-keys'},
} as const;
export type AIProvider=keyof typeof AI_PROVIDERS;
export type AIEnvironment=Partial<Record<typeof AI_PROVIDERS[AIProvider]['keyName'],string>>&{OPENAI_MODEL?:string;BOARDHUB_AI_DAILY_LIMIT?:string};
export interface AIChoice{provider?:unknown;model?:unknown;key?:unknown;source?:unknown}
export interface AIConnection{provider:AIProvider;key:string;model:string;endpoint:string;freeOnly:boolean;ownKey:boolean}
export function resolveAIConnection(choice:AIChoice|undefined,env:AIEnvironment):AIConnection{
 const provider=choice?.provider||'openrouter';if(typeof provider!=='string'||!Object.hasOwn(AI_PROVIDERS,provider))throw new RuleError('INPUT','AIサービスを選んでください');
 const id=provider as AIProvider,p=AI_PROVIDERS[id],ownKey=choice?.source==='own';
 const key=ownKey?choice?.key:env[p.keyName],model=typeof choice?.model==='string'&&choice.model.trim()?choice.model.trim():(id==='openai'?env.OPENAI_MODEL||p.defaultModel:p.defaultModel);
 if(typeof key!=='string'||!key.trim())throw new RuleError('SETUP',ownKey?'APIキーを入力してください':'このAIは運営キーが未接続です。「自分のAPIキー」で接続できます');
 if(key.length>512||/[\r\n]/.test(key)||!model||model.length>160||!/^[a-zA-Z0-9_./:@-]+$/.test(model))throw new RuleError('INPUT','APIキーとモデルIDを確認してください');
 // Shared access is strictly zero-price OpenRouter. Other providers can use
 // the author's own contract; no automatic cross-provider or paid fallback.
 if(!ownKey&&(id!=='openrouter'||model!=='openrouter/free'&&!model.endsWith(':free')))throw new RuleError('INPUT','運営の共通枠はOpenRouterの無料モデルのみ利用できます。有料モデルは自分のキーを接続してください');
 return {provider:id,key:key.trim(),model,endpoint:p.endpoint,freeOnly:id==='openrouter'&&(model==='openrouter/free'||model.endsWith(':free')),ownKey};
}
export interface AIModel{id:string;name:string;context:number}
let cached:{expires:number;models:AIModel[]}|undefined;
export async function freeAIModels(request:typeof fetch=fetch):Promise<AIModel[]>{
 if(cached&&cached.expires>Date.now())return cached.models;
 try{const r=await request('https://openrouter.ai/api/v1/models',{signal:AbortSignal.timeout(8000)});if(!r.ok)throw Error();const value=await r.json() as {data?:{id:string;name:string;context_length:number;pricing?:{prompt?:string;completion?:string}}[]};
 const models=(value.data||[]).filter(m=>typeof m.id==='string'&&m.id.endsWith(':free')&&Number(m.pricing?.prompt)===0&&Number(m.pricing?.completion)===0&&m.context_length>=65536).sort((a,b)=>Number(/qwen|coder|deepseek/i.test(b.name))-Number(/qwen|coder|deepseek/i.test(a.name))).slice(0,12).map(m=>({id:m.id,name:m.name,context:m.context_length}));
 cached={expires:Date.now()+3600000,models};return models;
 }catch{return []}
}
export function providerAvailability(env:AIEnvironment){return Object.entries(AI_PROVIDERS).map(([id,p])=>({id,name:p.name,keyURL:p.keyURL,defaultModel:p.defaultModel,shared:id==='openrouter'&&!!env.OPENROUTER_API_KEY}))}
export async function chatCompletion(connection:AIConnection,messages:{role:string;content:string}[],request:typeof fetch=fetch){
 const body={model:connection.model,messages,response_format:{type:'json_object'},...(['openai','groq'].includes(connection.provider)?{max_completion_tokens:8000}:{max_tokens:8000}),...(connection.freeOnly?{provider:{max_price:{prompt:0,completion:0},allow_fallbacks:false}}:{})};
 let r:Response;
 try{r=await request(connection.endpoint,{method:'POST',cache:'no-store',redirect:'manual',headers:{Authorization:'Bearer '+connection.key,'Content-Type':'application/json'},signal:AbortSignal.timeout(60000),body:JSON.stringify(body)})}
 catch(e){
  const timeout=e instanceof Error&&['TimeoutError','AbortError'].includes(e.name);
  // Exception text can contain request headers; log only a fixed category.
  const detail=e instanceof Error?e.message.split(connection.key).join('[redacted]').replace(/Bearer\s+\S+/gi,'Bearer [redacted]').slice(0,300):'Unknown transport error';
  console.error('BoardHub AI transport failed',{provider:connection.provider,model:connection.model,category:timeout?'timeout':'network',detail});
  throw new RuleError(timeout?'AI_TIMEOUT':'AI_NETWORK',timeout?'AIの応答が時間内に届きませんでした。別のモデルを選ぶか、時間を置いて再試行してください':'AIへの通信に失敗しました。時間を置くか、別の接続先を選んでください');
 }
 if(!r.ok){console.error('BoardHub AI upstream rejected',{provider:connection.provider,model:connection.model,status:r.status});throw new RuleError('AI_UPSTREAM',r.status===429?'AIの利用上限に達しました。時間を置くか、別のモデル・接続先を選んでください':r.status===401||r.status===403?'APIキー・モデルの利用権限を確認してください':'AIに接続できませんでした。別のモデルを選べます。下書きと試遊は保持しています')}

 const value=await r.json() as {choices?:{message?:{content?:string}}[]};const content=value.choices?.[0]?.message?.content;if(typeof content!=='string'||content.length>250000)throw new RuleError('AI_INVALID','AIの応答を読み取れませんでした');return content.replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'');
}
