import game from './game.ts';
import {startGame,projectGame,randomInt} from './sdk/code-game.ts';
import {applyAction} from './engine/core.ts';
export default {async fetch(request){try{
 const c=await request.json();let result;
 if(c.type==='metadata')result={id:game.definition.id,version:game.definition.version,minPlayers:game.minPlayers,maxPlayers:game.maxPlayers};
 else if(c.type==='start')result={state:startGame(game,c.players)};
 else if(c.type==='view')result={view:projectGame(game,c.state,c.player).board};
 else if(c.type==='move'){
  const parsed=c.suggest&&game.suggest?game.suggest(structuredClone(c.state.board),c.player):game.parseAction(c.action);
  const action=game.resolveAction(structuredClone(c.state.board),c.player,parsed,randomInt);
  result={state:applyAction(game.definition,c.state,{id:c.id,expectedRevision:c.state.revision,playerID:c.player,payload:action})};
 }else throw Error('Unknown operation');
 return Response.json(result);
}catch(error){return Response.json({error:String(error.message||error).slice(0,300)},{status:400})}}};
