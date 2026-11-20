import type {PlayerID} from '../../engine/types.ts';
export type Role='p'|'l'|'n'|'s'|'g'|'b'|'r'|'k';
export interface Piece{role:Role;owner:PlayerID;promoted:boolean}
export type Hand=Record<Exclude<Role,'k'>,number>;
export type Move={type:'move';from:number;to:number;promote?:boolean}|{type:'drop';piece:Exclude<Role,'k'>;to:number};
export interface ShogiBoard{kind:'shogi';cells:(Piece|null)[];hands:Record<PlayerID,Hand>;turn:PlayerID;history:{key:string;player:PlayerID|null;check:boolean}[];last:number[];message:string}
export const opposite=(p:PlayerID):PlayerID=>p==='0'?'1':'0';
const hand=():Hand=>({p:0,l:0,n:0,s:0,g:0,b:0,r:0});
export const names:Record<Role,string>={p:'歩',l:'香',n:'桂',s:'銀',g:'金',b:'角',r:'飛',k:'玉'};
export const promotedNames:Partial<Record<Role,string>>={p:'と',l:'成香',n:'成桂',s:'成銀',b:'馬',r:'龍'};
export const pieceName=(p:Piece)=>p.promoted?promotedNames[p.role]||names[p.role]:names[p.role];
export function positionKey(b:ShogiBoard){return JSON.stringify([b.cells,b.hands,b.turn])}
export function setupShogi():ShogiBoard{
 const b:ShogiBoard={kind:'shogi',cells:Array(81).fill(null),hands:{'0':hand(),'1':hand()},turn:'0',history:[],last:[],message:'駒を選んで、動かす先を選びます。先手から開始。'};
 const back:Role[]=['l','n','s','g','k','g','s','n','l'];
 for(const p of ['0','1'] as PlayerID[]){const row=p==='0'?8:0;back.forEach((role,c)=>b.cells[row*9+c]={role,owner:p,promoted:false});for(let c=0;c<9;c++)b.cells[(p==='0'?6:2)*9+c]={role:'p',owner:p,promoted:false};b.cells[(p==='0'?7:1)*9+(p==='0'?1:7)]={role:'b',owner:p,promoted:false};b.cells[(p==='0'?7:1)*9+(p==='0'?7:1)]={role:'r',owner:p,promoted:false}}
 b.history=[{key:positionKey(b),player:null,check:false}];return b;
}
const inside=(r:number,c:number)=>r>=0&&r<9&&c>=0&&c<9;
export function destinations(b:ShogiBoard,from:number):number[]{
 const piece=b.cells[from];if(!piece)return [];const f=piece.owner==='0'?-1:1,r=Math.floor(from/9),c=from%9,out:number[]=[];
 const step=(dr:number,dc:number,slide=false)=>{let y=r+dr*f,x=c+dc;while(inside(y,x)){const i=y*9+x,target=b.cells[i];if(target?.owner!==piece.owner)out.push(i);if(target||!slide)break;y+=dr*f;x+=dc}};
 const gold=()=>{for(const [dr,dc] of [[1,-1],[1,0],[1,1],[0,-1],[0,1],[-1,0]])step(dr,dc)};
 if(piece.promoted&&['p','l','n','s'].includes(piece.role)){gold();return out}
 switch(piece.role){case'p':step(1,0);break;case'l':step(1,0,true);break;case'n':step(2,-1);step(2,1);break;case's':for(const [dr,dc] of [[1,-1],[1,0],[1,1],[-1,-1],[-1,1]])step(dr,dc);break;case'g':gold();break;case'k':for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++)if(dr||dc)step(dr,dc);break;case'b':for(const dr of [-1,1])for(const dc of [-1,1])step(dr,dc,true);if(piece.promoted){for(const [dr,dc] of [[1,0],[-1,0],[0,1],[0,-1]])step(dr,dc)}break;case'r':for(const [dr,dc] of [[1,0],[-1,0],[0,1],[0,-1]])step(dr,dc,true);if(piece.promoted){for(const dr of [-1,1])for(const dc of [-1,1])step(dr,dc)}break}
 return out;
}
export function inCheck(b:ShogiBoard,p:PlayerID){const king=b.cells.findIndex(c=>c?.owner===p&&c.role==='k');return king<0||b.cells.some((c,i)=>c&&c.owner!==p&&destinations(b,i).includes(king))}
const zone=(p:PlayerID,i:number)=>p==='0'?i<27:i>=54;
const dead=(p:PlayerID,role:Role,to:number)=>{const rank=p==='0'?Math.floor(to/9):8-Math.floor(to/9);return (role==='p'||role==='l')&&rank===0||role==='n'&&rank<=1};
export function applyShogi(b:ShogiBoard,p:PlayerID,m:Move):ShogiBoard{
 const next:ShogiBoard={...b,cells:b.cells.map(c=>c?{...c}:null),hands:{'0':{...b.hands['0']},'1':{...b.hands['1']}},turn:opposite(p),last:m.type==='move'?[m.from,m.to]:[m.to]};
 if(m.type==='drop'){next.hands[p][m.piece]--;next.cells[m.to]={role:m.piece,owner:p,promoted:false}}
 else{const piece=next.cells[m.from]!,captured=next.cells[m.to];if(captured&&captured.role!=='k')next.hands[p][captured.role]++;next.cells[m.to]={...piece,promoted:piece.promoted||!!m.promote};next.cells[m.from]=null}
 return next;
}
export function legalShogi(b:ShogiBoard,p:PlayerID=b.turn,skipPawnMate=false):Move[]{
 const moves:Move[]=[];
 for(let from=0;from<81;from++){const piece=b.cells[from];if(piece?.owner!==p)continue;for(const to of destinations(b,from)){if(b.cells[to]?.role==='k')continue;const canPromote=!piece.promoted&&!['k','g'].includes(piece.role)&&(zone(p,from)||zone(p,to));if(canPromote)moves.push({type:'move',from,to,promote:true});if(piece.promoted||!dead(p,piece.role,to))moves.push({type:'move',from,to})}}
 for(const role of Object.keys(b.hands[p]) as (keyof Hand)[]){if(b.hands[p][role]<=0)continue;for(let to=0;to<81;to++){if(b.cells[to]||dead(p,role,to))continue;if(role==='p'&&b.cells.some((piece,i)=>i%9===to%9&&piece?.owner===p&&piece.role==='p'&&!piece.promoted))continue;moves.push({type:'drop',piece:role,to})}}
 return moves.filter(m=>{const next=applyShogi(b,p,m);if(inCheck(next,p))return false;if(!skipPawnMate&&m.type==='drop'&&m.piece==='p'&&inCheck(next,opposite(p))&&!legalShogi(next,opposite(p),true).length)return false;return true});
}
export function canDeclare(b:ShogiBoard,p:PlayerID){if(inCheck(b,p))return false;const king=b.cells.findIndex(c=>c?.owner===p&&c.role==='k');if(!zone(p,king))return false;const camp=b.cells.filter((c,i)=>c?.owner===p&&c.role!=='k'&&zone(p,i));if(camp.length<10)return false;const points=(r:Role)=>r==='r'||r==='b'?5:1;const score=camp.reduce((n,c)=>n+points(c!.role),0)+(Object.entries(b.hands[p]) as [Role,number][]).reduce((n,[r,c])=>n+points(r)*c,0);return score>=(p==='0'?28:27)}
export function finishShogi(b:ShogiBoard,p:PlayerID,m:Move){
 const next=applyShogi(b,p,m),check=inCheck(next,next.turn),key=positionKey(next);next.history=[...b.history,{key,player:p,check}];
 const matching=next.history.flatMap((h,i)=>h.key===key?[i]:[]);let winner:PlayerID|'draw'|undefined;
 if(matching.length>=4){const cycle=next.history.slice(matching[matching.length-4]+1);const checking=(['0','1'] as PlayerID[]).find(who=>cycle.some(h=>h.player===who)&&cycle.filter(h=>h.player===who).every(h=>h.check));winner=checking?opposite(checking):'draw';next.message=checking?'連続王手の千日手。王手を続けた側の負けです。':'千日手。勝敗をつけず、指し直します。'}
 else if(!legalShogi(next).length){winner=p;next.message=check?'詰みです。':'指せる手がなくなりました。'}
 else next.message=(m.type==='drop'?names[m.piece]+'を打ちました。':pieceName(next.cells[m.to]!)+'を動かしました。')+(check?' 王手です。':'');
 return {board:next,nextPlayer:next.turn,winner};
}
export function moveEqual(a:Move,b:Move){return a.type===b.type&&a.to===b.to&&(a.type==='drop'&&b.type==='drop'?a.piece===b.piece:a.type==='move'&&b.type==='move'&&a.from===b.from&&!!a.promote===!!b.promote)}
const value:Record<Role,number>={p:100,l:300,n:320,s:450,g:550,b:800,r:1000,k:0};
export function shogiScore(b:ShogiBoard,p:PlayerID){let n=0;for(const piece of b.cells)if(piece)n+=(piece.owner===p?1:-1)*(value[piece.role]+(piece.promoted?piece.role==='b'||piece.role==='r'?250:350:0));for(const who of ['0','1'] as PlayerID[])for(const r of Object.keys(b.hands[who]) as (keyof Hand)[])n+=(who===p?1:-1)*b.hands[who][r]*value[r]*.95;return n}
export function shogiBot(b:ShogiBoard):Move{
 const p=b.turn,moves=legalShogi(b),ordered=moves.map(m=>({m,n:shogiScore(applyShogi(b,p,m),p)})).sort((a,c)=>c.n-a.n);let best=-Infinity,pick=ordered[0]?.m;
 // Bounded two-ply search: all legal first moves; compare the strongest 16 candidates.
 for(const {m} of ordered.slice(0,16)){const next=applyShogi(b,p,m),replies=legalShogi(next);let score=Infinity;if(!replies.length)score=100000;for(const reply of replies){score=Math.min(score,shogiScore(applyShogi(next,next.turn,reply),p));if(score<best)break}const advance=m.type==='move'?(p==='0'?Math.floor(m.from/9)-Math.floor(m.to/9):Math.floor(m.to/9)-Math.floor(m.from/9)):0;score+=advance*2+(inCheck(next,next.turn)?6:0);if(score>best){best=score;pick=m}}
 if(!pick)throw Error('指せる手がありません');return pick;
}
