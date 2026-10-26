/** Engine state is server-owned. Clients send actions, never a replacement state. */
export type PlayerID='0'|'1';
export type TurnPhase='lobby'|'playing'|'finished';
export interface Player<P extends string=PlayerID>{id:P;name:string}
export interface MoveAction{type:'move';pit:number}
export interface Action<A,P extends string=PlayerID>{id:string;playerID:P;expectedRevision:number;payload:A}
export interface Transition<G,P extends string=PlayerID>{board:G;nextPlayer:P;winner?:P|'draw'}
export interface GameDefinition<G,A,P extends string=PlayerID>{id:string;version:string;setup():G;validate(board:G,player:P,action:A):string|null;reduce(board:G,player:P,action:A):Transition<G,P>;playerView(board:G,player:P|null):unknown}
export interface Event<A,P extends string=PlayerID>{action:Action<A,P>;revision:number;turn:number}
export interface GameState<G,A,P extends string=PlayerID>{schemaVersion:1;engineVersion:'0.1.0';gameID:string;gameVersion:string;revision:number;phase:TurnPhase;turn:number;currentPlayer:P;players:Player<P>[];board:G;winner:P|'draw'|null;events:Event<A,P>[]}
export class RuleError extends Error{code:string;constructor(code:string,message:string){super(message);this.code=code;this.name='RuleError'}}
