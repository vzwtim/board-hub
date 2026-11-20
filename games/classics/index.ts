import type {GameDefinition,GameState,PlayerID} from '../../engine/types.ts';
import {setupShogi,legalShogi,finishShogi,moveEqual,shogiBot,canDeclare,type ShogiBoard,type Move} from './shogi.ts';
import {setupChess,legalChess,finishChess,chessMoveEqual,chessBot,type ChessBoard,type ChessMove} from './chess.ts';
export type Kind='shogi'|'chess';
export type Board=ShogiBoard|ChessBoard;
export type Action=Move|ChessMove|{type:'resign'}|{type:'declare'};
export type State=GameState<Board,Action>;
export const turnOf=(b:Board):PlayerID=>b.kind==='shogi'?b.turn:b.fen.split(' ')[1]==='w'?'0':'1';
export const legal=(b:Board):Action[]=>b.kind==='shogi'?legalShogi(b):legalChess(b);
export const botAction=(b:Board):Action=>b.kind==='shogi'?shogiBot(b):chessBot(b);
export function definition(kind:Kind):GameDefinition<Board,Action>{return {id:kind,version:'1.0.0',setup:()=>kind==='shogi'?setupShogi():setupChess(),validate(b,p,a){if(!a||typeof a!=='object'||turnOf(b)!==p)return '手番が違います';if(a.type==='resign')return null;if(a.type==='declare')return b.kind==='shogi'&&canDeclare(b,p)?null:'入玉宣言の条件を満たしていません';return legal(b).some(m=>b.kind==='shogi'?moveEqual(m as Move,a as Move):a.type==='move'&&chessMoveEqual(m as ChessMove,a as ChessMove))?null:'その手は指せません'},reduce(b,p,a){if(a.type==='resign')return {board:{...b,message:(p==='0'?'先手':'後手')+'が投了しました。'},nextPlayer:p,winner:p==='0'?'1':'0'};if(a.type==='declare')return {board:{...b,message:'入玉宣言が成立しました。'},nextPlayer:p,winner:p};return b.kind==='shogi'?finishShogi(b,p,a as Move):finishChess(b,p,a as ChessMove)},playerView:b=>structuredClone(b)}}
