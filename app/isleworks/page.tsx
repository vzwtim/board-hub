'use client';
import {useEffect,useState} from 'react';
import {prepareGuestTab} from '../../lib/guest-tab';
import LegacyRoom from '../../components/legacy-isle-room';
export default function Page(){const [legacy,setLegacy]=useState(false);useEffect(()=>{const q=new URLSearchParams(location.search);if(q.has('room'))void prepareGuestTab().then(()=>setLegacy(true)).catch(()=>location.replace('/frontier'));else location.replace('/frontier'+(q.toString()?'?'+q.toString():''))},[]);return legacy?<LegacyRoom/>:<main className="docs"><h1>島の工房</h1><p>盤面を開いています…</p></main>}
