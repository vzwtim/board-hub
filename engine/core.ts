import { RuleError, type GameDefinition, type GameState, type Action, type Player, type PlayerID } from './types.ts';
export function createState<G,A,P extends string=PlayerID>(game:GameDefinition<G,A,P>, owner:Player<P>):GameState<G,A,P> {
  return {schemaVersion:1,engineVersion:'0.1.0',gameID:game.id,gameVersion:game.version,
    revision:0,phase:'lobby',turn:0,currentPlayer:'0' as P,players:[owner],board:game.setup(),winner:null,events:[]};
}
export function joinState<G,A,P extends string=PlayerID>(state:GameState<G,A,P>,player:Player<P>,maxPlayers=2):GameState<G,A,P>{
 if(!Number.isInteger(maxPlayers)||maxPlayers<2||maxPlayers>4||state.phase!=='lobby'||state.players.length>=maxPlayers||String(player.id)!==String(state.players.length))throw new RuleError('ROOM_FULL','この部屋には参加できません');
 const ready=state.players.length+1===maxPlayers;
 return {...structuredClone(state),players:[...state.players,player],phase:ready?'playing':'lobby',revision:state.revision+1,turn:ready?1:0};
}
export function applyAction<G,A,P extends string=PlayerID>(game:GameDefinition<G,A,P>, state:GameState<G,A,P>, action:Action<A,P>):GameState<G,A,P> {
  if(state.gameID!==game.id||state.gameVersion!==game.version)throw new RuleError('GAME_VERSION','ゲーム版が一致しません');
  const prior=state.events.find(e=>e.action.id===action.id);
  if(prior){if(JSON.stringify(prior.action)!==JSON.stringify(action))throw new RuleError('ACTION_ID_REUSED','別の操作に同じIDは使用できません');return structuredClone(state)}
  if(action.expectedRevision!==state.revision)throw new RuleError('STALE_STATE','盤面が更新されました。最新の状態で選び直してください');
  if(state.phase!=='playing')throw new RuleError('PHASE','現在は操作できません');
  if(!state.players.some(p=>p.id===action.playerID)||state.currentPlayer!==action.playerID)throw new RuleError('NOT_YOUR_TURN','相手の手番です');
  const reason=game.validate(state.board,action.playerID,action.payload);if(reason)throw new RuleError('ILLEGAL_MOVE',reason);
  const next=game.reduce(structuredClone(state.board),action.playerID,structuredClone(action.payload));
  const revision=state.revision+1, turn=state.turn+1;
  return {...structuredClone(state),board:next.board,revision,turn,currentPlayer:next.nextPlayer,
    phase:next.winner!==undefined?'finished':'playing',winner:next.winner??null,
    events:[...state.events,{action:structuredClone(action),revision,turn}]};
}
/** Reconstruct a historical snapshot. Never write this over a competitive live match. */
export function replay<G,A,P extends string=PlayerID>(game:GameDefinition<G,A,P>, current:GameState<G,A,P>, step:number):GameState<G,A,P> {
  if(current.gameID!==game.id||current.gameVersion!==game.version)throw new RuleError('GAME_VERSION','ゲーム版が一致しません');
  if(!Number.isInteger(step)||step<0||step>current.events.length)throw new RuleError('REPLAY_RANGE','再生位置が範囲外です');
  if(current.phase==='lobby'||current.players.length<2)return structuredClone(current);
  let state=createState(game,current.players[0]);
  for(const player of current.players.slice(1))state=joinState(state,player,current.players.length);
  for(const event of current.events.slice(0,step))state=applyAction(game,state,event.action);
  return state;
}
export function publicState<G,A,P extends string=PlayerID>(game:GameDefinition<G,A,P>,state:GameState<G,A,P>,viewer:P|null) {
  // For hidden-information games, do not expose the internal event log to players.
  // This prototype exposes logs only through the Kalah adapter, a full-information game.
  return {...state,board:game.playerView(state.board,viewer)};
}
