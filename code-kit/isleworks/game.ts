import type {CodeGame} from '../../sdk/code-game.ts';
import {frontier,chanceAction,botAction,type Board,type Action,type Seat} from '../../games/frontier/index.ts';
import {parseFrontier} from '../../games/frontier/parse.ts';

/** This adapter and games/frontier are author-owned code, not a JSON rule format. */
const game:CodeGame<Board,Action,Seat>={
  definition:frontier,
  minPlayers:2,
  maxPlayers:4,
  parseAction:parseFrontier,
  startAction:(count,randomInt)=>chanceAction(frontier.setup(),'0',{type:'configure',seed:1,players:count},randomInt),
  resolveAction:chanceAction,
  suggest:botAction,
};
export default game;
