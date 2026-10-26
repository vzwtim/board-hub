import type {GameDefinition,GameState} from '../../engine/types.ts';
import type {Seat} from '../frontier/index.ts';
import {setupDeck,validateDeck,reduceDeck,projectDeck,deckBot,type DeckBoard,type DeckAction} from './deck.ts';
import {setupTiles,validateTiles,reduceTiles,projectTiles,tileBot,type TileBoard,type TileAction} from './tiles.ts';
export type Kind='deckworks'|'tileworks';export type Board=DeckBoard|TileBoard;export type Action=DeckAction|TileAction|{type:'configure';game:Kind;count:number;seed:number};export type State=GameState<Board,Action,Seat>;
export const tabletop:GameDefinition<Board,Action,Seat>={id:'tabletop',version:'1.0.0',setup:()=>setupDeck(),validate(b,p,a){if(!a||typeof a!=='object')return '操作を選んでください';if(a.type==='configure')return !b.configured&&b.turn===1&&[2,3,4].includes(a.count)&&['deckworks','tileworks'].includes(a.game)&&Number.isInteger(a.seed)?null:'開始設定が不正です';return b.kind==='deckworks'?validateDeck(b,p,a as DeckAction):validateTiles(b,p,a as TileAction)},reduce(b,p,a){if(a.type==='configure'){const board=a.game==='deckworks'?setupDeck(a.count,a.seed):setupTiles(a.count,a.seed);board.configured=true;return {board,nextPlayer:'0'}}return b.kind==='deckworks'?reduceDeck(b,p,a as DeckAction):reduceTiles(b,p,a as TileAction)},playerView:(b,p)=>b.kind==='deckworks'?projectDeck(b,p):projectTiles(b)};
export const tabletopBot=(b:Board,p:Seat):Action=>b.kind==='deckworks'?deckBot(b,p):tileBot(b,p);
export const projectTabletop=(b:Board,p:Seat|null,finished=false)=>b.kind==='deckworks'?projectDeck(b,p,finished):projectTiles(b);
