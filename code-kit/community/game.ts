import type {CodeGame} from '../../sdk/code-game.ts';
import {community,botAction,type Action,type Board,type Spec} from '../../games/community/index.ts';

export function createGame(spec:Spec):CodeGame<Board,Action,'0'|'1'> {
  return {
    definition:community,
    minPlayers:2,
    maxPlayers:2,
    parseAction(input) {
      const move=input as {type?:unknown;index?:unknown}|null;
      if(move?.type!=='play'||typeof move.index!=='number'||!Number.isInteger(move.index)) {
        throw Error('置く場所を選んでください');
      }
      return {type:'play',index:move.index};
    },
    startAction:()=>({type:'configure',spec}),
    resolveAction:(_board,_player,action)=>action,
    suggest:botAction,
  };
}
