import {compileLocalPreview} from '../../../../../server/code-platform/local-preview.ts';
import {resolveAIConnection,type AIEnvironment} from '../../../../../server/code-platform/ai-providers.ts';
import {compileCode} from '../../../../../server/code-platform/compiler.ts';
import {env} from 'cloudflare:workers';
import {codeStore,draftStore} from '../../../../../server/code-platform/store.ts';
import {saveDraft,generateCodeEdits} from '../../../../../server/code-platform/drafts.ts';
import {ensureDraft} from '../../../../../server/code-platform/creator.ts';
import {sourceOperation} from '../../../../../server/code-platform/sources.ts';
import {prepareRelease} from '../../../../../server/code-platform/releases.ts';
import {codeGitHub,runtimeLoader,capabilities} from '../../../../../server/code-platform/config.ts';
import {requireIdentity} from '../../../../../server/project-auth.ts';
import {codeBody} from '../../../../../server/code-platform/http.ts';
import {response,error} from '../../../../../server/http.ts';
import {RuleError} from '../../../../../engine/types.ts';
export async function GET(r:Request,{params}:{params:Promise<{id:string}>}){try{const u=await requireIdentity(r),{id}=await params;return response(await ensureDraft(codeStore,draftStore,id,u.id))}catch(e){return error(e)}}
export async function POST(r:Request,{params}:{params:Promise<{id:string}>}){try{
 const u=await requireIdentity(r),{id}=await params,c=await codeBody(r),draft=await ensureDraft(codeStore,draftStore,id,u.id);
 if(c.expectedRevision!==draft.revision)throw new RuleError('STALE_STATE','作品が更新されました。再読み込みして確認してください');
 if(c.type==='save')return response({draft:await saveDraft(codeStore,draftStore,id,u.id,c)});
 if(c.type==='local-preview')return response({preview:compileLocalPreview(draft.files)});
 if(c.type==='generate'){
  const config=env as unknown as AIEnvironment,connection=resolveAIConnection(c.ai,config),day=new Date().toISOString().slice(0,10);
  const configured=Number(config.BOARDHUB_AI_DAILY_LIMIT),limit=connection.ownKey?100:Number.isInteger(configured)&&configured>0?Math.min(configured,200):20;
  const used=await env.DB!.prepare('INSERT INTO code_ai_usage(owner,day,count) VALUES(?,?,1) ON CONFLICT(owner,day) DO UPDATE SET count=count+1 WHERE count<? RETURNING count').bind(u.id+(connection.ownKey?':own':':shared'),day,limit).first();if(!used)throw new RuleError('LIMIT','本日のAI利用上限に達しました。試遊・編集・保存は引き続き利用できます');
  if(!connection.ownKey){const globalUsed=await env.DB!.prepare('INSERT INTO code_ai_usage(owner,day,count) VALUES(?,?,1) ON CONFLICT(owner,day) DO UPDATE SET count=count+1 WHERE count<200 RETURNING count').bind('__platform__',day).first();if(!globalUsed)throw new RuleError('LIMIT','本日の無料共通枠の上限に達しました。自分のキーに切り替えるか、時間を置いてお試しください')}
  const result=await generateCodeEdits(draft.files,c.instruction,{connection,history:draft.messages,playtest:c.playtest});if(result.changed.length)compileCode(result.files);
  const next=await saveDraft(codeStore,draftStore,id,u.id,{files:result.files,expectedRevision:draft.revision,summary:result.summary,request:'',messages:[...(draft.messages||[]),{role:'user',content:c.instruction},{role:'assistant',content:result.summary,model:connection.model}]});return response({draft:next,changed:result.changed});
 }
 if(c.type==='preview'){
  if(!runtimeLoader())throw new RuleError('SETUP','オンライン試遊は運営側で接続準備中です。作品の編集は保存されています');
  const p=(await codeStore.getProject(id))!;let sync='';let release;
  if(capabilities().upload||p.repository&&capabilities().github){try{release=(await sourceOperation(codeStore,codeGitHub(),runtimeLoader(),id,u.id,{type:'upload',expectedRevision:p.revision,files:draft.files})).release}catch{sync='作品は保存済みです。GitHubへの同期は完了していません。'}}
  if(!release)release=await prepareRelease(codeStore,runtimeLoader(),id,u.id,draft.files,{kind:'draft',commit:null});
  const {files,modules,ui,...summary}=release;return response({release:summary,sync});
 }
 throw new RuleError('INPUT','制作の操作を選んでください');
}catch(e){return error(e)}}
