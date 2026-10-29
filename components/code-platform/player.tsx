'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
import {codeFrameDocument} from '../../lib/code-frame.ts';
import {projectRequest} from '../../lib/projects';
interface ReleaseView {project:{id:string;title:string;author:string};release:string;digest:string;ui:string;metadata:{id:string;version:string;minPlayers:number;maxPlayers:number}}
export function CodePlayer({id,release,embedded=false}:{id:string;release:string;embedded?:boolean}){
 const [data,setData]=useState<ReleaseView|null>(null),[error,setError]=useState(''),[room,setRoom]=useState('');const iframe=useRef<HTMLIFrameElement>(null);const nonce=useMemo(()=>globalThis.crypto?.randomUUID?.()||'loading',[]);
 useEffect(()=>{setRoom(new URLSearchParams(location.search).get('room')||'');projectRequest<ReleaseView>('/api/code-projects/'+id+'/releases/'+release).then(setData).catch(e=>setError(e.message))},[id,release]);
 useEffect(()=>{if(!data)return;const channels:MessagePort[]=[];
 const listener=(event:MessageEvent)=>{
  if(event.source!==iframe.current?.contentWindow||event.data?.type!=='boardhub-ready'||event.data.nonce!==nonce)return;
  const channel=new MessageChannel();channels.push(channel.port1);let outstanding=0;
  channel.port1.onmessage=async(message)=>{
   const c=message.data;if(!c||!Number.isSafeInteger(c.id)||typeof c.path!=='string'||c.path.length>160||!['GET','POST'].includes(c.method)||outstanding>=3)return;
   outstanding++;try{
    let value:any,status=200;
    if(c.path==='/api/release'&&c.method==='GET')value={release:data.digest,title:data.project.title,gameID:data.metadata.id,gameVersion:data.metadata.version,minPlayers:data.metadata.minPlayers,maxPlayers:data.metadata.maxPlayers};
    else {
     let path:string;const match=c.path.match(/^\/api\/rooms\/([a-f0-9-]{36})$/);const creating=c.path==='/api/rooms'&&c.method==='POST';if(!creating&&!match)throw Error('この操作は許可されていません');
     if(c.body!==undefined&&JSON.stringify(c.body).length>32768)throw Error('操作が大きすぎます');
     path=creating?'/api/code-projects/'+id+'/rooms':'/api/code-rooms/'+match![1]+'?release='+encodeURIComponent(release);
     const key='boardhub-code-seat:'+release+':'+(match?.[1]||'');const token=creating?'':sessionStorage.getItem(key)||'';
     const response=await fetch(path,{method:c.method,headers:{...(c.method==='POST'?{'Content-Type':'application/json'}:{}),...(token?{Authorization:'Bearer '+token}:{})},body:c.method==='POST'?JSON.stringify({...c.body,release}):undefined});
     status=response.status;value=await response.json();if(response.ok){if(value.release!==release||value.project!==id)throw Error('対戦の版が一致しません');if(value.token){sessionStorage.setItem('boardhub-code-seat:'+release+':'+value.id,value.token);delete value.token}if(value.id){setRoom(value.id);const url=new URL(location.href);url.searchParams.set('room',value.id);history.replaceState(null,'',url)}}
    }
    channel.port1.postMessage({id:c.id,status,value});
   }catch(e){channel.port1.postMessage({id:c.id,status:400,value:{error:(e as Error).message}})}finally{outstanding--}
  };
  iframe.current?.contentWindow?.postMessage({type:'boardhub-connect',nonce},'*',[channel.port2]);
 };window.addEventListener('message',listener);return()=>{window.removeEventListener('message',listener);channels.forEach(p=>p.close())};
 },[data,id,release,nonce]);
 const srcDoc=useMemo(()=>{if(!data)return '';const initialRoom=typeof location==='undefined'?'':new URLSearchParams(location.search).get('room')||'';
 return codeFrameDocument(data.ui,nonce,initialRoom);
 },[data,nonce]);
 return <section><div className="panel"><h2>{data?.project.title||'コード作品の試遊'}</h2><p className="small muted">{data?'作者 '+data.project.author+' · 固定版 '+data.digest.slice(0,12):'読み込み中…'}</p><button disabled={!room} onClick={async()=>{try{const url=new URL('/code-games/'+id,location.origin);url.searchParams.set('ref',release);url.searchParams.set('room',room);await navigator.clipboard.writeText(url.href);setError('招待URLをコピーしました')}catch{setError('ブラウザのURL欄からコピーしてください')}}}>この対戦の招待URLをコピー</button><p className="fine">ゲームのコードは、本体のログイン情報を持たない隔離環境で動きます。</p></div>{error&&<p role="status">{error}</p>}{data&&<iframe ref={iframe} title={data.project.title+' の試遊'} sandbox="allow-scripts" srcDoc={srcDoc} style={{width:'100%',height:embedded?'78vh':1250,minHeight:embedded?560:undefined,border:'1px solid #dce4ec',borderRadius:16}}/>}</section>;
}
