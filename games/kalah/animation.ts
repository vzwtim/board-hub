import type { KalahBoard } from './index.ts';
import type { PlayerID } from '../../engine/types.ts';
export type MotionKind='pickup'|'sow'|'capture'|'sweep';
export interface MotionFrame {kind:MotionKind;pits:number[];from:number[];to:number;count:number;held:number;message:string}
/** Presentation-only trace. Tests require its final board to equal the trusted reducer. */
export function traceMove(board:KalahBoard,player:PlayerID,pit:number):MotionFrame[]{
 const pits=[...board.pits],store=player==='0'?6:13,skip=player==='0'?13:6,own=player==='0'?[0,1,2,3,4,5]:[7,8,9,10,11,12];
 const frames:MotionFrame[]=[];let stones=pits[pit],pos=pit;pits[pit]=0;
 const add=(kind:MotionKind,from:number[],to:number,count:number,held:number,message:string)=>frames.push({kind,pits:[...pits],from,to,count,held,message});
 add('pickup',[pit],pit,stones,stones,`穴${player==='0'?pit+1:pit-6}から${stones}個の石を拾う`);
 while(stones>0){pos=(pos+1)%14;if(pos===skip)continue;pits[pos]++;stones--;add('sow',[pit],pos,1,stones,pos===store?'自分のストアに1個':'反時計回りに、1個ずつまく')}
 if(own.includes(pos)&&pits[pos]===1&&pits[12-pos]>0){const count=pits[12-pos]+1;pits[store]+=count;pits[pos]=0;pits[12-pos]=0;add('capture',[pos,12-pos],store,count,0,`向かいの石と合わせて${count}個を捕獲！`)}
 if([0,1,2,3,4,5].every(i=>pits[i]===0)||[7,8,9,10,11,12].every(i=>pits[i]===0)){
  for(const side of [0,1]){const ids=side===0?[0,1,2,3,4,5]:[7,8,9,10,11,12];const count=ids.reduce((s,i)=>s+pits[i],0);if(!count)continue;const to=side===0?6:13;const from=ids.filter(i=>pits[i]>0);pits[to]+=count;for(const i of ids)pits[i]=0;add('sweep',from,to,count,0,`終局。残った${count}個をストアへ`)}
 }
 return frames;
}
