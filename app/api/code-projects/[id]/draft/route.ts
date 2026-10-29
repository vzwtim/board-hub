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
 if(c.type==='generate'){
  const config=env as unknown as {OPENAI_API_KEY?:string;OPENAI_MODEL?:string};if(!config.OPENAI_API_KEY)throw new RuleError('SETUP','制作アシスタントは接続準備中です。コードの編集と保存は利用できます');
  const day=new Date().toISOString().slice(0,10);const used=await env.DB!.prepare('INSERT INTO code_ai_usage(owner,day,count) VALUES(?,?,1) ON CONFLICT(owner,day) DO UPDATE SET count=count+1 WHERE count<5 RETURNING count').bind(u.id,day).first();if(!used)throw new RuleError('LIMIT','本日の制作アシスタント利用は5回までです。編集・保存・試遊は引き続き利用できます');
  const globalUsed=await env.DB!.prepare('INSERT INTO code_ai_usage(owner,day,count) VALUES(?,?,1) ON CONFLICT(owner,day) DO UPDATE SET count=count+1 WHERE count<20 RETURNING count').bind('__platform__',day).first();if(!globalUsed)throw new RuleError('LIMIT','本日の制作アシスタントの受付上限に達しました。編集内容は保存できます');
  const result=await generateCodeEdits(draft.files,c.instruction,{key:config.OPENAI_API_KEY,model:config.OPENAI_MODEL});compileCode(result.files);const next=await saveDraft(codeStore,draftStore,id,u.id,{files:result.files,expectedRevision:draft.revision,summary:result.summary});return response({draft:next,changed:result.changed});
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
