'use client';
import {useEffect,useRef,useState} from 'react';
import {projectRequest} from '../../lib/projects';
import type {CodeProject,CodeRelease,SourceFiles} from '../../server/code-platform/model.ts';
import type {CodeDraft} from '../../server/code-platform/drafts.ts';
import {CodePlayer} from './player';
import {AdvancedCodeWorkspace} from './workspace';
import styles from './creator.module.css';
type Release=Omit<CodeRelease,'files'|'modules'|'ui'>;
interface ProjectData{project:CodeProject;releases:Release[];capabilities:{ai:boolean;runtime:boolean}}
const prompts=['海を渡る船を追加したい','短時間で決着するルールにしたい','初心者向けに操作を分かりやすくしたい'];
const editable=(p:string)=>p==='game.ts'||p==='ui.html'||p==='manifest.json'||p.startsWith('games/')||p.startsWith('assets/');
export function CodeCreator({id}:{id:string}){
 const [data,setData]=useState<ProjectData|null>(null),[draft,setDraft]=useState<CodeDraft|null>(null),[files,setFiles]=useState<SourceFiles>({}),[instruction,setInstruction]=useState(''),[busy,setBusy]=useState(false),[dirty,setDirty]=useState(false),[saveState,setSaveState]=useState('読み込み中'),[error,setError]=useState(''),[notice,setNotice]=useState(''),[selected,setSelected]=useState('game.ts'),[preview,setPreview]=useState(''),[advanced,setAdvanced]=useState(false),[undo,setUndo]=useState<SourceFiles|null>(null);
 const draftRef=useRef<CodeDraft|null>(null),filesRef=useRef<SourceFiles>({}),requestRef=useRef(''),dirtyRef=useRef(false),edits=useRef(0),saving=useRef<Promise<CodeDraft>|null>(null),previewSource=useRef<string|null>(null);
 useEffect(()=>{let active=true;Promise.all([projectRequest<ProjectData>('/api/code-projects/'+id),projectRequest<CodeDraft>('/api/code-projects/'+id+'/draft')]).then(([p,d])=>{if(!active)return;setData(p);setDraft(d);draftRef.current=d;setFiles(d.files);filesRef.current=d.files;setInstruction(d.request||'');requestRef.current=d.request||'';setSaveState('保存済み')}).catch(e=>setError(e.message));return()=>{active=false}},[id]);
 async function refresh(){setData(await projectRequest<ProjectData>('/api/code-projects/'+id))}
 function changed(){edits.current++;dirtyRef.current=true;setDirty(true);setSaveState('未保存')}
 function updateFiles(next:SourceFiles){filesRef.current=next;setFiles(next);changed()}
 function updateRequest(value:string){requestRef.current=value;setInstruction(value);changed()}
 async function flush():Promise<CodeDraft>{
  if(saving.current)await saving.current;
  if(!draftRef.current)throw Error('作品を読み込み中です');if(!dirtyRef.current)return draftRef.current;
  const count=edits.current,snapshot=filesRef.current,revision=draftRef.current.revision,request=requestRef.current;setSaveState('保存中…');
  const job=projectRequest<{draft:CodeDraft}>('/api/code-projects/'+id+'/draft',{type:'save',files:snapshot,request,expectedRevision:revision}).then(v=>{draftRef.current=v.draft;setDraft(v.draft);setError('');if(edits.current===count){dirtyRef.current=false;setDirty(false);setSaveState('保存済み')}else setSaveState('未保存');return v.draft}).catch(e=>{setSaveState('保存に失敗しました');setError(e.message);throw e});
  saving.current=job;try{return await job}finally{if(saving.current===job)saving.current=null}
 }
 useEffect(()=>{if(!dirty||busy)return;const timer=setTimeout(()=>{void flush().catch(()=>{})},1200);return()=>clearTimeout(timer)},[files,instruction,dirty,busy]);
 useEffect(()=>{const warn=(e:BeforeUnloadEvent)=>{if(dirtyRef.current){e.preventDefault();e.returnValue=''}};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn)},[]);
 async function perform(type:'generate'|'preview'){
  if(busy)return;setBusy(true);setError('');setNotice('');
  try{const current=await flush();const result=await projectRequest<{draft?:CodeDraft;changed?:string[];release?:Release;sync?:string}>('/api/code-projects/'+id+'/draft',{type,instruction:requestRef.current,expectedRevision:current.revision});
   if(result.draft){setUndo(current.files);draftRef.current=result.draft;setDraft(result.draft);filesRef.current=result.draft.files;setFiles(result.draft.files);dirtyRef.current=false;setDirty(false);setSaveState('保存済み');setNotice(result.draft.summary);if(result.changed?.length)setSelected(result.changed[0])}
   if(result.release){await refresh();if(result.release.status==='ready'){const url=new URL(location.href);url.searchParams.delete('room');history.replaceState(null,'',url);previewSource.current=JSON.stringify(current.files);setPreview(result.release.id);setNotice(result.sync||'試遊版を用意しました。遊んで確認してから公開できます。')}else setError(result.release.error)}
  }catch(e){setError((e as Error).message)}finally{setBusy(false)}
 }
 if(!data||!draft)return <section className="panel"><h1>制作の準備をしています</h1><p role="status">{error||'元になるゲームを用意しています…'}</p><a href="/studio/code">作品一覧へ</a></section>;
 const activeRelease=data.releases.find(r=>r.id===preview),outdated=previewSource.current!==null&&previewSource.current!==JSON.stringify(files);
 async function publish(){if(!preview||busy||outdated)return;setBusy(true);setError('');try{await flush();await projectRequest('/api/code-projects/'+id+'/publish',{release:preview,listed:true,expectedRevision:data!.project.revision});await refresh();setNotice('公開しました。作品一覧から遊べます。開始済みの対戦は元の版で続きます。')}catch(e){setError((e as Error).message)}finally{setBusy(false)}}
 return <div className={styles.creator}><header className={styles.header}><div><a href="/studio/code">‹ 自分の作品</a><h1>{data.project.title}</h1><span className={styles.save} role="status">{saveState}</span></div><button disabled={!dirty||busy} onClick={()=>void flush().catch(()=>{})}>今すぐ保存</button></header>
 <nav className={styles.steps} aria-label="制作の流れ"><span>1 相談・編集</span><span>2 試してみる</span><span>3 公開</span></nav>
 {error&&<div className="error" role="alert">{error}<p className="fine">未保存の編集はこの画面に残しています。</p></div>}{notice&&<div className="workspace-notice" role="status">{notice}</div>}
 <div className={styles.layout}><section className={styles.assistant}><div className="panel"><span className="eyebrow muted">一緒につくる</span><h2>どんなゲームに変えたい？</h2><p>元になるゲームは用意済み。変えたいルールや画面を、そのまま言葉にしてください。</p><label htmlFor="creator-request">変更の依頼</label><textarea id="creator-request" value={instruction} disabled={busy} maxLength={4000} placeholder="例：船で海を渡って、まだ見えていない島を探索したい。" onChange={e=>updateRequest(e.target.value)}/><div className={styles.suggestions}>{prompts.map(text=><button key={text} disabled={busy} onClick={()=>updateRequest(text)}>{text}</button>)}</div><button className="primary full" disabled={busy||!instruction.trim()||!data.capabilities.ai} onClick={()=>perform('generate')}>{busy?'作品を準備しています…':'変更を依頼する'}</button>{!data.capabilities.ai&&<p className={styles.note}>制作アシスタントは接続準備中です。依頼文の保存と、下のコード編集は利用できます。</p>}<p className="fine">依頼とゲームのコードを制作AIに送信し、変更案を下書きに保存します。公開中のゲームは、あなたが公開するまで変わりません。</p>{undo&&<button disabled={busy} onClick={()=>{updateFiles(undo);setUndo(null);setNotice('直前のAI変更を戻しました。')}}>直前のAI変更を戻す</button>}{draft.summary&&<p className={styles.summary}>{draft.summary}</p>}</div>
 <details className="panel"><summary>コードを自分で編集</summary><p className="fine">ルールも画面もこの中で編集・保存できます。</p><label>編集するファイル<select value={selected in files?selected:'game.ts'} disabled={busy} onChange={e=>setSelected(e.target.value)}>{Object.keys(files).filter(editable).sort().map(p=><option key={p}>{p}</option>)}</select></label><textarea className={styles.code} aria-label="ゲームのコード" value={files[selected]||''} spellCheck={false} disabled={busy} onChange={e=>updateFiles({...filesRef.current,[selected]:e.target.value})}/></details>
 </section><section className={styles.play}><div className={styles.playHeader}><div><h2>つくったゲームを試す</h2><p>変更を試して、よければ公開。</p></div><div className="proposal-actions"><button className="primary" disabled={busy||!data.capabilities.runtime} onClick={()=>perform('preview')}>試してみる</button><button disabled={busy||!preview||outdated||activeRelease?.status!=='ready'} onClick={publish}>表示中の版を公開する</button></div></div>{outdated&&<p role="status">編集後のコードはまだ試遊版になっていません。「試してみる」で更新してください。</p>}{!data.capabilities.runtime&&<p className={styles.note}>オンライン試遊は運営側で接続準備中です。編集内容は自動保存できるので、そのまま制作を進められます。</p>}
 {preview?<CodePlayer key={preview} id={id} release={preview} embedded/>:<div className={styles.empty}><div className={styles.island} aria-hidden="true">⬡</div><h3>あなたのルールが、ここで動く。</h3><p>島の工房から制作を始めています。変更後に「試してみる」を押すと、この場所で遊べます。</p><a className="button" href="/frontier" target="_blank" rel="noreferrer">元のゲームを遊んでみる ↗</a></div>}
 {data.releases.some(r=>r.status==='ready')&&<label className={styles.history}>以前の試遊版<select value={preview} onChange={e=>{previewSource.current=null;setPreview(e.target.value)}}><option value="">版を選ぶ</option>{data.releases.filter(r=>r.status==='ready').map(r=><option key={r.id} value={r.id}>{r.title} · {new Date(r.createdAt).toLocaleString('ja-JP')}{data.project.published===r.id?' · 公開中':''}</option>)}</select></label>}{data.project.published&&<a href={'/code-games/'+id}>公開中の作品を開く ↗</a>}
 </section></div>
 <footer className={styles.advanced}><button onClick={()=>setAdvanced(!advanced)} aria-expanded={advanced}>{advanced?'詳細設定を閉じる':'GitHub接続・ファイル取り込みなどの詳細設定'}</button>{advanced&&<AdvancedCodeWorkspace id={id}/>}</footer></div>;
}
