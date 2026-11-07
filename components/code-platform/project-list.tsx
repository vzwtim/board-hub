'use client';
import {useEffect,useState} from 'react';
import {projectRequest,type ListResult} from '../../lib/projects';
import type {CodeProject} from '../../server/code-platform/model.ts';

export function CodeProjectList() {
  const [projects,setProjects]=useState<CodeProject[]|null>(null);
  const [legacy,setLegacy]=useState<ListResult|null>(null);
  const [creating,setCreating]=useState(false);
  const [title,setTitle]=useState('');
  const [error,setError]=useState('');
  const [legacyError,setLegacyError]=useState('');
  const [busy,setBusy]=useState(false);

  useEffect(()=>{
    void projectRequest<{projects:CodeProject[]}>('/api/code-projects').then(v=>setProjects(v.projects)).catch(e=>setError(e.message));
    void projectRequest<ListResult>('/api/projects?scope=mine').then(setLegacy).catch(e=>setLegacyError(e.message));
  },[]);

  async function start(event:React.FormEvent) {
    event.preventDefault();
    if(busy||!title.trim())return;
    setBusy(true);
    setError('');
    try {
      const project=await projectRequest<CodeProject>('/api/code-projects',{title});
      location.assign('/studio/code/'+project.id);
    } catch(e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  async function moreLegacy() {
    if(!legacy||legacy.next==null||busy)return;
    setBusy(true);
    try {
      const next=await projectRequest<ListResult>('/api/projects?scope=mine&offset='+legacy.next);
      setLegacy({...next,projects:[...legacy.projects,...next.projects]});
    } catch(e) {
      setLegacyError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return <>
    <section className="panel">
      <div className="sectionhead">
        <h2>自分の作品</h2>
        <button className="primary" disabled={busy} aria-expanded={creating} onClick={()=>setCreating(!creating)}>{creating?'閉じる':'＋ 新しいゲームを作る'}</button>
      </div>
      {creating&&<form onSubmit={start}>
        <p>「島の工房」をひな形にして、すぐ試遊できます。</p>
        <label>作品名<input value={title} maxLength={60} disabled={busy} onChange={e=>setTitle(e.target.value)} required/></label>
        <button className="primary" type="submit" disabled={busy||!title.trim()}>{busy?'準備中…':'試遊しながら作る'}</button>
      </form>}
      {error&&<p role="alert">{error}</p>}
      {projects===null&&!error&&<p role="status">作品を読み込んでいます…</p>}
      {projects?.length===0&&!creating&&<p>新しいゲームを作ると、ここから制作を再開できます。</p>}
      {projects?.map(project=><p key={project.id}><a href={'/studio/code/'+project.id}>{project.title} →</a></p>)}
    </section>
    {(!!legacy?.projects.length||legacyError)&&<details className="panel">
      <summary>以前の作品</summary>
      <p>作品を開き、「試遊しながら編集」で選んだ版を新しい制作画面へコピーできます。</p>
      {legacy?.projects.map(project=><p key={project.id}><a href={'/studio/'+project.id}>{project.spec.title} →</a></p>)}
      {legacy?.next!=null&&<button disabled={busy} onClick={()=>void moreLegacy()}>さらに表示</button>}
      {legacyError&&<p role="alert">{legacyError}</p>}
    </details>}
  </>;
}

export function PublishedCodeGames(){const [projects,setProjects]=useState<{id:string;title:string;author:string}[]>([]);useEffect(()=>{projectRequest<{projects:typeof projects}>('/api/code-projects?scope=community').then(v=>setProjects(v.projects)).catch(()=>{})},[]);if(!projects.length)return null;return <section className="panel"><h2>みんなのコード作品</h2>{projects.map(p=><p key={p.id}><a href={'/code-games/'+p.id}>{p.title}</a><span className="muted"> · {p.author}</span></p>)}</section>}
