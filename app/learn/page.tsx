'use client';
import {useEffect,useState} from 'react';
import {Tutorial,type TutorialGame} from '../../components/tutorial';
export default function Learn(){const [game,setGame]=useState<TutorialGame|null>(null);useEffect(()=>{const id=new URLSearchParams(location.search).get('game');if(id==='isleworks'||id==='frontier'){location.replace('/frontier?guide=1');return}setGame(['kalah','isleworks','auction','dice','count'].includes(id||'')?id as TutorialGame:'kalah')},[]);return <main className="docs"><a href="/">← Tableに戻る</a><h1>見て、触って、覚える。</h1>{game&&<Tutorial game={game} onClose={()=>location.assign('/')} onPlay={()=>location.assign(game==='isleworks'?'/isleworks':game==='kalah'?'/':'/playground/index.html')}/>}</main>}
