import type {GameInfo} from './game-catalog.ts';
export type PlayMode='cpu'|'table'|'invite';
export function playerCounts(game:Pick<GameInfo,'id'>){return ['frontier','deckworks','tileworks'].includes(game.id)?[2,3,4]:[2]}
export function defaultPlayers(game:Pick<GameInfo,'id'>){return game.id==='frontier'?4:2}
export function chosenPlayers(value:string|null,fallback=2){const n=Number(value);return [2,3,4].includes(n)?n:fallback}
export function playModes(game:Pick<GameInfo,'id'|'invite'>):PlayMode[]{return ['cpu',...(['reversi','connect4'].includes(game.id)?['table' as const]:[]),...(game.invite?['invite' as const]:[])]}
export function gameLaunchURL(game:GameInfo,mode:PlayMode,count:number){if(!playModes(game).includes(mode)||!playerCounts(game).includes(count))throw Error('対戦方法と人数を選んでください');const url=new URL(game.href,'https://boardhub.invalid');url.searchParams.set('mode',mode);if(playerCounts(game).length>1)url.searchParams.set('players',String(count));return url.pathname+url.search}
export function invitationConfig(game:GameInfo,count:number,name:string){if(!game.invite||!playerCounts(game).includes(count))throw Error('招待対戦と人数を選んでください');if(game.id==='frontier')return {api:'/api/frontier',body:{name,players:count}};if(['deckworks','tileworks'].includes(game.id))return {api:'/api/tabletop',body:{name,players:count,game:game.id}};if(['reversi','connect4'].includes(game.id))return {api:'/api/duels',body:{name,game:game.id}};if(game.id==='kalah')return {api:'/api/rooms',body:{name}};throw Error('このゲームは招待対戦に対応していません')}
