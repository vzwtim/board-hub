import {Chess,type Square,type PieceSymbol} from 'chess.js';
import type {PlayerID} from '../../engine/types.ts';
export interface ChessBoard{kind:'chess';fen:string;positions:string[];last:number[];message:string}
export type ChessMove={type:'move';from:number;to:number;promotion?:'q'|'r'|'b'|'n'};
export const square=(i:number)=>(String.fromCharCode(97+i%8)+(8-Math.floor(i/8))) as Square;
export const index=(s:string)=>(8-Number(s[1]))*8+s.charCodeAt(0)-97;
export const fenKey=(fen:string)=>fen.split(' ').slice(0,4).join(' ');
export function setupChess():ChessBoard{const fen=new Chess().fen();return {kind:'chess',fen,positions:[fenKey(fen)],last:[],message:'白から開始。駒を選んで、動かす先を選びます。'}}
export function legalChess(b:ChessBoard):ChessMove[]{return new Chess(b.fen).moves({verbose:true}).map(m=>({type:'move',from:index(m.from),to:index(m.to),...(m.promotion?{promotion:m.promotion as ChessMove['promotion']}:{})}))}
export function chessMoveEqual(a:ChessMove,b:ChessMove){return a.from===b.from&&a.to===b.to&&a.promotion===b.promotion}
export function finishChess(b:ChessBoard,p:PlayerID,m:ChessMove){const chess=new Chess(b.fen),move=chess.move({from:square(m.from),to:square(m.to),promotion:m.promotion}),fen=chess.fen(),positions=[...b.positions,fenKey(fen)];let winner:PlayerID|'draw'|undefined,message=move.san;
 if(chess.isCheckmate()){winner=p;message+=' · チェックメイト'}else if(chess.isStalemate()){winner='draw';message+=' · ステイルメイト'}else if(chess.isInsufficientMaterial()){winner='draw';message+=' · 戦力不足による引き分け'}else if(chess.isDrawByFiftyMoves()){winner='draw';message+=' · 50手ルールによる引き分け'}else if(positions.filter(k=>k===fenKey(fen)).length>=3){winner='draw';message+=' · 同一局面3回による引き分け'}else if(chess.isCheck())message+=' · チェック';return {board:{kind:'chess' as const,fen,positions,last:[m.from,m.to],message},nextPlayer:chess.turn()==='w'?'0' as const:'1' as const,winner}}
const values:Record<PieceSymbol,number>={p:100,n:320,b:330,r:500,q:900,k:0};
export function chessBot(b:ChessBoard):ChessMove{const chess=new Chess(b.fen),color=chess.turn();const score=()=>chess.board().flat().reduce((n,p)=>n+(p?(p.color===color?1:-1)*(values[p.type]+(p.type==='p'?(p.color==='w'?Number(p.square[1])-2:7-Number(p.square[1]))*5:0)):0),0);const ordered=()=>chess.moves({verbose:true}).sort((a,c)=>(c.captured?values[c.captured]:0)-(a.captured?values[a.captured]:0));let best=-Infinity,pick=ordered()[0];
 for(const move of ordered()){chess.move(move);let result=Infinity;if(chess.isCheckmate())result=100000;else{const replies=ordered();if(!replies.length)result=0;for(const reply of replies){chess.move(reply);const v=chess.isCheckmate()?-100000:score();chess.undo();result=Math.min(result,v);if(result<best)break}}chess.undo();result+=(move.piece==='n'||move.piece==='b'?3:0)+(move.flags.includes('k')||move.flags.includes('q')?12:0);if(result>best){best=result;pick=move}}
 if(!pick)throw Error('指せる手がありません');return {type:'move',from:index(pick.from),to:index(pick.to),...(pick.promotion?{promotion:pick.promotion as ChessMove['promotion']}:{})};}
