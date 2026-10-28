import {applyAction,createState,joinState} from '../engine/core.ts';
import {RuleError,type GameDefinition,type GameState} from '../engine/types.ts';

/** Executed by a trusted local host now; remote adapters must use isolated RPC. */
export interface CodeGame<G,A,P extends string=string> {
  definition: GameDefinition<G,A,P>;
  minPlayers: number;
  maxPlayers: number;
  parseAction(input: unknown): A;
  startAction(count: number,randomInt:(max:number)=>number): A;
  resolveAction(board:G,player:P,action:A,randomInt:(max:number)=>number):A;
  suggest?(board:G,player:P):A;
}
export function randomInt(max:number):number {
  if(!Number.isSafeInteger(max)||max<1||max>0x100000000)throw new RuleError('RANDOM_RANGE','乱数の範囲が不正です');
  const values=new Uint32Array(1),limit=Math.floor(0x100000000/max)*max;
  do {crypto.getRandomValues(values)} while(values[0]>=limit);
  return values[0]%max;
}
export function startGame<G,A,P extends string>(game:CodeGame<G,A,P>,count:number):GameState<G,A,P> {
  if(!Number.isInteger(count)||count<game.minPlayers||count>game.maxPlayers)throw new RuleError('PLAYERS','対応する参加人数を選んでください');
  let state=createState(game.definition,{id:'0' as P,name:'Player 1'});
  for(let i=1;i<count;i++)state=joinState(state,{id:String(i) as P,name:'Player '+(i+1)},count);
  return applyAction(game.definition,state,{id:'initialize',expectedRevision:state.revision,playerID:'0' as P,payload:game.startAction(count,randomInt)});
}
export function projectGame<G,A,P extends string>(game:CodeGame<G,A,P>,state:GameState<G,A,P>,viewer:P|null) {
  // Never return raw events: they can contain draws, hands or server-resolved chance.
  return {...structuredClone(state),board:game.definition.playerView(structuredClone(state.board),viewer),events:[]};
}
