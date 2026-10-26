import type { GameDefinition, MoveAction, PlayerID } from '../../engine/types.ts';
export interface KalahBoard { pits: number[]; lastMove: { pit:number; captured:number; extraTurn:boolean } | null }
const range=(player:PlayerID)=>player==='0'?[0,1,2,3,4,5]:[7,8,9,10,11,12];
export const kalah:GameDefinition<KalahBoard,MoveAction>={
 id:'kalah',version:'1.0.0',
 setup:()=>({pits:Array.from({length:14},(_,i)=>i===6||i===13?0:4),lastMove:null}),
 validate(board,player,action){
   if(!action||action.type!=='move'||!Number.isInteger(action.pit))return '穴を一つ選んでください';
   if(!range(player).includes(action.pit))return '自分の側の穴を選んでください';
   if(board.pits[action.pit]===0)return '石のある穴を選んでください';
   return null;
 },
 reduce(board,player,action){
   const pits=[...board.pits],store=player==='0'?6:13,skip=player==='0'?13:6;
   let stones=pits[action.pit],pos=action.pit;pits[pos]=0;
   while(stones>0){pos=(pos+1)%14;if(pos===skip)continue;pits[pos]++;stones--}
   let captured=0;
   if(range(player).includes(pos)&&pits[pos]===1&&pits[12-pos]>0){captured=pits[12-pos]+1;pits[store]+=captured;pits[pos]=0;pits[12-pos]=0}
   const finished=range('0').every(i=>pits[i]===0)||range('1').every(i=>pits[i]===0);
   if(finished)for(const id of ['0','1'] as PlayerID[])for(const i of range(id)){pits[id==='0'?6:13]+=pits[i];pits[i]=0}
   const winner=finished?(pits[6]===pits[13]?'draw':pits[6]>pits[13]?'0':'1'):undefined;
   return {board:{pits,lastMove:{pit:action.pit,captured,extraTurn:pos===store&&!finished}},
     nextPlayer:pos===store?player:player==='0'?'1':'0',winner};
 },
 playerView:board=>structuredClone(board)
};
export function legalPits(board:KalahBoard,player:PlayerID){return range(player).filter(i=>board.pits[i]>0)}
