'use client';
import {useEffect,useMemo,useRef} from 'react';
import {clientID} from '../../lib/client-id';
import {localPlaytestDocument,type LocalPreview,type PlaytestContext} from '../../lib/local-playtest';
export function LocalPlayer({preview,onContext}:{preview:LocalPreview;onContext:(context:PlaytestContext)=>void}){
 const frame=useRef<HTMLIFrameElement>(null),nonce=useMemo(()=>clientID(),[preview.digest]);
 const src=useMemo(()=>localPlaytestDocument(preview,nonce),[preview,nonce]);
 useEffect(()=>{const receive=(e:MessageEvent)=>{if(e.source!==frame.current?.contentWindow||e.data?.type!=='boardhub-playtest'||e.data.nonce!==nonce)return;const c=e.data.context;if(!c||JSON.stringify(c).length>14000)return;onContext({phase:typeof c.phase==='string'?c.phase.slice(0,30):undefined,turn:Number.isInteger(c.turn)?c.turn:undefined,player:typeof c.player==='string'?c.player.slice(0,10):undefined,view:typeof c.view==='string'?c.view.slice(0,6000):undefined,error:typeof c.error==='string'?c.error.slice(0,500):undefined})};window.addEventListener('message',receive);return()=>window.removeEventListener('message',receive)},[nonce,onContext]);
 return <iframe ref={frame} title={preview.title+'のテストプレイ'} sandbox="allow-scripts" srcDoc={src} style={{width:'100%',height:'100%',minHeight:580,border:0,borderRadius:14,background:'#f3f6fa'}}/>;
}
