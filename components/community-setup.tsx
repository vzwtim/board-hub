'use client';
import type {Spec} from '../games/community/index.ts';
import type {GameInfo} from '../lib/game-catalog';
import {GameSetup} from './game-setup';
import {SpecArt} from './project-card';
export function CommunitySetup({id,version,spec,showSummary=true}:{id:string;version:string;spec:Spec;showSummary?:boolean}){
 const href='/play/'+id+'?ref='+encodeURIComponent(version);
 const game:GameInfo={id:'project:'+id,title:spec.title,subtitle:'',genre:'みんなの作品',minutes:'オリジナルルール',players:'2人',difficulty:'',description:spec.description,href,cpu:href+'&mode=cpu',invite:href+'&mode=invite',learn:href+'&guide=1',tags:[],preview:''};
 return <GameSetup game={game} embedded art={<SpecArt spec={spec}/>} showSummary={showSummary}/>;
}
