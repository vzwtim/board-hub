import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Chess} from 'chess.js';
import {setupChess,finishChess,legalChess,index,chessBot,fenKey} from '../games/classics/chess.ts';
import {setupShogi,legalShogi,inCheck,applyShogi,finishShogi,positionKey,shogiBot,canDeclare,type ShogiBoard} from '../games/classics/shogi.ts';
import {definition} from '../games/classics/index.ts';
import {createState,joinState,applyAction} from '../engine/core.ts';
function empty():ShogiBoard{const b=setupShogi();b.cells.fill(null);b.cells[76]={role:'k',owner:'0',promoted:false};b.cells[4]={role:'k',owner:'1',promoted:false};b.history=[];return b}
const piece=(role:'p'|'l'|'n'|'s'|'g'|'b'|'r'|'k',owner:'0'|'1'='0',promoted=false)=>({role,owner,promoted});
test('chess initial position, castling and en passant use legal moves',()=>{
 assert.equal(legalChess(setupChess()).length,20);
 let b={...setupChess(),fen:'r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1'};assert.ok(legalChess(b).some(m=>m.from===index('e1')&&m.to===index('g1')));
 b=finishChess(b,'0',{type:'move',from:index('e1'),to:index('g1')}).board;const c=new Chess(b.fen);assert.equal(c.get('f1')?.type,'r');assert.equal(c.get('g1')?.type,'k');
 const c2=new Chess();for(const m of ['e4','a6','e5','d5'])c2.move(m);b={...setupChess(),fen:c2.fen()};const next=finishChess(b,'0',{type:'move',from:index('e5'),to:index('d6')}).board;assert.equal(new Chess(next.fen).get('d5'),undefined);
});
test('chess forbids castling through check and exposes four promotion options',()=>{
 const b={...setupChess(),fen:'k4r2/8/8/8/8/8/8/4K2R w K - 0 1'};assert.ok(!legalChess(b).some(m=>m.from===index('e1')&&m.to===index('g1')));
 const promoted=legalChess({...setupChess(),fen:'7k/P7/8/8/8/8/8/7K w - - 0 1'}).filter(m=>m.from===index('a7'));assert.deepEqual(promoted.map(m=>m.promotion).sort(),['b','n','q','r']);
});
test('chess checkmate, stalemate, repetition and 50 moves finish the game',()=>{
 let b=setupChess();for(const [i,san] of ['f3','e5','g4'].entries()){const c=new Chess(b.fen),m=c.move(san);b=finishChess(b,i%2?'1':'0',{type:'move',from:index(m.from),to:index(m.to)}).board}const mate=finishChess(b,'1',{type:'move',from:index('d8'),to:index('h4')});assert.equal(mate.winner,'1');
 const stale=finishChess({...setupChess(),fen:'7k/5K2/8/6Q1/8/8/8/8 w - - 0 1'},'0',{type:'move',from:index('g5'),to:index('g6')});assert.equal(stale.winner,'draw');
 const fifty=finishChess({...setupChess(),fen:'7k/8/8/8/8/8/R7/K7 w - - 99 51'},'0',{type:'move',from:index('a2'),to:index('b2')});assert.equal(fifty.winner,'draw');
 b=setupChess();let result;for(let i=0;i<8;i++){const [from,to]=[['g1','f3'],['g8','f6'],['f3','g1'],['f6','g8']][i%4];result=finishChess(b,i%2?'1':'0',{type:'move',from:index(from),to:index(to)});b=result.board}assert.equal(result?.winner,'draw');
});
test('shogi standard setup and CPU return legal moves',()=>{const b=setupShogi();assert.equal(b.cells.filter(Boolean).length,40);assert.equal(legalShogi(b).length,30);const m=shogiBot(b);assert.ok(legalShogi(b).some(a=>JSON.stringify(a)===JSON.stringify(m)));assert.ok(legalChess(setupChess()).some(m=>JSON.stringify(m)===JSON.stringify(chessBot(setupChess()))))});
test('shogi promotion choice, forced promotion and promoted captured pieces return to hand',()=>{
 const b=empty();b.cells[27]=piece('p');assert.equal(legalShogi(b).filter(m=>m.type==='move'&&m.from===27&&m.to===18).length,2);b.cells[27]=null;b.cells[9]=piece('p');assert.deepEqual(legalShogi(b).filter(m=>m.type==='move'&&m.from===9),[{type:'move',from:9,to:0,promote:true}]);b.cells[9]=piece('r');b.cells[18]=piece('s','1',true);const next=applyShogi(b,'0',{type:'move',from:9,to:18});assert.equal(next.hands['0'].s,1);
});
test('shogi drops reject nifu, dead squares and dropping pawn mate',()=>{
 const b=empty();b.hands['0'].p=1;b.hands['0'].n=1;b.cells[54]=piece('p');let moves=legalShogi(b);assert.ok(!moves.some(m=>m.type==='drop'&&m.piece==='p'&&m.to%9===0));assert.ok(!moves.some(m=>m.type==='drop'&&(m.piece==='p'&&m.to<9||m.piece==='n'&&m.to<18)));
 const mate=empty();mate.hands['0'].p=1;mate.cells[3]=piece('l','1');mate.cells[5]=piece('l','1');mate.cells[12]=piece('p','1');mate.cells[14]=piece('p','1');mate.cells[22]=piece('g');assert.ok(!inCheck(mate,'1'));assert.ok(!legalShogi(mate).some(m=>m.type==='drop'&&m.piece==='p'&&m.to===13));
 mate.cells[3]=null;assert.ok(legalShogi(mate).some(m=>m.type==='drop'&&m.piece==='p'&&m.to===13));
});
test('shogi rejects leaving check, permits blocking drops and does not capture kings',()=>{
 const b=empty();b.cells[13]=piece('r','1');assert.ok(inCheck(b,'0'));b.hands['0'].g=1;const moves=legalShogi(b);assert.ok(moves.some(m=>m.type==='drop'&&m.to===67));assert.ok(!moves.some(m=>m.type==='drop'&&m.to===66));assert.ok(moves.every(m=>b.cells[m.to]?.role!=='k'));
});
test('shogi fourfold repetition and perpetual check have different results',()=>{
 const b=empty(),move={type:'move' as const,from:76,to:75},next=applyShogi(b,'0',move),key=positionKey(next);b.history=Array.from({length:3},()=>[{key,player:'0' as const,check:false},{key:'other',player:'1' as const,check:false}]).flat();assert.equal(finishShogi(b,'0',move).winner,'draw');
 const checking=empty();checking.cells[22]=piece('r');const m={type:'move' as const,from:22,to:13},checked=applyShogi(checking,'0',m),checkKey=positionKey(checked);checking.history=Array.from({length:3},()=>[{key:checkKey,player:'0' as const,check:true},{key:'other',player:'1' as const,check:false}]).flat();assert.equal(finishShogi(checking,'0',m).winner,'1');
});
test('engine enforces turns and illegal moves for both classic games',()=>{for(const k of ['shogi','chess'] as const){const d=definition(k),s=joinState(createState(d,{id:'0',name:'A'}),{id:'1',name:'B'});assert.throws(()=>applyAction(d,s,{id:'bad',playerID:'0',expectedRevision:s.revision,payload:{type:'move',from:0,to:80}}));assert.throws(()=>applyAction(d,s,{id:'bad',playerID:'1',expectedRevision:s.revision,payload:{type:'resign'}}));assert.equal(applyAction(d,s,{id:'resign',playerID:'0',expectedRevision:s.revision,payload:{type:'resign'}}).winner,'1')}});
test('entering-king declaration checks points, camp pieces and king safety',()=>{const b=empty();b.cells[76]=null;b.cells[18]=piece('k');assert.equal(canDeclare(b,'0'),false);for(const i of [0,1,2,3,5,6,7,8,9,10])b.cells[i]=piece('g');b.hands['0'].r=4;assert.equal(canDeclare(b,'0'),true);b.cells[4]=piece('r','1');assert.equal(canDeclare(b,'0'),true);b.cells[19]=piece('r','1');assert.equal(canDeclare(b,'0'),false)});
